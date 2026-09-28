<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Razorpay\Api\Api;

try {
    $api = new Api(env('RAZORPAY_KEY_ID'), env('RAZORPAY_KEY_SECRET'));
    $payments = $api->payment->all(['count' => 10]);
    foreach($payments->items as $p) {
        echo 'Payment: ' . $p->id . ' | Status: ' . $p->status . ' | Method: ' . $p->method . ' | Error: ' . $p->error_description . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
