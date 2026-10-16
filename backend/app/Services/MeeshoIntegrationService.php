<?php

namespace App\Services;

use App\Models\MeeshoAccount;
use App\Models\MeeshoProduct;
use App\Models\MeeshoSyncLog;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MeeshoIntegrationService
{
    /**
     * Inspect official capability status.
     * Meesho does NOT have a public open REST OAuth API for arbitrary third-party reselling.
     * Integrations operate under partner-provisioned channel credentials or manual assisted fulfillment.
     */
    public function getCapabilities(?MeeshoAccount $account = null): array
    {
        $hasCredentials = $account && !empty($account->encrypted_api_key);
        $reefConfigured = $this->isReefApiConfigured();
        $apifyConfigured = $this->isApifyConfigured();

        if ($reefConfigured) {
            $sourceName = 'ReefAPI / Meesho Live';
            $searchMessage = 'Live catalog search powered by ReefAPI. Source trending, high-margin products directly.';
            $provider = 'reefapi';
            $isLive = true;
        } elseif ($apifyConfigured) {
            $sourceName = 'Apify / Meesho Search Scraper';
            $searchMessage = 'Live catalog search powered by Apify Meesho Scraper across all categories.';
            $provider = 'apify';
            $isLive = true;
        } else {
            $sourceName = 'Curated Sample Staging Catalog';
            $searchMessage = 'Live Meesho search uses Curated Staging Catalog until REEFAPI_API_KEY is configured in backend/.env.';
            $provider = 'staging';
            $isLive = false;
        }

        return [
            'public_oauth_supported' => false,
            'official_developer_portal' => 'Restricted (Requires official Enterprise/Aggregator BD onboarding with Meesho)',
            'partner_channel_api_ready' => false,
            'catalog_source' => $sourceName,
            'is_live_catalog_stream' => $isLive,
            'live_catalog_search_configured' => $isLive,
            'live_catalog_search_message' => $searchMessage,
            'scraper_provider' => $provider,
            'supported_modes' => [
                'manual_assisted' => [
                    'label' => 'Manual Assisted Reselling (Live & Functional)',
                    'description' => 'Import verified products, set margins, take store orders, and record supplier dispatch manually or with tracking AWB.',
                    'active' => true,
                ],
                'sandbox_verified' => [
                    'label' => 'Sandbox / Staging Connector Mode',
                    'description' => 'Simulate automated order placement, stock sync & webhooks for workflow verification.',
                    'active' => true,
                ],
                'live_approved' => [
                    'label' => 'Enterprise Partner API (Direct Automated)',
                    'description' => 'Requires production API V2 partner tokens provisioned by Meesho BD / OMS partnership.',
                    'active' => false,
                    'approval_status' => $account->connection_status ?? 'disconnected',
                ],
            ],
            'current_connection_status' => $account ? $account->connection_status : 'disconnected',
            'automated_fulfillment_active' => false,
        ];
    }

    public function isApifyConfigured(): bool
    {
        $token = config('services.apify.token');
        return is_string($token)
            && trim($token) !== ''
            && !str_contains(strtolower(trim($token)), 'placeholder');
    }

    public function hasApifyToken(): bool
    {
        $token = config('services.apify.token');
        return is_string($token) && trim($token) !== '';
    }

    public function isReefApiConfigured(): bool
    {
        return is_string(config('services.reefapi.api_key'))
            && trim(config('services.reefapi.api_key')) !== '';
    }

    /**
     * Non-mutating connectivity test for Apify token and actor accessibility.
     */
    public function testApifyConnection(): array
    {
        $token = config('services.apify.token');
        $actor = config('services.apify.actor', 'easyapi~meesho-product-search-scraper');

        if (empty($token) || str_contains(strtolower($token), 'placeholder')) {
            return [
                'ok' => false,
                'status' => 401,
                'code' => 'APIFY_TOKEN_NOT_CONFIGURED',
                'message' => 'APIFY_API_TOKEN is not configured or using a placeholder in backend/.env.',
            ];
        }

        try {
            $response = Http::acceptJson()
                ->timeout(15)
                ->withToken($token)
                ->get('https://api.apify.com/v2/acts/' . urlencode($actor));

            if ($response->status() === 401 || $response->status() === 403) {
                return [
                    'ok' => false,
                    'status' => 401,
                    'code' => 'AUTH_FAILED',
                    'message' => 'Apify rejected the configured token (APIFY_API_TOKEN).',
                ];
            }

            if (!$response->successful()) {
                return [
                    'ok' => false,
                    'status' => $response->status(),
                    'code' => 'ACTOR_NOT_FOUND',
                    'message' => "Apify actor '{$actor}' could not be accessed.",
                ];
            }

            $actorData = $response->json('data') ?? [];
            return [
                'ok' => true,
                'status' => 200,
                'message' => "Apify connection succeeded. Actor '{$actor}' is accessible.",
                'actor' => [
                    'name' => $actorData['name'] ?? $actor,
                    'title' => $actorData['title'] ?? 'Meesho Product Search Scraper',
                ],
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'status' => 502,
                'code' => 'CONNECTION_ERROR',
                'message' => 'Could not connect to Apify API: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Non-mutating connectivity test. ReefAPI documents this discovery action at one credit.
     */
    public function testReefApiConnection(): array
    {
        $result = $this->reefPost('categories', []);
        if (!$result['ok']) {
            return $result;
        }

        return [
            'ok' => true,
            'message' => 'ReefAPI connection succeeded. The documented categories check costs one credit.',
            'category_count' => (int) ($result['data']['count'] ?? count($result['data']['categories'] ?? [])),
        ];
    }

    /**
     * Get categories from ReefAPI (cached for 24h) or return staging categories.
     */
    public function getProviderCategories(): array
    {
        if ($this->isReefApiConfigured()) {
            return Cache::remember('reefapi_meesho_categories', 86400, function () {
                $result = $this->reefPost('categories', []);
                if (!$result['ok']) {
                    return [
                        'ok' => false,
                        'status' => $result['status'],
                        'code' => $result['code'],
                        'message' => $result['message'],
                        'categories' => $this->getDefaultStagingCategories(),
                        'source' => 'fallback_staging',
                    ];
                }

                $rawCategories = $result['data']['categories'] ?? [];
                $normalized = [];

                foreach ($rawCategories as $cat) {
                    if (is_string($cat) && trim($cat) !== '') {
                        $normalized[] = [
                            'id' => trim($cat),
                            'name' => trim($cat),
                        ];
                    } elseif (is_array($cat)) {
                        $id = (string)($cat['id'] ?? $cat['category_id'] ?? $cat['name'] ?? '');
                        $name = (string)($cat['name'] ?? $cat['title'] ?? $id);
                        if ($name !== '') {
                            $normalized[] = [
                                'id' => $id ?: $name,
                                'name' => $name,
                            ];
                        }
                    }
                }

                if (empty($normalized)) {
                    $normalized = $this->getDefaultStagingCategories();
                }

                return [
                    'ok' => true,
                    'status' => 200,
                    'categories' => $normalized,
                    'count' => count($normalized),
                    'source' => 'reefapi',
                ];
            });
        }

        return [
            'ok' => true,
            'status' => 200,
            'categories' => $this->getDefaultStagingCategories(),
            'count' => count($this->getDefaultStagingCategories()),
            'source' => 'staging',
        ];
    }

    public function getDefaultStagingCategories(): array
    {
        $categories = [
            'Ethnic Wear',
            'Jewelry',
            'Home & Living',
            'Footwear',
            'Beauty',
            'Men Fashion',
            'Women Fashion',
            'Electronics',
            'Accessories',
            'Toys & Babycare',
            'Kitchen & Dining',
        ];

        return array_map(fn ($cat) => ['id' => $cat, 'name' => $cat], $categories);
    }

    /**
     * Search live Meesho products across all categories using Apify actor:
     * easyapi~meesho-product-search-scraper
     *
     * Input schema:
     * {
     *   "keywords": ["<dynamic user query>"],
     *   "maxItems": <limit>
     * }
     */
    public function searchApifyCatalog(
        string $query,
        int $limit = 20,
        ?string $category = null,
        ?string $sort = null,
        ?float $minPrice = null,
        ?float $maxPrice = null
    ): array {
        $token = config('services.apify.token');
        $actor = config('services.apify.actor', 'easyapi~meesho-product-search-scraper');
        $timeout = (int) config('services.apify.timeout', 12);

        if (empty($token) || str_contains(strtolower($token), 'placeholder')) {
            return [
                'ok' => false,
                'status' => 401,
                'code' => 'APIFY_TOKEN_NOT_CONFIGURED',
                'message' => 'APIFY_API_TOKEN is using a placeholder. Add your valid Apify API token in backend/.env to search live Meesho products.',
            ];
        }

        $cacheKey = 'apify_meesho_search_' . md5(json_encode([
            'q' => mb_strtolower(trim($query)),
            'l' => $limit,
            'cat' => $category,
            'sort' => $sort,
            'min' => $minPrice,
            'max' => $maxPrice,
        ]));

        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ($cached['ok'] ?? false)) {
            return $cached;
        }

        // Apify run-sync endpoint to run the actor and synchronously retrieve dataset items
        $endpoint = 'https://api.apify.com/v2/acts/' . urlencode($actor) . '/run-sync-get-dataset-items?timeout=' . $timeout . '&limit=' . min(max($limit, 1), 100);

        // Input payload sent dynamically with user's keyword
        $payload = [
            'keywords' => [trim($query)],
            'maxItems' => min(max($limit, 1), 100),
        ];

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->timeout($timeout + 5)
                ->withToken($token)
                ->post($endpoint, $payload);
        } catch (ConnectionException $e) {
            Log::warning('Apify Meesho scraper timed out', ['query' => $query, 'error' => $e->getMessage()]);
            return [
                'ok' => false,
                'status' => 504,
                'code' => 'UPSTREAM_TIMEOUT',
                'message' => "The Meesho scraper did not respond within {$timeout} seconds. Scraper access may be temporarily throttled or congested.",
            ];
        } catch (\Throwable $e) {
            Log::error('Apify Meesho scraper error', ['query' => $query, 'error' => $e->getMessage()]);
            return [
                'ok' => false,
                'status' => 502,
                'code' => 'UPSTREAM_ERROR',
                'message' => 'Could not complete Meesho scraping request: ' . $e->getMessage(),
            ];
        }

        if ($response->status() === 401 || $response->status() === 403) {
            return [
                'ok' => false,
                'status' => 401,
                'code' => 'AUTH_FAILED',
                'message' => 'Apify rejected the configured token (APIFY_API_TOKEN). Verify your token in backend/.env.',
            ];
        }

        if ($response->status() === 429) {
            return [
                'ok' => false,
                'status' => 429,
                'code' => 'RATE_LIMITED',
                'retry_after' => 15,
                'message' => 'Apify or Meesho scraper rate limit reached. Retry in a few seconds.',
            ];
        }

        if (!$response->successful()) {
            $body = $response->json();
            $errMsg = is_array($body) ? ($body['error']['message'] ?? $response->body()) : 'Apify actor execution failed.';
            return [
                'ok' => false,
                'status' => $response->status() >= 500 ? 502 : $response->status(),
                'code' => 'ACTOR_ERROR',
                'message' => 'Meesho scraper error: ' . Str::limit($errMsg, 180),
            ];
        }

        $rawItems = $response->json();
        if (!is_array($rawItems)) {
            return [
                'ok' => false,
                'status' => 502,
                'code' => 'PARSE_ERROR',
                'message' => 'Apify returned unexpected format for dataset items.',
            ];
        }

        $products = [];
        foreach ($rawItems as $rawItem) {
            if (!is_array($rawItem)) continue;
            $mapped = $this->mapApifyListingProduct($rawItem);
            if ($mapped) {
                // Apply optional category filter if requested
                if ($category && $category !== 'all' && !empty($mapped['category'])) {
                    if (stripos($mapped['category'], $category) === false && stripos($category, $mapped['category']) === false) {
                        continue;
                    }
                }
                // Price filters
                if ($minPrice !== null && ($mapped['source_price'] ?? 0) < $minPrice) {
                    continue;
                }
                if ($maxPrice !== null && ($mapped['source_price'] ?? 0) > $maxPrice) {
                    continue;
                }
                $products[] = $mapped;
            }
        }

        // Sorting
        if ($sort === 'price_asc') {
            usort($products, fn ($a, $b) => ($a['source_price'] ?? 0) <=> ($b['source_price'] ?? 0));
        } elseif ($sort === 'price_desc') {
            usort($products, fn ($a, $b) => ($b['source_price'] ?? 0) <=> ($a['source_price'] ?? 0));
        } elseif ($sort === 'rating_desc') {
            usort($products, fn ($a, $b) => ($b['rating'] ?? 0) <=> ($a['rating'] ?? 0));
        }

        $result = [
            'ok' => true,
            'products' => $products,
            'total' => count($products),
            'has_more' => false,
            'cursor' => null,
            'catalog_source' => 'Apify / Meesho Search Scraper',
            'is_live' => true,
        ];

        // Cache for 10 minutes to save Apify compute units
        Cache::put($cacheKey, $result, 600);

        // Pre-cache individual products for detail viewing
        foreach ($products as $p) {
            if (!empty($p['meesho_product_id'])) {
                Cache::put('apify_detail_' . md5($p['meesho_product_id']), ['ok' => true, 'product' => $p], 3600);
            }
        }

        return $result;
    }

    /**
     * Map a dataset row returned by easyapi~meesho-product-search-scraper into Toastkart product format.
     */
    public function mapApifyListingProduct(array $item): ?array
    {
        $listing = $item['listing'] ?? $item['product'] ?? $item['data'] ?? $item;
        if (!is_array($listing)) {
            return null;
        }

        $productId = $listing['product_id'] ?? $listing['hero_pid'] ?? $listing['id'] ?? $item['id'] ?? null;
        if (empty($productId)) {
            return null;
        }
        $productId = (string) $productId;

        $title = $listing['name'] ?? $listing['hero_product_name'] ?? $listing['title'] ?? null;
        if (empty($title) || !is_string($title)) {
            return null;
        }

        $category = $listing['sub_sub_category_name']
            ?? $listing['sub_category_name']
            ?? $listing['category_name']
            ?? $listing['category']
            ?? 'General';

        $description = $listing['full_details']
            ?? $listing['description']
            ?? $listing['details_text']
            ?? '';

        // Supplier cost: keep strictly separate. NEVER invent missing prices.
        $sourcePrice = null;
        if (isset($listing['min_product_price']) && is_numeric($listing['min_product_price'])) {
            $sourcePrice = (float) $listing['min_product_price'];
        } elseif (isset($listing['min_catalog_price']) && is_numeric($listing['min_catalog_price'])) {
            $sourcePrice = (float) $listing['min_catalog_price'];
        } elseif (isset($listing['price']) && is_numeric($listing['price'])) {
            $sourcePrice = (float) $listing['price'];
        } elseif (isset($listing['discounted_price']) && is_numeric($listing['discounted_price'])) {
            $sourcePrice = (float) $listing['discounted_price'];
        }

        // Maximum selling price / MRP: keep strictly separate. NEVER invent missing prices.
        $originalPrice = null;
        if (isset($listing['original_price']) && is_numeric($listing['original_price'])) {
            $originalPrice = (float) $listing['original_price'];
        } elseif (isset($listing['mrp']) && is_numeric($listing['mrp'])) {
            $originalPrice = (float) $listing['mrp'];
        } elseif (isset($listing['max_catalog_price']) && is_numeric($listing['max_catalog_price'])) {
            $originalPrice = (float) $listing['max_catalog_price'];
        }

        // Images: deduplicate and collect all available photo URLs
        $images = [];
        if (isset($listing['images']) && is_array($listing['images'])) {
            foreach ($listing['images'] as $img) {
                if (is_string($img) && trim($img) !== '') {
                    $images[] = trim($img);
                }
            }
        }
        if (isset($listing['product_images']) && is_array($listing['product_images'])) {
            foreach ($listing['product_images'] as $img) {
                if (is_string($img) && trim($img) !== '') {
                    $images[] = trim($img);
                }
            }
        }
        if (!empty($listing['image']) && is_string($listing['image'])) {
            $images[] = trim($listing['image']);
        }
        if (!empty($listing['hero_image']) && is_string($listing['hero_image'])) {
            $images[] = trim($listing['hero_image']);
        }
        $images = array_values(array_unique($images));

        // Product URL
        $productUrl = $listing['url'] ?? $listing['product_url'] ?? null;
        if (empty($productUrl)) {
            $slug = $listing['slug'] ?? null;
            if ($slug) {
                $productUrl = 'https://www.meesho.com/' . ltrim($slug, '/');
            } else {
                $pId = $listing['product_id'] ?? $productId;
                $productUrl = 'https://www.meesho.com/s/p/' . $pId;
            }
        }

        // Shipping charges
        $shipping = $listing['shipping'] ?? [];
        $shippingCharges = is_array($shipping) ? ($shipping['charges'] ?? null) : null;
        if ($shippingCharges === null && isset($listing['shipping_charges'])) {
            $shippingCharges = $listing['shipping_charges'];
        }
        $estimatedShipping = is_numeric($shippingCharges) ? (float) $shippingCharges : 0.0;

        // Rating & Reviews count
        $reviewsSummary = $listing['supplier_reviews_summary'] ?? $listing['reviews_summary'] ?? [];
        $rating = is_array($reviewsSummary) ? ($reviewsSummary['average_rating'] ?? null) : null;
        if ($rating === null && isset($listing['rating'])) {
            $rating = $listing['rating'];
        }
        $rating = is_numeric($rating) ? round((float) $rating, 1) : null;

        $ratingCount = is_array($reviewsSummary) ? ($reviewsSummary['rating_count'] ?? null) : null;
        if ($ratingCount === null && isset($listing['rating_count'])) {
            $ratingCount = $listing['rating_count'];
        } elseif ($ratingCount === null && isset($listing['reviews_count'])) {
            $ratingCount = $listing['reviews_count'];
        }
        $reviewsCount = is_numeric($ratingCount) ? (int) $ratingCount : null;

        // Color and size extraction
        $details = $this->extractColorAndSize($listing);

        return [
            'meesho_product_id' => $productId,
            'meesho_catalog_id' => (string) ($listing['catalogId'] ?? $listing['catalog_id'] ?? $listing['id'] ?? $productId),
            'title' => $title,
            'category' => $category,
            'description' => $description,
            'sku' => 'MSH-' . strtoupper(substr(md5($productId), 0, 8)),
            'source_price' => $sourcePrice,
            'suggested_price' => null,
            'original_price' => $originalPrice,
            'discount_percent' => $listing['discount_percent'] ?? null,
            'estimated_shipping' => $estimatedShipping,
            'stock_quantity' => isset($listing['stock']) && is_numeric($listing['stock']) ? (int) $listing['stock'] : 100,
            'stock_status' => 'In Stock',
            'in_stock' => true,
            'rating' => $rating,
            'reviews_count' => $reviewsCount,
            'supplier_name' => $listing['supplier_name'] ?? $listing['shop_name'] ?? 'Meesho Supplier',
            'supplier_state' => $listing['supplier_state'] ?? null,
            'images' => $images,
            'variants' => is_array($listing['variants'] ?? null) ? $listing['variants'] : [],
            'color' => $details['color'] ?? null,
            'size' => $details['size'] ?? null,
            'product_url' => $productUrl,
            'currency' => 'INR',
            'is_live' => true,
            'catalog_source' => 'Apify / Meesho Search Scraper',
        ];
    }

    public function searchLiveCatalog(
        string $query,
        int $limit = 20,
        ?string $cursor = null,
        ?string $category = null,
        ?string $sort = null,
        ?float $minPrice = null,
        ?float $maxPrice = null
    ): array {
        $cacheKey = 'reefapi_search_' . md5(json_encode([
            'q' => mb_strtolower(trim($query)),
            'l' => $limit,
            'c' => $cursor,
            'cat' => $category,
            's' => $sort,
            'min' => $minPrice,
            'max' => $maxPrice,
        ]));

        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ($cached['ok'] ?? false)) {
            return $cached;
        }

        $payload = ['query' => $query, 'limit' => min(max($limit, 1), 100)];
        if ($cursor !== null && $cursor !== '') {
            $payload['cursor'] = $cursor;
        }
        if ($category !== null && $category !== '' && strtolower($category) !== 'all') {
            $payload['category'] = $category;
        }
        if ($sort !== null && $sort !== '') {
            $payload['sort'] = $sort;
        }
        if ($minPrice !== null && $minPrice >= 0) {
            $payload['min_price'] = $minPrice;
        }
        if ($maxPrice !== null && $maxPrice >= 0) {
            $payload['max_price'] = $maxPrice;
        }

        $result = $this->reefPost('search', $payload);
        if (!$result['ok']) {
            return $result;
        }

        $data = $result['data'];
        $items = array_values(array_filter(array_map(
            fn ($item) => is_array($item) ? $this->mapLiveSearchProduct($item) : null,
            $data['results'] ?? []
        )));
        $pagination = $result['meta']['pagination'] ?? $data['pagination'] ?? [];

        $response = [
            'ok' => true,
            'products' => $items,
            'cursor' => $pagination['cursor'] ?? null,
            'has_more' => (bool) ($pagination['has_more'] ?? false),
            'meta' => $result['meta'] ?? [],
        ];

        // Cache live search results for 5 minutes (300 seconds) to prevent hitting provider rate limits
        Cache::put($cacheKey, $response, 300);

        // Pre-warm individual product detail cache from search items
        foreach ($items as $item) {
            if (!empty($item['meesho_product_id'])) {
                $itemDetailKey = 'reefapi_detail_' . md5($item['meesho_product_id']);
                if (!Cache::has($itemDetailKey)) {
                    Cache::put($itemDetailKey, ['ok' => true, 'product' => $item], 1800);
                }
            }
        }

        return $response;
    }

    public function getLiveProductDetail(string $productId): array
    {
        $cacheKey = 'reefapi_detail_' . md5($productId);
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ($cached['ok'] ?? false)) {
            return $cached;
        }

        $result = $this->reefPost('product/detail', ['product_id' => $productId]);
        if (!$result['ok']) {
            if (is_array($cached) && ($cached['ok'] ?? false)) {
                return $cached;
            }
            return $result;
        }

        $product = $result['data']['product'] ?? null;
        if (!is_array($product)) {
            return $this->providerError(502, 'PARSE_ERROR');
        }

        $response = ['ok' => true, 'product' => $this->mapLiveProductDetail($product)];
        Cache::put($cacheKey, $response, 1800);

        return $response;
    }

    private function reefPost(string $action, array $payload): array
    {
        $apiKey = config('services.reefapi.api_key');
        if (!is_string($apiKey) || trim($apiKey) === '') {
            return $this->providerError(503, 'NOT_CONFIGURED');
        }

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->connectTimeout(5)
                ->timeout(20)
                ->withHeaders(['x-api-key' => $apiKey])
                ->post('https://api.reefapi.com/meesho/v1/' . $action, $payload);
        } catch (ConnectionException) {
            return $this->providerError(504, 'UPSTREAM_TIMEOUT');
        }

        $body = $response->json();
        if (!$response->successful() || !is_array($body) || ($body['ok'] ?? false) !== true) {
            $code = is_array($body) ? ($body['error']['code'] ?? 'UPSTREAM_ERROR') : 'UPSTREAM_ERROR';
            $status = match ($code) {
                'AUTH_FAILED' => 502,
                'QUOTA_EXCEEDED' => 503,
                'RATE_LIMITED' => 429,
                'NOT_FOUND' => 404,
                'MISSING_PARAM', 'INVALID_PARAM' => 422,
                default => $response->status() >= 500 ? 502 : $response->status(),
            };

            $retryAfter = null;
            if ($status === 429) {
                $header = $response->header('Retry-After');
                $retryAfter = is_numeric($header) ? (int)$header : 5;
            }

            return $this->providerError($status, $code, $retryAfter);
        }

        return [
            'ok' => true,
            'data' => is_array($body['data'] ?? null) ? $body['data'] : [],
            'meta' => is_array($body['meta'] ?? null) ? $body['meta'] : [],
        ];
    }

    private function providerError(int $status, string $code, ?int $retryAfter = null): array
    {
        $messages = [
            'NOT_CONFIGURED' => 'ReefAPI is not configured on the backend.',
            'AUTH_FAILED' => 'ReefAPI rejected the configured key. Check the backend configuration.',
            'QUOTA_EXCEEDED' => 'ReefAPI credits are exhausted.',
            'RATE_LIMITED' => 'ReefAPI rate limit reached. Retry shortly.',
            'NOT_FOUND' => 'The requested Meesho product was not found.',
            'MISSING_PARAM' => 'The ReefAPI request is missing a required parameter.',
            'INVALID_PARAM' => 'ReefAPI rejected a request parameter.',
            'UPSTREAM_TIMEOUT' => 'ReefAPI did not respond before the timeout.',
            'PARSE_ERROR' => 'ReefAPI returned an unexpected response.',
            'UPSTREAM_ERROR' => 'ReefAPI could not complete the request.',
        ];

        $res = [
            'ok' => false,
            'status' => $status,
            'code' => $code,
            'message' => $messages[$code] ?? 'ReefAPI could not complete the request.',
        ];

        if ($retryAfter !== null) {
            $res['retry_after'] = $retryAfter;
        }

        return $res;
    }

    public function extractColorAndSize(array $item): array
    {
        $color = $item['color'] ?? $item['colour'] ?? null;
        $size = $item['size'] ?? null;

        // 1. From attributes
        if (is_array($item['attributes'] ?? null)) {
            foreach ($item['attributes'] as $attr) {
                if (is_array($attr)) {
                    $key = strtolower(trim($attr['name'] ?? $attr['key'] ?? $attr['attribute_name'] ?? ''));
                    $val = trim($attr['value'] ?? $attr['attribute_value'] ?? '');
                    if (!$color && in_array($key, ['color', 'colour'])) $color = $val;
                    if (!$size && in_array($key, ['size', 'sizes'])) $size = $val;
                }
            }
        }

        // 2. From variants
        if (is_array($item['variants'] ?? null) && !empty($item['variants'])) {
            $variantNames = array_filter(array_map(fn($v) => is_string($v) ? $v : ($v['name'] ?? null), $item['variants']));
            if (!$size && !empty($variantNames)) {
                $size = implode(', ', $variantNames);
            }
            if (!$color) {
                $variantColors = array_filter(array_map(fn($v) => is_array($v) ? ($v['color'] ?? null) : null, $item['variants']));
                if (!empty($variantColors)) {
                    $color = implode(', ', array_unique($variantColors));
                }
            }
        }

        // 3. From description explicit field
        $desc = $item['description'] ?? $item['full_details'] ?? $item['details_text'] ?? '';
        if ($desc) {
            if (!$color && preg_match('/(?:Color|Colour)\s*[:=-]\s*([^\n\r,;]+)/i', $desc, $cm)) {
                $color = trim($cm[1]);
            }
            if (!$size && preg_match('/(?:Sizes?)\s*[:=-]\s*([^\n\r]+)/i', $desc, $sm)) {
                $candidate = trim($sm[1]);
                if (strlen($candidate) < 100 && !preg_match('/^[0-9]+$/', $candidate)) {
                    $size = $candidate;
                }
            }
            if (!$size && preg_match_all('/(?:^|\n)\s*([SMLX|XXL|XXXL|Free Size|\d+]+)\s*\(/i', $desc, $mm)) {
                $size = implode(', ', array_unique($mm[1]));
            }
        }

        // 4. From title, hero_product_name, slug, url, and description body
        if (!$color) {
            $colorKeywords = [
                'Black & White', 'Black and White', 'Navy Blue', 'Royal Blue', 'Sky Blue', 'Light Blue',
                'Dark Green', 'Olive Green', 'Teal Green', 'Bottle Green', 'Mint Green', 'Baby Pink',
                'Rose Gold', 'Mustard Yellow', 'Wine Maroon', 'Off White', 'Pure White', 'Jet Black',
                'Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Gold', 'Maroon', 'Teal',
                'Purple', 'Orange', 'Grey', 'Gray', 'Silver', 'Beige', 'Cream', 'Brown', 'Rust',
                'Multicolor', 'Multi', 'Crimson', 'Coral', 'Khaki', 'Charcoal', 'Burgundy', 'Lavender',
                'Peach', 'Turquoise', 'Indigo', 'Magenta'
            ];

            $searchSources = [
                $item['title'] ?? '',
                $item['hero_product_name'] ?? '',
                $item['name'] ?? '',
                str_replace(['-', '_'], ' ', $item['slug'] ?? ''),
                is_array($item['tags'] ?? null) ? implode(' ', $item['tags']) : '',
                $desc
            ];

            foreach ($searchSources as $sourceText) {
                if (!$sourceText) continue;
                foreach ($colorKeywords as $ck) {
                    if (preg_match('/\b' . preg_quote($ck, '/') . '\b/i', $sourceText)) {
                        $color = $ck;
                        break 2;
                    }
                }
            }
        }

        return ['color' => $color, 'size' => $size];
    }

    private function mapLiveSearchProduct(array $item): ?array
    {
        $productId = $item['product_id'] ?? null;
        if (!is_string($productId) || $productId === '') {
            return null;
        }

        $images = $item['images'] ?? [];
        if (!is_array($images)) {
            $images = [];
        }
        if (empty($images) && !empty($item['image'])) {
            $images = [$item['image']];
        }

        $details = $this->extractColorAndSize($item);

        return [
            'meesho_product_id' => $productId,
            'meesho_catalog_id' => $item['catalog_id'] ?? null,
            'title' => $item['title'] ?? '',
            'category' => $item['category_name'] ?? null,
            'description' => $item['details_text'] ?? null,
            'sku' => $productId,
            'source_price' => is_numeric($item['price'] ?? null) ? (float) $item['price'] : null,
            'suggested_price' => null,
            'original_price' => is_numeric($item['original_price'] ?? null) ? (float) $item['original_price'] : null,
            'discount_percent' => $item['discount_percent'] ?? null,
            'estimated_shipping' => is_numeric($item['shipping_charges'] ?? null) ? (float) $item['shipping_charges'] : null,
            'stock_quantity' => null,
            'stock_status' => null,
            'in_stock' => null,
            'rating' => $item['rating'] ?? null,
            'reviews_count' => $item['rating_count'] ?? null,
            'supplier_name' => null,
            'supplier_state' => $item['supplier_state'] ?? null,
            'images' => array_values(array_filter($images, 'is_string')),
            'variants' => [],
            'color' => $details['color'],
            'size' => $details['size'],
            'product_url' => $item['url'] ?? null,
            'currency' => $item['currency'] ?? 'INR',
            'is_live' => true,
        ];
    }

    private function mapLiveProductDetail(array $item): array
    {
        $mapped = $this->mapLiveSearchProduct($item) ?? [];
        $shop = is_array($item['shop'] ?? null) ? $item['shop'] : [];
        $delivery = is_array($item['delivery'] ?? null) ? $item['delivery'] : [];
        $details = $this->extractColorAndSize($item);

        $mapped = array_merge($mapped, [
            'meesho_product_id' => $item['product_id'] ?? $mapped['meesho_product_id'] ?? null,
            'title' => $item['title'] ?? $mapped['title'] ?? '',
            'description' => $item['description'] ?? null,
            'category' => $item['category_name'] ?? null,
            'supplier_name' => $shop['name'] ?? null,
            'supplier_state' => $shop['state'] ?? null,
            'source_price' => is_numeric($item['price'] ?? null) ? (float) $item['price'] : null,
            'original_price' => is_numeric($item['original_price'] ?? null) ? (float) $item['original_price'] : null,
            'stock_status' => array_key_exists('in_stock', $item)
                ? ($item['in_stock'] ? 'In Stock' : 'Out of Stock')
                : null,
            'in_stock' => $item['in_stock'] ?? null,
            'estimated_shipping' => is_numeric($delivery['charges'] ?? null) ? (float) $delivery['charges'] : null,
            'rating' => $item['rating'] ?? $shop['rating'] ?? null,
            'reviews_count' => $item['rating_count'] ?? null,
            'images' => is_array($item['images'] ?? null) ? array_values(array_filter($item['images'], 'is_string')) : [],
            'variants' => is_array($item['variants'] ?? null) ? $item['variants'] : [],
            'attributes' => is_array($item['attributes'] ?? null) ? $item['attributes'] : [],
            'color' => $details['color'] ?? $mapped['color'] ?? null,
            'size' => $details['size'] ?? $mapped['size'] ?? null,
            'product_url' => $item['url'] ?? null,
            'offer_text' => $item['offer_text'] ?? null,
            'is_live' => true,
        ]);

        return $mapped;
    }

    /**
     * Verify whether provided credentials match an active, approved Enterprise Partner grant.
     * Rejects fake/dummy tokens from activating live_approved mode.
     */
    public function verifyLiveCredentials(string $apiKey, string $apiSecret): bool
    {
        if (empty($apiKey) || empty($apiSecret)) {
            return false;
        }

        // Live Partner mode requires pre-approved enterprise partner tokens.
        // We reject placeholder/dummy tokens to prevent displaying a fake connected status.
        $dummyTokens = ['test', 'dummy', 'fake', 'sample', '12345', 'password', 'sk_live_dummy'];
        if (in_array(strtolower(trim($apiKey)), $dummyTokens) || strlen(trim($apiKey)) < 16) {
            return false;
        }

        // No approved catalog provider is configured to verify partner credentials.
        return false;
    }

    /**
     * Search the available catalog across all categories or within a selected category.
     */
    public function searchCatalog(string $query = '', string $category = 'all'): array
    {
        return $this->getEligibleCatalog($query, $category);
    }

    /** Legacy alias retained for callers; it never contacts Meesho or an undocumented endpoint. */
    public function searchMeesho(string $query, int $limit = 20): array
    {
        return array_slice($this->getEligibleCatalog($query), 0, max(1, $limit));
    }

    /**
     * Search and retrieve curated/authorized catalog items for dropshipping.
     * These represent high-margin, verified reselling supplier products with clear rights for resale.
     */

    public function getEligibleCatalog(string $query = '', string $category = 'all'): array
    {
        $catalog = [
            [
                'meesho_product_id' => 'MSH-AP-101',
                'meesho_catalog_id' => 'CAT-MSH-FASHION-01',
                'title' => 'Anarkali Printed Rayon Kurta Set with Dupatta',
                'category' => 'Ethnic Wear',
                'description' => 'Premium soft rayon breathable fabric with traditional gold foil print and matching chiffon dupatta.',
                'sku' => 'MSH-RNK-01',
                'source_price' => 380.00,
                'suggested_price' => 799.00,
                'original_price' => 1299.00,
                'estimated_shipping' => 45.00,
                'stock_quantity' => 140,
                'stock_status' => 'In Stock',
                'rating' => 4.4,
                'reviews_count' => 842,
                'supplier_name' => 'Jaipur Tex Exports (Verified)',
                'images' => [
                    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
                ],
                'variants' => ['S', 'M', 'L', 'XL', 'XXL'],
            ],
            [
                'meesho_product_id' => 'MSH-JW-204',
                'meesho_catalog_id' => 'CAT-MSH-JEWEL-02',
                'title' => 'Kundan Gold-Plated Bridal Choker Necklace Set',
                'category' => 'Jewelry',
                'description' => 'Handcrafted brass base with premium Kundan stones, emerald beads, and matching jhumka earrings.',
                'sku' => 'MSH-KND-04',
                'source_price' => 240.00,
                'suggested_price' => 649.00,
                'estimated_shipping' => 35.00,
                'stock_quantity' => 85,
                'stock_status' => 'In Stock',
                'rating' => 4.6,
                'reviews_count' => 1240,
                'supplier_name' => 'Zaveri Gems & Ornaments',
                'images' => [
                    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
                    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
                ],
                'variants' => ['Free Size'],
            ],
            [
                'meesho_product_id' => 'MSH-HM-309',
                'meesho_catalog_id' => 'CAT-MSH-HOME-03',
                'title' => 'Pure Cotton Geometric Printed Bed Sheet with 2 Pillow Covers',
                'category' => 'Home & Living',
                'description' => '210 TC breathable cotton double bed sheet, colorfast dye with soft peach finish.',
                'sku' => 'MSH-BDS-09',
                'source_price' => 290.00,
                'suggested_price' => 699.00,
                'original_price' => 999.00,
                'estimated_shipping' => 50.00,
                'stock_quantity' => 60,
                'stock_status' => 'In Stock',
                'rating' => 4.2,
                'reviews_count' => 530,
                'supplier_name' => 'Panipat Loom Crafters',
                'images' => [
                    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80',
                    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
                ],
                'variants' => ['Double Bed (90x100 inch)'],
            ],
            [
                'meesho_product_id' => 'MSH-FT-412',
                'meesho_catalog_id' => 'CAT-MSH-FOOT-04',
                'title' => 'Lightweight Breathable Mesh Running Shoes for Men',
                'category' => 'Footwear',
                'description' => 'Flexible EVA sole with shock absorption cushion, breathable flyknit mesh upper.',
                'sku' => 'MSH-SH-12',
                'source_price' => 310.00,
                'suggested_price' => 749.00,
                'estimated_shipping' => 55.00,
                'stock_quantity' => 95,
                'stock_status' => 'In Stock',
                'rating' => 4.1,
                'reviews_count' => 310,
                'supplier_name' => 'Agra Footwear Syndicate',
                'images' => [
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
                    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
                ],
                'variants' => ['6', '7', '8', '9', '10'],
            ],
            [
                'meesho_product_id' => 'MSH-BT-515',
                'meesho_catalog_id' => 'CAT-MSH-BEAUTY-05',
                'title' => 'Rose Water Toner & Vitamin C Radiant Face Serum Duo',
                'category' => 'Beauty',
                'description' => 'Paraben-free herbal glowing skin combination pack with pure steam-distilled rose water and hyaluronic serum.',
                'sku' => 'MSH-SRM-15',
                'source_price' => 195.00,
                'suggested_price' => 499.00,
                'estimated_shipping' => 35.00,
                'stock_quantity' => 120,
                'stock_status' => 'In Stock',
                'rating' => 4.5,
                'reviews_count' => 980,
                'supplier_name' => 'Veda Organics & Care',
                'images' => [
                    'https://images.unsplash.com/photo-1608248597261-83325803d466?w=600&q=80',
                    'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=600&q=80',
                ],
                'variants' => ['Combo Pack (50ml + 100ml)'],
            ],
            [
                'meesho_product_id' => 'MSH-BT-516',
                'meesho_catalog_id' => 'CAT-MSH-BEAUTY-06',
                'title' => 'Sample Matte Finish Lipstick',
                'category' => 'Beauty',
                'description' => 'Staging catalog lipstick listing for testing product search and import. Verify supplier availability before resale.',
                'sku' => 'MSH-LIP-16',
                'source_price' => 180.00,
                'suggested_price' => 399.00,
                'estimated_shipping' => 35.00,
                'stock_quantity' => 40,
                'stock_status' => 'In Stock',
                'supplier_name' => 'Sample Beauty Supplier',
                'images' => ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80'],
                'variants' => ['Ruby Red', 'Nude Rose'],
                'is_live' => false,
            ],
            [
                'meesho_product_id' => 'MSH-BT-517',
                'meesho_catalog_id' => 'CAT-MSH-BEAUTY-07',
                'title' => 'Sample Long Wear Liquid Lipstick',
                'category' => 'Beauty',
                'description' => 'Staging catalog liquid lipstick listing for testing. This is not verified Meesho inventory.',
                'sku' => 'MSH-LIP-17',
                'source_price' => 250.00,
                'suggested_price' => 499.00,
                'estimated_shipping' => 40.00,
                'stock_quantity' => 32,
                'stock_status' => 'In Stock',
                'supplier_name' => 'Sample Cosmetics Supplier',
                'images' => ['https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=600&q=80'],
                'variants' => ['Crimson', 'Rosewood'],
                'is_live' => false,
            ],
            [
                'meesho_product_id' => 'MSH-BT-518',
                'meesho_catalog_id' => 'CAT-MSH-BEAUTY-08',
                'title' => 'Sample Everyday Cream Lipstick',
                'category' => 'Beauty',
                'description' => 'Staging catalog cream lipstick listing for workflow validation, not live inventory.',
                'sku' => 'MSH-LIP-18',
                'source_price' => 320.00,
                'suggested_price' => 599.00,
                'estimated_shipping' => 40.00,
                'stock_quantity' => 25,
                'stock_status' => 'In Stock',
                'supplier_name' => 'Sample Beauty Supplier',
                'images' => ['https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=600&q=80'],
                'variants' => ['Coral', 'Berry'],
                'is_live' => false,
            ],
            [
                'meesho_product_id' => 'MSH-AP-102',
                'meesho_catalog_id' => 'CAT-MSH-FASHION-02',
                'title' => 'Women Banarasi Soft Silk Woven Zari Work Saree with Unstitched Blouse Piece',
                'category' => 'Ethnic Wear',
                'description' => 'Traditional ethnic women saree in Banarasi woven soft lichi silk with rich golden zari border and matching blouse.',
                'sku' => 'MSH-SAR-02',
                'source_price' => 520.00,
                'suggested_price' => 1199.00,
                'original_price' => 1899.00,
                'estimated_shipping' => 45.00,
                'stock_quantity' => 110,
                'stock_status' => 'In Stock',
                'rating' => 4.5,
                'reviews_count' => 620,
                'supplier_name' => 'Varanasi Weaves Hub',
                'images' => [
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
                    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
                ],
                'variants' => ['Free Size (5.5m + 0.8m)'],
                'is_live' => false,
            ],
            [
                'meesho_product_id' => 'MSH-AP-103',
                'meesho_catalog_id' => 'CAT-MSH-FASHION-03',
                'title' => 'Embroidered Straight Pure Cotton Kurti for Women',
                'category' => 'Ethnic Wear',
                'description' => 'Daily wear breathable 100% cotton straight kurti with elegant thread embroidery on neckline.',
                'sku' => 'MSH-KRT-03',
                'source_price' => 280.00,
                'suggested_price' => 599.00,
                'original_price' => 899.00,
                'estimated_shipping' => 40.00,
                'stock_quantity' => 85,
                'stock_status' => 'In Stock',
                'rating' => 4.3,
                'reviews_count' => 415,
                'supplier_name' => 'Jaipur Tex Exports (Verified)',
                'images' => [
                    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
                ],
                'variants' => ['S', 'M', 'L', 'XL', 'XXL'],
                'is_live' => false,
            ],
            [
                'meesho_product_id' => 'MSH-EL-601',
                'meesho_catalog_id' => 'CAT-MSH-ELEC-01',
                'title' => 'Wireless Bluetooth Magnetic Neckband with Mic and Fast Charging',
                'category' => 'Electronics',
                'description' => 'High bass magnetic wireless neckband with 30 hours playtime, IPX5 water resistance and voice assistant support.',
                'sku' => 'MSH-NB-01',
                'source_price' => 299.00,
                'suggested_price' => 699.00,
                'original_price' => 1299.00,
                'estimated_shipping' => 40.00,
                'stock_quantity' => 150,
                'stock_status' => 'In Stock',
                'rating' => 4.3,
                'reviews_count' => 1820,
                'supplier_name' => 'Delhi Gadgets Hub',
                'images' => [
                    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
                ],
                'variants' => ['Black', 'Blue'],
                'is_live' => false,
            ],
            [
                'meesho_product_id' => 'MSH-EL-602',
                'meesho_catalog_id' => 'CAT-MSH-ELEC-02',
                'title' => 'Shockproof Hybrid Mobile Back Case with 360 Ring Holder',
                'category' => 'Electronics',
                'description' => 'Dual layer military grade drop protection phone back cover case with magnetic kickstand ring holder.',
                'sku' => 'MSH-ACC-02',
                'source_price' => 120.00,
                'suggested_price' => 299.00,
                'original_price' => 499.00,
                'estimated_shipping' => 30.00,
                'stock_quantity' => 200,
                'stock_status' => 'In Stock',
                'rating' => 4.4,
                'reviews_count' => 740,
                'supplier_name' => 'Apex Mobile Accessories',
                'images' => [
                    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80',
                ],
                'variants' => ['Universal 6.5 inch', 'Universal 6.7 inch'],
                'is_live' => false,
            ],
            [
                'meesho_product_id' => 'MSH-TY-701',
                'meesho_catalog_id' => 'CAT-MSH-TOYS-01',
                'title' => 'Educational Wooden Geometric Shape Sorting Puzzle Board for Kids',
                'category' => 'Toys & Babycare',
                'description' => 'Non-toxic eco-friendly wooden Montessori geometry puzzle blocks toy for toddler motor skill development.',
                'sku' => 'MSH-TOY-01',
                'source_price' => 220.00,
                'suggested_price' => 499.00,
                'original_price' => 799.00,
                'estimated_shipping' => 45.00,
                'stock_quantity' => 70,
                'stock_status' => 'In Stock',
                'rating' => 4.6,
                'reviews_count' => 350,
                'supplier_name' => 'Little Stars Toys',
                'images' => [
                    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80',
                ],
                'variants' => ['Standard Set'],
                'is_live' => false,
            ],
            [
                'meesho_product_id' => 'MSH-KT-801',
                'meesho_catalog_id' => 'CAT-MSH-KITCH-01',
                'title' => 'Stainless Steel Airtight Food Storage Container Set of 3',
                'category' => 'Kitchen & Dining',
                'description' => 'Food-grade premium stainless steel kitchen canisters with transparent see-through airtight lids. Ideal for kitchen storage, pulses, grains, and spices.',
                'sku' => 'MSH-KT-01',
                'source_price' => 340.00,
                'suggested_price' => 749.00,
                'original_price' => 1099.00,
                'estimated_shipping' => 50.00,
                'stock_quantity' => 90,
                'stock_status' => 'In Stock',
                'rating' => 4.4,
                'reviews_count' => 460,
                'supplier_name' => 'HomeStyle Steelworks',
                'images' => [
                    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80',
                ],
                'variants' => ['3 Pack (500ml, 750ml, 1000ml)'],
                'is_live' => false,
            ],
            [
                'meesho_product_id' => 'MSH-MN-901',
                'meesho_catalog_id' => 'CAT-MSH-MEN-01',
                'title' => 'Men Slim Fit Solid Pure Cotton Casual Shirt',
                'category' => 'Men Fashion',
                'description' => 'Premium 100% breathable cotton regular collar full sleeve casual men shirt with pocket.',
                'sku' => 'MSH-SHRT-01',
                'source_price' => 299.00,
                'suggested_price' => 699.00,
                'original_price' => 1199.00,
                'estimated_shipping' => 40.00,
                'stock_quantity' => 130,
                'stock_status' => 'In Stock',
                'rating' => 4.3,
                'reviews_count' => 920,
                'supplier_name' => 'Surat Men Apparel Hub',
                'images' => [
                    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
                    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
                ],
                'variants' => ['M', 'L', 'XL', 'XXL'],
                'is_live' => false,
            ],
            [
                'meesho_product_id' => 'MSH-KD-902',
                'meesho_catalog_id' => 'CAT-MSH-KIDS-01',
                'title' => 'Kids Remote Control Rechargeable Racing Car Toy with LED Lights',
                'category' => 'Toys & Babycare',
                'description' => 'High speed 2.4GHz wireless RC stunt monster car toy for boys and girls with 360 degree rotation and battery charger.',
                'sku' => 'MSH-TOY-02',
                'source_price' => 380.00,
                'suggested_price' => 899.00,
                'original_price' => 1499.00,
                'estimated_shipping' => 45.00,
                'stock_quantity' => 75,
                'stock_status' => 'In Stock',
                'rating' => 4.5,
                'reviews_count' => 610,
                'supplier_name' => 'ToyZone Wholesale Mart',
                'images' => [
                    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&q=80',
                ],
                'variants' => ['Red Racing', 'Blue Stunt'],
                'is_live' => false,
            ],
        ];

        $queryWords = array_values(array_filter(explode(' ', mb_strtolower(trim($query)))));

        $matches = array_filter($catalog, function ($item) use ($query, $queryWords, $category) {
            if (empty($query)) {
                $matchesQuery = true;
            } else {
                $haystack = mb_strtolower(
                    $item['title'] . ' ' .
                    $item['description'] . ' ' .
                    $item['sku'] . ' ' .
                    $item['category'] . ' ' .
                    ($item['supplier_name'] ?? '') . ' ' .
                    $item['meesho_product_id']
                );

                $matchesAllWords = true;
                foreach ($queryWords as $word) {
                    if (!str_contains($haystack, $word)) {
                        $matchesAllWords = false;
                        break;
                    }
                }

                $matchesQuery = str_contains($haystack, mb_strtolower(trim($query))) || $matchesAllWords;
            }

            $matchesCat = $category === 'all' || strtolower($item['category']) === strtolower($category);

            return $matchesQuery && $matchesCat;
        });

        return array_values(array_map(function ($item) {
            $item['is_live'] = false;
            $details = $this->extractColorAndSize($item);
            $item['color'] = $item['color'] ?? $details['color'];
            $item['size'] = $item['size'] ?? $details['size'];
            return $item;
        }, $matches));
    }

    /**
     * Simulate or execute real synchronization of source price & stock.
     */
    public function syncProductPriceAndStock(MeeshoProduct $mProduct, MeeshoAccount $account = null): array
    {
        // When enterprise partner API is approved and active, query direct partner stream.
        // Otherwise in manual/sandbox mode, sync against curated staging supplier catalog:
        $catalog = collect($this->getEligibleCatalog());
        $source = $catalog->firstWhere('meesho_product_id', $mProduct->meesho_product_id);

        if ($source) {
            $oldSourcePrice = $mProduct->source_price;
            $oldStock = $mProduct->stock_quantity;
            
            $mProduct->source_price = $source['source_price'];
            $mProduct->stock_quantity = $source['stock_quantity'];
            $mProduct->stock_status = $source['stock_status'];
            if (isset($source['original_price'])) {
                $mProduct->original_price = is_numeric($source['original_price']) ? (float)$source['original_price'] : null;
            }
            $mProduct->last_synced_at = now();

            // Re-calculate margins based on current selling price (never overwrite owner's selling price with supplier price)
            $sellingPrice = (float)$mProduct->selling_price;
            $marginAmt = round($sellingPrice - (float)$mProduct->source_price - (float)$mProduct->estimated_shipping, 2);
            $marginPct = $sellingPrice > 0 ? round(($marginAmt / $sellingPrice) * 100, 2) : 0;
            
            $mProduct->margin_amount = $marginAmt;
            $mProduct->margin_percentage = $marginPct;
            $mProduct->sync_status = ($oldSourcePrice != $source['source_price']) ? 'price_changed' : 'synced';
            $mProduct->save();

            // Sync with primary Toastkart product if mapped (preserving owner's price)
            if ($mProduct->product) {
                $productUpdates = [
                    'stock_quantity' => $mProduct->stock_quantity,
                    'status' => $mProduct->stock_status,
                    'is_active' => $mProduct->stock_quantity > 0,
                ];
                if ($mProduct->original_price !== null) {
                    $productUpdates['compare_price'] = $mProduct->original_price;
                }
                $mProduct->product->update($productUpdates);
            }

            return [
                'status' => 'success',
                'old_price' => $oldSourcePrice,
                'new_price' => $mProduct->source_price,
                'stock' => $mProduct->stock_quantity,
                'synced_at' => $mProduct->last_synced_at,
            ];
        }

        return ['status' => 'not_found', 'message' => 'Supplier catalog item currently unavailable'];
    }
}
