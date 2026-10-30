<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cats = App\Models\Category::where('store_id', 86)->orWhere('name', 'Retail')->orWhere('name', 'Bulk')->get();
echo "Categories found:\n" . json_encode($cats, JSON_PRETTY_PRINT) . "\n";
