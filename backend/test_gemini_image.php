<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$key = env('GEMINI_API_KEY');

$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=$key";

echo "Testing $url\n";
$data = [
    'contents' => [
        [
            'parts' => [
                ['text' => 'A beautiful landscape with mountains and a lake at sunset.']
            ]
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$error = curl_error($ch);

echo "Error: $error\n";
$decoded = json_decode($response, true);
if (isset($decoded['candidates'][0]['content']['parts'][0]['inlineData'])) {
    echo "SUCCESS! Image data found. Length: " . strlen($decoded['candidates'][0]['content']['parts'][0]['inlineData']['data']) . "\n";
} else {
    echo "Response: " . substr($response, 0, 1000) . "\n\n";
}
