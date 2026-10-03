<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$key = env('GEMINI_API_KEY');

if (!$key) {
    echo "ERROR: GEMINI_API_KEY is not configured.\n";
    exit;
}

$url = "https://generativelanguage.googleapis.com/v1beta/interactions";

$prompt = "Create a luxury men's oud perfume store with a dark purple background, gold accents, black perfume bottles, oud wood elements and a premium cinematic e-commerce style. Generate a wide professional hero image suitable for the homepage.";

$imagePromptStr = "Create a professional e-commerce hero image. High-quality product photography. Wide landscape composition suitable for a website hero. Main products clearly visible. Appropriate background, colors, and visual style based on the customer prompt: '" . $prompt . "'. No website UI, no navigation bar, no buttons, no HTML, no text, no watermarks.";

$payload = [
    'model' => 'gemini-3.1-flash-image',
    'input' => [
        [
            'type' => 'text',
            'text' => $imagePromptStr
        ]
    ],
    'response_format' => [
        'type' => 'image',
        'mime_type' => 'image/jpeg',
        'aspect_ratio' => '16:9',
        'image_size' => '1K'
    ]
];

echo "Testing Gemini image generation...\n";
echo "Sending request...\n\n";

$ch = curl_init($url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-goog-api-key: ' . $key
]);

curl_setopt($ch, CURLOPT_POST, true);

curl_setopt(
    $ch,
    CURLOPT_POSTFIELDS,
    json_encode($payload)
);

$response = curl_exec($ch);

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

$error = curl_error($ch);

curl_close($ch);

echo "HTTP Status: $httpCode\n\n";

if ($error) {

    echo "cURL Error:\n";
    echo $error . "\n";

} else {

    $result = json_decode($response, true);

    if (isset($result['output_image']['data'])) {

        echo "SUCCESS: Gemini generated an image!\n";
        echo "Image location: output_image.data\n";

        $result['output_image']['data'] = '[BASE64_DATA_TRUNCATED]';

    } elseif (isset($result['interaction']['output_image']['data'])) {

        echo "SUCCESS: Gemini generated an image!\n";
        echo "Image location: interaction.output_image.data\n";

        $result['interaction']['output_image']['data'] = '[BASE64_DATA_TRUNCATED]';

    } else {

        echo "Image data was NOT found in the response.\n";
    }

    echo "\nResponse Structure:\n";

    echo json_encode(
        $result,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
    );
}

echo "\n\nTest completed.\n";