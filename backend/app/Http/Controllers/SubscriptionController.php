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
            'basic' => 49900,
            'growth' => 99900,
            'pro' => 199900,
        ],
        'yearly' => [
            'basic' => 499900,
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
}
