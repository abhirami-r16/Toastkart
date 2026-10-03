<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$key = env('GEMINI_API_KEY');
$url = "https://generativelanguage.googleapis.com/v1beta/models?key=$key";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
file_put_contents('models.json', $response);
echo "Models saved to models.json\n";
