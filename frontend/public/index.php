<?php
// Handles dynamic OpenGraph metadata for social media scrapers (WhatsApp, Facebook, Twitter, etc.)
$host = strtolower($_SERVER['HTTP_HOST'] ?? '');
$uri = strtolower($_SERVER['REQUEST_URI'] ?? '');

$htmlPath = __DIR__ . '/index.html';
if (!file_exists($htmlPath)) {
    http_response_code(404);
    echo "Not Found";
    exit;
}

$html = file_get_contents($htmlPath);

$isAmiora = str_contains($host, 'amiora') || str_contains($host, 'cocoa') || str_contains($uri, 'amiora') || str_contains($uri, 'cocoamiora');

if ($isAmiora) {
    $html = preg_replace('/<title>.*?<\/title>/i', '<title>AMIORA</title>', $html);
    $html = preg_replace('/<link rel="icon"[^>]*>/i', '<link rel="icon" type="image/png" href="/images/amiora-favicon.png" id="dynamic-favicon" />', $html);
} elseif (str_contains($host, 'toastkart')) {
    $html = preg_replace('/<title>.*?<\/title>/i', '<title>ToastKart - E-Commerce Platform</title>', $html);
    $html = preg_replace('/<meta property="og:title"[^>]*>/i', '<meta property="og:title" content="ToastKart - E-Commerce Platform" />', $html);
}

header('Content-Type: text/html; charset=UTF-8');
echo $html;
exit;
