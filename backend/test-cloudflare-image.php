
<?php

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$accountId = $_ENV['CLOUDFLARE_ACCOUNT_ID'] ?? null;
$apiToken = $_ENV['CLOUDFLARE_API_TOKEN'] ?? null;

$model = $_ENV['CLOUDFLARE_IMAGE_MODEL']
    ?? '@cf/black-forest-labs/flux-1-schnell';

if (!$accountId || !$apiToken) {
    die("Cloudflare credentials are missing.\n");
}

$url = sprintf(
    'https://api.cloudflare.com/client/v4/accounts/%s/ai/run/%s',
    $accountId,
    $model
);

$payload = [
    'prompt' =>
        'Luxury jewelry ecommerce website hero banner, '
        . 'elegant gold necklace and diamond earrings, '
        . 'ivory and champagne gold background, '
        . 'premium studio photography, clean composition, '
        . 'realistic, sophisticated, '
        . 'no text, no logo, no watermark.',

    'steps' => 4,
];

echo "Testing Cloudflare Workers AI...\n";
echo "Model: {$model}\n";
echo "Sending request...\n\n";

$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,

    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiToken,
        'Content-Type: application/json',
        'Accept: application/json',
    ],

    CURLOPT_POSTFIELDS => json_encode($payload),

    CURLOPT_TIMEOUT => 120,
    CURLOPT_CONNECTTIMEOUT => 20,
]);

$response = curl_exec($ch);

$httpStatus = curl_getinfo(
    $ch,
    CURLINFO_HTTP_CODE
);

$curlError = curl_error($ch);

curl_close($ch);

echo "HTTP Status: {$httpStatus}\n\n";

if ($curlError) {
    echo "cURL Error:\n";
    echo $curlError . "\n";
    exit(1);
}

$data = json_decode($response, true);

if ($httpStatus < 200 || $httpStatus >= 300) {

    echo "Cloudflare request failed.\n\n";

    echo "Response:\n";

    echo json_encode(
        $data,
        JSON_PRETTY_PRINT
    );

    echo "\n";

    exit(1);
}

$imageBase64 = $data['result']['image'] ?? null;

if (!$imageBase64) {

    echo "Image data was NOT found.\n\n";

    echo "Response:\n";

    echo json_encode(
        $data,
        JSON_PRETTY_PRINT
    );

    echo "\n";

    exit(1);
}

$imageBinary = base64_decode(
    $imageBase64,
    true
);

if ($imageBinary === false) {
    die("Failed to decode image data.\n");
}

$outputDirectory =
    __DIR__ . '/storage/app/public/ai-heroes';

if (!is_dir($outputDirectory)) {

    if (!mkdir(
        $outputDirectory,
        0775,
        true
    )) {
        die("Failed to create output directory.\n");
    }
}

$outputFile =
    $outputDirectory
    . '/cloudflare-test-'
    . time()
    . '.jpg';

$bytesWritten = file_put_contents(
    $outputFile,
    $imageBinary
);

if ($bytesWritten === false) {
    die("Failed to save generated image.\n");
}

echo "SUCCESS!\n";
echo "Image saved to:\n";
echo $outputFile . "\n";
echo "Image size: {$bytesWritten} bytes\n";

