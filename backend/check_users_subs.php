<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== USERS ===\n";
foreach (App\Models\User::all() as $u) {
    $hasSub = $u->activeSubscription()->exists();
    $bypass = $u->hasSubscriptionBypass();
    $activeOrBypass = $u->hasActiveSubscriptionOrBypass();
    echo "ID: {$u->id} | Email: {$u->email} | Role: {$u->role} | ActiveSub: " . ($hasSub ? 'YES' : 'NO') . " | Bypass: " . ($bypass ? 'YES' : 'NO') . " | Access: " . ($activeOrBypass ? 'GRANTED' : 'LOCKED') . "\n";
}

echo "\n=== SUBSCRIPTIONS ===\n";
foreach (App\Models\Subscription::all() as $s) {
    echo "ID: {$s->id} | User: {$s->user_id} | Status: {$s->status} | Plan: {$s->plan_name} | Expires: {$s->expiry_date}\n";
}

