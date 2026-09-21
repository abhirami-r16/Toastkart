<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Subscription;
use Carbon\Carbon;
use Razorpay\Api\Api;

class RazorpayWebhookController extends Controller
{
    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('x-razorpay-signature');
        $secret = env('RAZORPAY_WEBHOOK_SECRET');

        if (!$signature || !$secret) {
            Log::warning('Razorpay Webhook: Missing signature or secret.');
            return response()->json(['error' => 'Invalid configuration'], 400);
        }

        try {
            $api = new Api(env('RAZORPAY_KEY_ID'), env('RAZORPAY_KEY_SECRET'));
            $api->utility->verifyWebhookSignature($payload, $signature, $secret);
        } catch (\Exception $e) {
            Log::error('Razorpay Webhook Signature Verification Failed: ' . $e->getMessage());
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $data = json_decode($payload, true);
        $eventId = $data['id'] ?? null;
        $eventType = $data['event'] ?? null;

        if (!$eventId || !$eventType) {
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        // Check for idempotency
        $existingEvent = DB::table('payment_webhook_events')->where('event_id', $eventId)->first();
        if ($existingEvent) {
            Log::info("Razorpay Webhook: Event $eventId already processed.");
            return response()->json(['status' => 'ok', 'message' => 'Already processed']);
        }

        DB::table('payment_webhook_events')->insert([
            'provider' => 'razorpay',
            'event_id' => $eventId,
            'event_type' => $eventType,
            'payload' => $payload,
            'processed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            switch ($eventType) {
                case 'subscription.charged':
                    $this->handleSubscriptionCharged($data);
                    break;
                case 'subscription.authenticated':
                case 'subscription.activated':
                    $this->handleSubscriptionActive($data);
                    break;
                case 'subscription.pending':
                    $this->handleSubscriptionPending($data);
                    break;
                case 'subscription.halted':
                case 'subscription.cancelled':
                    $this->handleSubscriptionFailed($data);
                    break;
                default:
                    Log::info("Razorpay Webhook: Unhandled event type $eventType");
                    break;
            }
        } catch (\Exception $e) {
            Log::error("Razorpay Webhook Processing Error for event $eventId: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }

        return response()->json(['status' => 'ok']);
    }

    private function handleSubscriptionCharged($data)
    {
        $subscriptionObj = $data['payload']['subscription']['entity'] ?? null;
        if (!$subscriptionObj) return;

        $razorpaySubscriptionId = $subscriptionObj['id'];
        $nextBillingAt = $subscriptionObj['charge_at'] ?? null;
        $currentEnd = $subscriptionObj['current_end'] ?? null;

        $subscription = Subscription::where('razorpay_subscription_id', $razorpaySubscriptionId)->first();

        if ($subscription) {
            $subscription->status = 'active';
            $subscription->billing_status = 'active';
            $subscription->autopay_enabled = true;
            $subscription->payment_mode = 'autopay';
            
            if ($nextBillingAt) {
                $subscription->next_billing_date = Carbon::createFromTimestamp($nextBillingAt);
            }
            
            if ($currentEnd) {
                $subscription->expiry_date = Carbon::createFromTimestamp($currentEnd);
            } elseif ($nextBillingAt) {
                $subscription->expiry_date = Carbon::createFromTimestamp($nextBillingAt);
            }
            
            $subscription->save();
            Log::info("Razorpay Webhook: Subscription $razorpaySubscriptionId charged and expiry extended.");
        } else {
            Log::warning("Razorpay Webhook: Subscription $razorpaySubscriptionId not found in DB.");
        }
    }

    private function handleSubscriptionActive($data)
    {
        $subscriptionObj = $data['payload']['subscription']['entity'] ?? null;
        if (!$subscriptionObj) return;

        $razorpaySubscriptionId = $subscriptionObj['id'];
        $subscription = Subscription::where('razorpay_subscription_id', $razorpaySubscriptionId)->first();

        if ($subscription) {
            $subscription->billing_status = 'active';
            $subscription->autopay_enabled = true;
            $subscription->payment_mode = 'autopay';
            
            $subscription->save();
            Log::info("Razorpay Webhook: Subscription $razorpaySubscriptionId marked active/authenticated.");
        } else {
            Log::warning("Razorpay Webhook: Subscription $razorpaySubscriptionId not found in DB.");
        }
    }

    private function handleSubscriptionPending($data)
    {
        $subscriptionObj = $data['payload']['subscription']['entity'] ?? null;
        if (!$subscriptionObj) return;

        $razorpaySubscriptionId = $subscriptionObj['id'];
        $subscription = Subscription::where('razorpay_subscription_id', $razorpaySubscriptionId)->first();

        if ($subscription) {
            $subscription->billing_status = 'pending';
            $subscription->save();
            Log::info("Razorpay Webhook: Subscription $razorpaySubscriptionId marked pending.");
        }
    }

    private function handleSubscriptionFailed($data)
    {
        $subscriptionObj = $data['payload']['subscription']['entity'] ?? null;
        if (!$subscriptionObj) return;

        $razorpaySubscriptionId = $subscriptionObj['id'];
        $subscription = Subscription::where('razorpay_subscription_id', $razorpaySubscriptionId)->first();

        if ($subscription) {
            $subscription->billing_status = 'failed';
            $subscription->autopay_enabled = false;
            // Intentionally not deleting or aggressively expiring if they still have days left
            $subscription->save();
            Log::info("Razorpay Webhook: Subscription $razorpaySubscriptionId marked failed/halted.");
        }
    }
}
