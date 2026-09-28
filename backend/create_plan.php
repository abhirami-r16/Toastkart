<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Razorpay\Api\Api;

try {
    $api = new Api(env('RAZORPAY_KEY_ID'), env('RAZORPAY_KEY_SECRET'));

    $planParams = [
        'period' => 'monthly',
        'interval' => 1,
        'item' => [
            'name' => 'ToastKart Basic Plan (Monthly)',
            'description' => 'Basic Plan - Monthly AutoPay',
            'amount' => 1000,
            'currency' => 'INR'
        ]
    ];

    $plan = $api->plan->create($planParams);
    echo "Successfully created plan!\n";
    echo "Plan ID: " . $plan['id'] . "\n";
    echo "Please update RAZORPAY_PLAN_BASIC_MONTHLY in your .env to this Plan ID.\n";

} catch (\Exception $e) {
    echo "Error creating plan: " . $e->getMessage() . "\n";
}
