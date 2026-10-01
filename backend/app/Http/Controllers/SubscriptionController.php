<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Razorpay\Api\Api;
use Razorpay\Api\Errors\SignatureVerificationError;

class SubscriptionController extends Controller
{
    private $plans = [
        'monthly' => [
            'basic' => 79900,
            'growth' => 99900,
            'pro' => 199900,
        ],
        'yearly' => [
            'basic' => 799900,
            'growth' => 999900,
            'pro' => 1999900,
        ]
    ];

    public function createOrder(Request $request)
    {
        $fields = $request->validate([
            'plan' => 'required|string|in:basic,growth,pro',
            'billing_cycle' => 'required|string|in:monthly,yearly',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $plan = $fields['plan'];
        $billingCycle = $fields['billing_cycle'];
        $amountInPaise = $this->plans[$billingCycle][$plan];

        try {
            $api = new Api(env('RAZORPAY_KEY_ID'), env('RAZORPAY_KEY_SECRET'));
            
            $orderData = [
                'receipt'         => 'rcptid_' . $user->id . '_' . time(),
                'amount'          => $amountInPaise, 
                'currency'        => 'INR',
                'payment_capture' => 1 // auto capture
            ];

            $razorpayOrder = $api->order->create($orderData);

            // Create pending subscription
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan' => $plan,
                'billing_cycle' => $billingCycle,
                'amount' => $amountInPaise,
                'currency' => 'INR',
                'razorpay_order_id' => $razorpayOrder['id'],
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'order_id' => $razorpayOrder['id'],
                'amount' => $amountInPaise,
                'currency' => 'INR'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment order. ' . $e->getMessage()
            ], 500);
        }
    }

    public function verifyPayment(Request $request)
    {
        $fields = $request->validate([
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $subscription = Subscription::where('razorpay_order_id', $fields['razorpay_order_id'])
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired order.'
            ], 400);
        }

        try {
            $api = new Api(env('RAZORPAY_KEY_ID'), env('RAZORPAY_KEY_SECRET'));
            $attributes = [
                'razorpay_order_id' => $fields['razorpay_order_id'],
                'razorpay_payment_id' => $fields['razorpay_payment_id'],
                'razorpay_signature' => $fields['razorpay_signature']
            ];

            $api->utility->verifyPaymentSignature($attributes);

            // Payment verified
            $startDate = now();
            $expiryDate = $subscription->billing_cycle === 'yearly' ? now()->addYear() : now()->addMonth();

            $subscription->update([
                'razorpay_payment_id' => $fields['razorpay_payment_id'],
                'razorpay_signature' => $fields['razorpay_signature'],
                'status' => 'active',
                'start_date' => $startDate,
                'expiry_date' => $expiryDate,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment verified successfully. Subscription active.'
            ]);

        } catch (SignatureVerificationError $e) {
            $subscription->update(['status' => 'failed']);
            return response()->json([
                'success' => false,
                'message' => 'Invalid payment signature.'
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed. ' . $e->getMessage()
            ], 500);
        }
    }

    public function createAutoPay(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $subscription = null;

        if ($request->has('plan') && $request->has('billing_cycle')) {
            $plan = $request->input('plan');
            $billingCycle = $request->input('billing_cycle');
            $amountInPaise = $this->plans[$billingCycle][$plan];

            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan' => $plan,
                'billing_cycle' => $billingCycle,
                'amount' => $amountInPaise,
                'currency' => 'INR',
                'status' => 'pending',
                'autopay_enabled' => false,
            ]);
        } else {
            // Fallback for Dashboard (existing active subscription)
            $subscription = Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->orderBy('id', 'desc')
                ->first();

            if (!$subscription) {
                return response()->json(['success' => false, 'message' => 'No active subscription found to enable AutoPay.'], 400);
            }

            if ($subscription->autopay_enabled) {
                return response()->json(['success' => false, 'message' => 'AutoPay is already enabled.'], 400);
            }
        }

        // Map internal plan to Razorpay Plan ID
        $planKey = strtoupper($subscription->plan . '_' . $subscription->billing_cycle);
        $razorpayPlanId = env('RAZORPAY_PLAN_' . $planKey);

        if (!$razorpayPlanId) {
            return response()->json(['success' => false, 'message' => 'AutoPay plan configuration is missing for this plan.'], 400);
        }

        try {
            $api = new Api(env('RAZORPAY_KEY_ID'), env('RAZORPAY_KEY_SECRET'));

            $subscriptionData = [
                'plan_id'         => $razorpayPlanId,
                'customer_notify' => 1,
                'total_count'     => 120, // Set appropriately based on business requirement
            ];

            // If the subscription has future expiry, we defer the start
            // Razorpay start_at requires a minimum of 24 hours into the future.
            if ($subscription->expiry_date && $subscription->expiry_date->isFuture()) {
                $hoursUntilExpiry = now()->diffInHours($subscription->expiry_date, false);
                
                if ($hoursUntilExpiry < 24) {
                    return response()->json([
                        'success' => false, 
                        'message' => 'AutoPay cannot be enabled this close to your next billing date. Please continue with manual payment for this billing cycle.'
                    ], 400);
                }
                
                $subscriptionData['start_at'] = $subscription->expiry_date->timestamp;
            }

            $razorpaySubscription = $api->subscription->create($subscriptionData);

            // Update the subscription with the new razorpay_subscription_id
            $subscription->update([
                'razorpay_subscription_id' => $razorpaySubscription['id'],
                'razorpay_plan_id' => $razorpayPlanId,
                'billing_status' => 'pending_authorization'
            ]);

            return response()->json([
                'success' => true,
                'subscription_id' => $razorpaySubscription['id']
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to initialize AutoPay. ' . $e->getMessage()
            ], 500);
        }
    }

    public function verifyAutoPay(Request $request)
    {
        $fields = $request->validate([
            'razorpay_payment_id' => 'required|string',
            'razorpay_subscription_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $subscription = Subscription::where('razorpay_subscription_id', $fields['razorpay_subscription_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Invalid subscription.'], 400);
        }

        try {
            $api = new Api(env('RAZORPAY_KEY_ID'), env('RAZORPAY_KEY_SECRET'));
            $attributes = [
                'razorpay_payment_id' => $fields['razorpay_payment_id'],
                'razorpay_subscription_id' => $fields['razorpay_subscription_id'],
                'razorpay_signature' => $fields['razorpay_signature']
            ];

            $api->utility->verifyPaymentSignature($attributes);

            // Fetch current state from Razorpay to accurately reflect it
            $rzpSubscription = $api->subscription->fetch($fields['razorpay_subscription_id']);

            // Only mark AutoPay active if Razorpay says it's active or authenticated
            if (in_array($rzpSubscription['status'], ['active', 'authenticated'])) {
                $updates = [
                    'autopay_enabled' => true,
                    'payment_mode' => 'autopay',
                    'billing_status' => $rzpSubscription['status'],
                    'razorpay_payment_id' => $fields['razorpay_payment_id'],
                    'razorpay_signature' => $fields['razorpay_signature']
                ];

                if ($subscription->status === 'pending') {
                    $updates['status'] = 'active';
                    $updates['start_date'] = now();
                    $updates['expiry_date'] = $subscription->billing_cycle === 'yearly' ? now()->addYear() : now()->addMonth();
                }

                $subscription->update($updates);
            } else {
                $subscription->update([
                    'billing_status' => $rzpSubscription['status']
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'AutoPay verified successfully.'
            ]);

        } catch (SignatureVerificationError $e) {
            return response()->json(['success' => false, 'message' => 'Invalid authorization signature.'], 400);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to verify AutoPay. ' . $e->getMessage()], 500);
        }
    }

    public function cancelAutoPay(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $subscription = Subscription::where('user_id', $user->id)
            ->where('autopay_enabled', true)
            ->whereNotNull('razorpay_subscription_id')
            ->orderBy('id', 'desc')
            ->first();

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'No active AutoPay found.'], 400);
        }

        try {
            $api = new Api(env('RAZORPAY_KEY_ID'), env('RAZORPAY_KEY_SECRET'));
            
            // Cancel the subscription at Razorpay
            // Note: cancel is typically available on $api->subscription->fetch($id)->cancel()
            $api->subscription->fetch($subscription->razorpay_subscription_id)->cancel();

            // Update local DB
            $subscription->update([
                'autopay_enabled' => false,
                'billing_status' => 'cancelled'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'AutoPay has been cancelled. Your current access remains active until expiry.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel AutoPay. ' . $e->getMessage()
            ], 500);
        }
    }
}
