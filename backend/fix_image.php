<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$store = \App\Models\Store::where('slug', 'new-store-29')->first();
$config = $store->aiConfigurations->first();
$json = json_decode($config->configuration, true);
$json['style']['heroImages'] = ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000&auto=format&fit=crop'];
$config->configuration = json_encode($json);
$config->save();
echo 'Fixed image successfully';
