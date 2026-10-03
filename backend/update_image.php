<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$store = \App\Models\Store::where('name', 'fashion hub')->first();
if ($store) {
    $configs = $store->aiConfigurations;
    foreach($configs as $c) {
        $json = json_decode($c->configuration, true);
        $json['style']['heroImage'] = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=800&fit=crop';
        $c->configuration = json_encode($json);
        $c->save();
        echo "Updated config " . $c->id . "\n";
    }
}
