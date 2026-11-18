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

$isNafi = str_contains($host, 'nafi') || str_contains($uri, 'an-nafi') || str_contains($uri, 'nafi');
$isAmiora = !$isNafi && (str_contains($host, 'amiora') || str_contains($host, 'cocoa') || str_contains($uri, 'amiora') || str_contains($uri, 'cocoamiora'));

if ($isNafi) {
    $html = preg_replace('/<title>.*?<\/title>/i', '<title>AN\' NAFI Baby Shop</title>', $html);
    $html = preg_replace('/<link rel="icon"[^>]*>/i', '<link rel="icon" type="image/png" href="/images/an-nafi-logo.png" id="dynamic-favicon" />', $html);
    $html = preg_replace('/<meta property="og:title"[^>]*>/i', '<meta property="og:title" content="AN\' NAFI Baby Shop" />', $html);
    $html = preg_replace('/<meta property="og:site_name"[^>]*>/i', '<meta property="og:site_name" content="AN\' NAFI Baby Shop" />', $html);
    $html = preg_replace('/<meta property="og:description"[^>]*>/i', '<meta property="og:description" content="Premium Baby Essentials, Clothes & Toys" />', $html);
    $html = preg_replace('/<meta property="og:image"[^>]*>/i', '<meta property="og:image" content="/images/an-nafi-logo.png" />', $html);
    $html = preg_replace('/<meta name="twitter:title"[^>]*>/i', '<meta name="twitter:title" content="AN\' NAFI Baby Shop" />', $html);
    $html = preg_replace('/<meta name="twitter:description"[^>]*>/i', '<meta name="twitter:description" content="Premium Baby Essentials, Clothes & Toys" />', $html);
    $html = preg_replace('/<meta name="twitter:image"[^>]*>/i', '<meta name="twitter:image" content="/images/an-nafi-logo.png" />', $html);
} elseif ($isAmiora) {
    $html = preg_replace('/<title>.*?<\/title>/i', '<title>AMIORA</title>', $html);
    $html = preg_replace('/<link rel="icon"[^>]*>/i', '<link rel="icon" type="image/png" href="/images/amiora-favicon.png" id="dynamic-favicon" />', $html);
    $html = preg_replace('/<meta property="og:title"[^>]*>/i', '<meta property="og:title" content="AMIORA" />', $html);
    $html = preg_replace('/<meta property="og:site_name"[^>]*>/i', '<meta property="og:site_name" content="AMIORA" />', $html);
    $html = preg_replace('/<meta property="og:description"[^>]*>/i', '<meta property="og:description" content="AMIORA - Handcrafted & Organic Coconut Essentials" />', $html);
    $html = preg_replace('/<meta property="og:image"[^>]*>/i', '<meta property="og:image" content="/images/amiora-logo.png" />', $html);
    $html = preg_replace('/<meta name="twitter:title"[^>]*>/i', '<meta name="twitter:title" content="AMIORA" />', $html);
    $html = preg_replace('/<meta name="twitter:description"[^>]*>/i', '<meta name="twitter:description" content="AMIORA - Handcrafted & Organic Coconut Essentials" />', $html);
    $html = preg_replace('/<meta name="twitter:image"[^>]*>/i', '<meta name="twitter:image" content="/images/amiora-logo.png" />', $html);
} else {
    // Default ToastKart for login, pricing, home, register, dashboard, etc.
    $html = preg_replace('/<title>.*?<\/title>/i', '<title>ToastKart - E-Commerce Platform</title>', $html);
    $html = preg_replace('/<meta property="og:title"[^>]*>/i', '<meta property="og:title" content="ToastKart - E-Commerce Platform" />', $html);
    $html = preg_replace('/<meta property="og:site_name"[^>]*>/i', '<meta property="og:site_name" content="ToastKart" />', $html);
    $html = preg_replace('/<meta property="og:description"[^>]*>/i', '<meta property="og:description" content="Launch and scale your online store with ToastKart. Multi-vendor commerce, seamless checkouts, and powerful store management." />', $html);
    $html = preg_replace('/<meta property="og:image"[^>]*>/i', '<meta property="og:image" content="/images/toastkart-og.png" />', $html);
    $html = preg_replace('/<meta name="twitter:title"[^>]*>/i', '<meta name="twitter:title" content="ToastKart - E-Commerce Platform" />', $html);
    $html = preg_replace('/<meta name="twitter:description"[^>]*>/i', '<meta name="twitter:description" content="Launch and scale your online store with ToastKart. Multi-vendor commerce, seamless checkouts, and powerful store management." />', $html);
    $html = preg_replace('/<meta name="twitter:image"[^>]*>/i', '<meta name="twitter:image" content="/images/toastkart-og.png" />', $html);
}

header('Content-Type: text/html; charset=UTF-8');
echo $html;
exit;
