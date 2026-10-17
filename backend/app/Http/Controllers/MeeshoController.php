<?php

namespace App\Http\Controllers;

use App\Models\MeeshoAccount;
use App\Models\MeeshoOrder;
use App\Models\MeeshoProduct;
use App\Models\MeeshoSyncLog;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Services\MeeshoIntegrationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MeeshoController extends Controller
{
    protected $meeshoService;
    protected $fulfillmentService;

    public function __construct(
        MeeshoIntegrationService $meeshoService,
        \App\Services\Fulfillment\MeeshoFulfillmentService $fulfillmentService
    ) {
        $this->meeshoService = $meeshoService;
        $this->fulfillmentService = $fulfillmentService;
    }

    private function getStore(Request $request): ?Store
    {
        $user = $request->user();
        if (!$user) {
            return null;
        }

        $storeId = $request->header('X-Store-Id') ?? $request->query('store_id');

        if ($storeId) {
            $query = Store::where('id', $storeId);
            if ($user->role !== 'admin') {
                $query->where('user_id', $user->id);
            }
            return $query->first();
        }

        return null;
    }

    /**
     * GET /api/meesho/status
     * Returns live connection status, approval mode, and capability metadata.
     */
    public function getStatus(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $account = MeeshoAccount::where('store_id', $store->id)->first();
        $capabilities = $this->meeshoService->getCapabilities($account);

        return response()->json([
            'store_id' => $store->id,
            'store_name' => $store->name,
            'account' => $account ? [
                'id' => $account->id,
                'supplier_id' => $account->supplier_id,
                'account_name' => $account->account_name,
                'registered_email' => $account->registered_email,
                'registered_phone' => $account->registered_phone,
                'connection_status' => $account->connection_status,
                'mode' => $account->mode,
                'connected_at' => $account->connected_at,
                'last_synced_at' => $account->last_synced_at,
                'has_api_credentials' => !empty($account->encrypted_api_key),
            ] : null,
            'capabilities' => $capabilities,
            'stats' => [
                'imported_products_count' => MeeshoProduct::where('store_id', $store->id)->count(),
                'reselling_orders_count' => MeeshoOrder::where('store_id', $store->id)->count(),
                'pending_fulfillment_count' => MeeshoOrder::where('store_id', $store->id)->where('supplier_order_status', 'Pending Placement')->count(),
                'confirmed_profit' => (float)MeeshoOrder::where('store_id', $store->id)->where('is_profit_confirmed', true)->sum('net_profit'),
                'estimated_profit' => (float)MeeshoOrder::where('store_id', $store->id)->sum('net_profit'),
            ],
        ]);
    }

    public function testReefApiConnection(Request $request)
    {
        if (!$this->getStore($request)) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $result = $this->meeshoService->testReefApiConnection();
        return response()->json($result, $result['status'] ?? 200);
    }

    public function testApifyConnection(Request $request)
    {
        if (!$this->getStore($request)) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $result = $this->meeshoService->testApifyConnection();
        return response()->json($result, $result['status'] ?? 200);
    }

    /**
     * POST /api/meesho/connect
     * Store owner initiates connection or saves partner credentials.
     * Enforces credential validation for live enterprise mode.
     */
    public function connect(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $validated = $request->validate([
            'supplier_id' => 'nullable|string|max:100',
            'account_name' => 'required|string|max:255',
            'registered_email' => 'required|email|max:255',
            'registered_phone' => 'nullable|string|max:30',
            'api_key' => 'nullable|string',
            'api_secret' => 'nullable|string',
            'mode' => 'required|string|in:manual_assisted,sandbox_verified,live_approved',
        ]);

        if ($validated['mode'] === 'live_approved') {
            $isApproved = $this->meeshoService->verifyLiveCredentials($validated['api_key'] ?? '', $validated['api_secret'] ?? '');
            if (!$isApproved) {
                // Save in pending approval state without granting live_approved
                MeeshoAccount::updateOrCreate(
                    ['store_id' => $store->id],
                    [
                        'user_id' => $request->user()->id,
                        'supplier_id' => $validated['supplier_id'] ?? null,
                        'account_name' => $validated['account_name'],
                        'registered_email' => $validated['registered_email'],
                        'registered_phone' => $validated['registered_phone'] ?? null,
                        'connection_status' => 'pending_approval',
                        'mode' => 'live_approved',
                        'notes' => 'Awaiting official Meesho Enterprise Partner BD approval.',
                    ]
                );

                return response()->json([
                    'message' => 'Live Enterprise Partner API requires Meesho business onboarding and verified credentials. Your account remains pending approval.',
                    'connection_status' => 'pending_approval',
                ], 422);
            }
            $status = 'live_approved';
        } elseif ($validated['mode'] === 'sandbox_verified') {
            $status = 'sandbox_verified';
        } else {
            $status = 'manual_active';
        }

        $account = MeeshoAccount::updateOrCreate(
            ['store_id' => $store->id],
            [
                'user_id' => $request->user()->id,
                'supplier_id' => $validated['supplier_id'] ?? ('MSH-SUP-' . rand(1000, 9999)),
                'account_name' => $validated['account_name'],
                'registered_email' => $validated['registered_email'],
                'registered_phone' => $validated['registered_phone'] ?? null,
                'connection_status' => $status,
                'mode' => $validated['mode'],
                'connected_at' => now(),
                'last_synced_at' => now(),
                'notes' => 'Configured via Toastkart Meesho Reselling Connector.',
            ]
        );

        if (!empty($validated['api_key'])) {
            $account->apiKey = $validated['api_key'];
        }
        if (!empty($validated['api_secret'])) {
            $account->apiSecret = $validated['api_secret'];
        }
        $account->save();

        MeeshoSyncLog::create([
            'store_id' => $store->id,
            'action_type' => 'connection_check',
            'status' => 'success',
            'message' => "Configured Meesho supplier account {$account->account_name} in {$account->mode} mode.",
            'payload' => ['supplier_id' => $account->supplier_id, 'status' => $account->connection_status],
        ]);

        return response()->json([
            'message' => 'Meesho account configured successfully.',
            'account' => [
                'id' => $account->id,
                'account_name' => $account->account_name,
                'registered_email' => $account->registered_email,
                'supplier_id' => $account->supplier_id,
                'connection_status' => $account->connection_status,
                'mode' => $account->mode,
                'has_api_credentials' => !empty($account->encrypted_api_key),
            ],
        ]);
    }

    /**
     * POST /api/meesho/disconnect
     */
    public function disconnect(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $account = MeeshoAccount::where('store_id', $store->id)->first();
        if ($account) {
            $account->update([
                'connection_status' => 'disconnected',
                'connected_at' => null,
            ]);

            MeeshoSyncLog::create([
                'store_id' => $store->id,
                'action_type' => 'connection_check',
                'status' => 'info',
                'message' => 'Disconnected Meesho account.',
                'payload' => ['store_id' => $store->id],
            ]);
        }

        return response()->json(['message' => 'Meesho account disconnected successfully.']);
    }

    /**
     * GET /api/meesho/catalog
     * Browse / search eligible products for dropshipping.
     */
    public function getCatalog(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $query = $request->query('query', '');
        $category = $request->query('category', 'all');

        $importedIds = MeeshoProduct::where('store_id', $store->id)->pluck('meesho_product_id')->toArray();
        $items = $this->meeshoService->getEligibleCatalog($query, $category);

        $mappedItems = array_map(function ($item) use ($importedIds) {
            $item['is_imported'] = in_array($item['meesho_product_id'], $importedIds);
            return $item;
        }, $items);

        return response()->json([
            'catalog' => $mappedItems,
            'total' => count($mappedItems),
            'catalog_source' => 'Curated Staging Catalog',
            'is_staging' => true,
            'live_search_configured' => false,
            'live_search_message' => $this->meeshoService->getCapabilities()['live_catalog_search_message'],
        ]);
    }

    /**
     * GET /api/meesho/provider-categories
     * Returns all categories exposed by the connected Meesho provider (ReefAPI),
     * or staging categories when ReefAPI is not configured.
     */
    public function getProviderCategories(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $result = $this->meeshoService->getProviderCategories();
        return response()->json($result, $result['status'] ?? 200);
    }

    /** GET /api/meesho/search: use ReefAPI live results across all categories when configured, otherwise staging only. */
    public function searchCatalog(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $validated = $request->validate([
            'query' => 'required|string|min:2|max:120',
            'category' => 'nullable|string|max:100',
            'limit' => 'nullable|integer|min:1|max:100',
            'cursor' => 'nullable|string|max:4096',
            'page' => 'nullable|integer|min:1|max:50',
            'sort' => 'nullable|string|in:relevance,price_asc,price_desc,rating_desc',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
        ]);

        $query = trim($validated['query']);
        $category = trim($validated['category'] ?? '');
        $limit = (int) ($validated['limit'] ?? 20);
        $sort = $validated['sort'] ?? null;
        $minPrice = isset($validated['min_price']) && is_numeric($validated['min_price']) ? (float)$validated['min_price'] : null;
        $maxPrice = isset($validated['max_price']) && is_numeric($validated['max_price']) ? (float)$validated['max_price'] : null;
        $importedIds = MeeshoProduct::where('store_id', $store->id)->pluck('meesho_product_id')->toArray();

        // 1. ReefAPI provider (Prioritized live provider)
        if ($this->meeshoService->isReefApiConfigured()) {
            $result = $this->meeshoService->searchLiveCatalog(
                $query,
                $limit,
                $validated['cursor'] ?? null,
                $category !== '' && strtolower($category) !== 'all' ? $category : null,
                $sort,
                $minPrice,
                $maxPrice
            );

            if ($result['ok']) {
                $rawProducts = $result['products'] ?? [];
                $items = array_map(function ($item) use ($importedIds, $store) {
                    $item['is_imported'] = in_array($item['meesho_product_id'], $importedIds, true);
                    // Pre-cache item detail for fast and reliable access
                    if (!empty($item['meesho_product_id'])) {
                        Cache::put($this->liveProductCacheKey($store->id, (string)$item['meesho_product_id']), $item, now()->addMinutes(60));
                    }
                    return $item;
                }, $rawProducts);

                // Provider safety bound filters
                if ($minPrice !== null) {
                    $items = array_values(array_filter($items, fn ($item) => ($item['source_price'] ?? 0) >= $minPrice));
                }
                if ($maxPrice !== null) {
                    $items = array_values(array_filter($items, fn ($item) => ($item['source_price'] ?? 0) <= $maxPrice));
                }

                return response()->json([
                    'catalog' => $items,
                    'total' => count($items),
                    'cursor' => $result['cursor'] ?? null,
                    'has_more' => $result['has_more'] ?? false,
                    'catalog_source' => 'ReefAPI / Meesho Live',
                    'is_staging' => false,
                    'live_search_configured' => true,
                    'category_applied' => $category !== '' && strtolower($category) !== 'all' ? $category : null,
                ]);
            }

            // Return provider error (e.g. 429 rate limit or 503)
            $errResponse = response()->json([
                'code' => $result['code'] ?? 'UPSTREAM_ERROR',
                'message' => $result['message'] ?? 'ReefAPI error occurred.',
                'retry_after' => $result['retry_after'] ?? null,
            ], $result['status'] ?? 502);

            if (!empty($result['retry_after'])) {
                $errResponse->header('Retry-After', (string)$result['retry_after']);
            }
            return $errResponse;
        }

        // 2. Apify Meesho Search Scraper fallback if configured
        if ($this->meeshoService->isApifyConfigured()) {
            $result = $this->meeshoService->searchApifyCatalog(
                $query,
                $limit,
                $category !== '' && strtolower($category) !== 'all' ? $category : null,
                $sort,
                $minPrice,
                $maxPrice
            );

            if ($result['ok'] && !empty($result['products'])) {
                $items = array_map(function ($item) use ($importedIds, $store) {
                    $item['is_imported'] = in_array($item['meesho_product_id'], $importedIds, true);
                    if (!empty($item['meesho_product_id'])) {
                        Cache::put($this->liveProductCacheKey($store->id, (string)$item['meesho_product_id']), $item, now()->addMinutes(60));
                    }
                    return $item;
                }, $result['products']);

                return response()->json([
                    'catalog' => $items,
                    'total' => count($items),
                    'cursor' => null,
                    'has_more' => false,
                    'catalog_source' => 'Apify / Meesho Search Scraper',
                    'is_staging' => false,
                    'live_search_configured' => true,
                    'category_applied' => $category !== '' && strtolower($category) !== 'all' ? $category : null,
                ]);
            }
        }

        if (strlen($query) < 2) {
            return response()->json([
                'catalog' => [],
                'total' => 0,
                'catalog_source' => 'Curated Sample Staging Catalog',
                'is_staging' => true,
                'live_search_configured' => false,
                'live_search_message' => $this->meeshoService->getCapabilities()['live_catalog_search_message'],
            ]);
        }

        $limit = min(max($limit, 1), 50);
        $page = max((int) ($validated['page'] ?? 1), 1);
        $items = $this->meeshoService->searchCatalog(
            $query,
            $category !== '' && strtolower($category) !== 'all' ? $category : 'all'
        );

        if ($minPrice !== null) {
            $items = array_values(array_filter($items, fn ($item) => ($item['source_price'] ?? 0) >= $minPrice));
        }
        if ($maxPrice !== null) {
            $items = array_values(array_filter($items, fn ($item) => ($item['source_price'] ?? 0) <= $maxPrice));
        }

        if ($sort === 'price_asc') {
            usort($items, fn ($a, $b) => ($a['source_price'] ?? 0) <=> ($b['source_price'] ?? 0));
        } elseif ($sort === 'price_desc') {
            usort($items, fn ($a, $b) => ($b['source_price'] ?? 0) <=> ($a['source_price'] ?? 0));
        } elseif ($sort === 'rating_desc') {
            usort($items, fn ($a, $b) => ($b['rating'] ?? 0) <=> ($a['rating'] ?? 0));
        }

        $total = count($items);
        $slicedItems = array_slice($items, ($page - 1) * $limit, $limit);

        $mappedItems = array_map(function ($item) use ($importedIds) {
            $item['is_imported'] = in_array($item['meesho_product_id'], $importedIds);
            return $item;
        }, $slicedItems);

        return response()->json([
            'catalog' => $mappedItems,
            'total' => $total,
            'page' => $page,
            'has_more' => $page * $limit < $total,
            'catalog_source' => 'Curated Sample Staging Catalog',
            'is_staging' => true,
            'live_search_configured' => false,
            'live_search_message' => $this->meeshoService->getCapabilities()['live_catalog_search_message'],
            'category_applied' => $category !== '' && strtolower($category) !== 'all' ? $category : null,
        ]);
    }

    /**
     * GET /api/meesho/product/{id}
     * Fetch a single catalog product by its meesho_product_id.
     * Checks imported store records first, then falls back to catalog search.
     */
    public function getProductDetail(Request $request, string $id)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        // 1. Check if cached from recent search or prior detail fetch
        $cached = Cache::get($this->liveProductCacheKey($store->id, $id));
        if (!$cached) {
            $apifyCached = Cache::get('apify_detail_' . md5($id));
            if (is_array($apifyCached) && ($apifyCached['ok'] ?? false) && isset($apifyCached['product'])) {
                $cached = $apifyCached['product'];
            }
        }

        if ($cached) {
            $imported = MeeshoProduct::where('store_id', $store->id)
                ->where('meesho_product_id', $id)
                ->with('product')
                ->first();
            $cached['is_imported'] = (bool) $imported;
            if ($imported?->product) {
                $cached['toastkart_product_id'] = $imported->product_id;
            }
            return response()->json([
                'product' => $cached,
                'catalog_source' => $cached['catalog_source'] ?? ($this->meeshoService->isApifyConfigured() ? 'Apify / Meesho Search Scraper' : 'ReefAPI / Meesho Live'),
            ]);
        }

        // 2. If ReefAPI configured, request live detail from provider
        if ($this->meeshoService->isReefApiConfigured()) {
            $result = $this->meeshoService->getLiveProductDetail($id);
            if ($result['ok']) {
                $item = $result['product'];
                $imported = MeeshoProduct::where('store_id', $store->id)
                    ->where('meesho_product_id', $id)
                    ->with('product')
                    ->first();
                $item['is_imported'] = (bool) $imported;
                if ($imported?->product) {
                    $item['toastkart_product_id'] = $imported->product_id;
                }
                Cache::put($this->liveProductCacheKey($store->id, $id), $item, now()->addMinutes(60));

                return response()->json(['product' => $item, 'catalog_source' => 'ReefAPI / Meesho Live']);
            }

            // Fallback: If ReefAPI rate-limited or failed, check if imported or in staging catalog
            $imported = MeeshoProduct::where('store_id', $store->id)
                ->where('meesho_product_id', $id)
                ->with('product')
                ->first();
            if ($imported && $imported->product) {
                $p = $imported->product;
                return response()->json([
                    'product' => [
                        'meesho_product_id' => $imported->meesho_product_id,
                        'toastkart_product_id' => $p->id,
                        'title' => $p->name,
                        'description' => $p->description,
                        'source_price' => (float)$imported->supplier_cost,
                        'suggested_price' => (float)$p->price,
                        'mrp' => (float)($p->compare_price ?: $p->price),
                        'image_url' => $p->image_url,
                        'images' => $p->images ?? (array)($p->image_url ?: []),
                        'variants' => [],
                        'is_imported' => true,
                        'category' => $p->category?->name ?? 'General',
                        'supplier_name' => 'Meesho Supplier',
                    ],
                    'catalog_source' => 'Imported Product',
                ]);
            }

            $catalog = collect($this->meeshoService->searchCatalog());
            $stagingItem = $catalog->firstWhere('meesho_product_id', $id);
            if ($stagingItem) {
                $stagingItem['is_imported'] = (bool) $imported;
                return response()->json([
                    'product' => $stagingItem,
                    'catalog_source' => 'Curated Staging Catalog',
                ]);
            }

            $errPayload = [
                'message' => $result['message'],
                'code' => $result['code'],
            ];
            if (isset($result['retry_after'])) {
                $errPayload['retry_after'] = $result['retry_after'];
            }
            return response()->json($errPayload, $result['status']);
        }

        // 3. Fallback when ReefAPI is not configured (staging catalog)
        $imported = MeeshoProduct::where('store_id', $store->id)
            ->where('meesho_product_id', $id)
            ->with('product')
            ->first();

        $importedIds = MeeshoProduct::where('store_id', $store->id)->pluck('meesho_product_id')->toArray();

        $catalog = collect($this->meeshoService->searchCatalog());
        $item = $catalog->firstWhere('meesho_product_id', $id);

        if (!$item) {
            return response()->json(['message' => 'Product not found in catalog.'], 404);
        }

        $item['is_imported'] = in_array($item['meesho_product_id'], $importedIds);
        if ($imported && $imported->product) {
            $item['toastkart_product_id'] = $imported->product_id;
        }

        return response()->json(['product' => $item]);
    }

    private function liveProductCacheKey(int $storeId, string $productId): string
    {
        return 'reefapi_meesho_product_' . $storeId . '_' . hash('sha256', $productId);
    }

    /**
     * GET /api/meesho/categories
     * Return the current store's existing categories for the import form.
     */
    public function getStoreCategories(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $hasParentId = \Illuminate\Support\Facades\Schema::hasColumn('categories', 'parent_id');

        $query = Category::where('store_id', $store->id);

        if ($hasParentId) {
            $categories = $query->whereNull('parent_id')
                ->with(['subcategories' => function ($q) use ($store) {
                    $q->where('store_id', $store->id)->orderBy('name');
                }])
                ->withCount('products')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'description']);
        } else {
            $categories = $query->withCount('products')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'description'])
                ->map(function ($cat) {
                    $cat->subcategories = [];
                    return $cat;
                });
        }

        return response()->json([
            'categories' => $categories,
            'supports_subcategories' => $hasParentId,
        ]);
    }

    /**
     * POST /api/meesho/import
     * Imports an eligible product into Toastkart catalog and maps external ID.
     */
    public function importProduct(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $validated = $request->validate([
            'meesho_product_id' => 'required|string|max:255',
            'selling_price' => 'required|numeric|min:1',
            'custom_title' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'category_id' => 'nullable|integer',
            'subcategory' => 'nullable|string|max:255',
            'subcategory_id' => 'nullable|integer',
            'description' => 'nullable|string|max:10000',
            'images' => 'nullable|array|max:10',
            'images.*' => 'required|string|max:2048',
            'stock_quantity' => 'nullable|integer|min:0',
            'product_name' => 'nullable|string|max:255',
            'supplier_price' => 'nullable|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'estimated_shipping' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|url|max:2048',
            'color' => 'nullable|string|max:255',
            'size' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $source = null;
        if ($this->meeshoService->isReefApiConfigured()) {
            $source = Cache::get($this->liveProductCacheKey($store->id, $validated['meesho_product_id']));
            if (!$source) {
                $detail = $this->meeshoService->getLiveProductDetail($validated['meesho_product_id']);
                if ($detail['ok']) {
                    $source = $detail['product'];
                    Cache::put($this->liveProductCacheKey($store->id, $validated['meesho_product_id']), $source, now()->addMinutes(60));
                }
            }
        }

        if (!$source) {
            $catalog = collect($this->meeshoService->searchCatalog());
            $source = $catalog->firstWhere('meesho_product_id', $validated['meesho_product_id']);
        }


        if (!$source) {
            $manual = $request->validate([
                'product_name' => 'required|string|max:255',
                'description' => 'nullable|string|max:10000',
                'category' => 'required|string|max:100',
                'supplier_price' => 'required|numeric|min:0',
                'estimated_shipping' => 'nullable|numeric|min:0',
                'image_url' => 'required|url|max:2048',
                'stock_quantity' => 'nullable|integer|min:0',
            ]);

            $source = [
                'meesho_product_id' => $validated['meesho_product_id'],
                'meesho_catalog_id' => 'MANUAL-ASSISTED',
                'title' => $manual['product_name'],
                'description' => $manual['description'] ?? '',
                'category' => $manual['category'],
                'sku' => null,
                'source_price' => (float) $manual['supplier_price'],
                'estimated_shipping' => (float) ($manual['estimated_shipping'] ?? 0),
                'stock_quantity' => (int) ($manual['stock_quantity'] ?? 0),
                'stock_status' => 'Manually entered; verify with supplier',
                'images' => [$manual['image_url']],
                'variants' => [],
            ];
        }

        $sellingPrice = (float)$validated['selling_price'];
        if (!is_numeric($source['source_price'] ?? null)) {
            return response()->json(['message' => 'The provider did not return a product price; this item cannot be imported safely.'], 422);
        }
        $sourcePrice = (float)$source['source_price'];
        $estimatedShipping = (float) ($source['estimated_shipping'] ?? 0);
        if ($sellingPrice < $sourcePrice) {
            return response()->json([
                'message' => 'Selling price must cover the supplier cost.',
                'errors' => ['selling_price' => ['Selling price must cover the supplier cost.']],
            ], 422);
        }
        $marginAmt = round($sellingPrice - $sourcePrice, 2);
        $marginPct = $sellingPrice > 0 ? round(($marginAmt / $sellingPrice) * 100, 2) : 0;

        $maxSellingPrice = null;
        if (isset($validated['original_price']) && is_numeric($validated['original_price']) && (float)$validated['original_price'] > 0) {
            $maxSellingPrice = (float)$validated['original_price'];
        } elseif (isset($validated['compare_price']) && is_numeric($validated['compare_price']) && (float)$validated['compare_price'] > 0) {
            $maxSellingPrice = (float)$validated['compare_price'];
        } elseif (isset($source['original_price']) && is_numeric($source['original_price']) && (float)$source['original_price'] > 0) {
            $maxSellingPrice = (float)$source['original_price'];
        }

        try {
            return DB::transaction(function () use ($store, $source, $validated, $sellingPrice, $sourcePrice, $maxSellingPrice, $estimatedShipping, $marginAmt, $marginPct) {
                $meeshoProduct = MeeshoProduct::where('store_id', $store->id)
                    ->where('meesho_product_id', $source['meesho_product_id'])
                    ->lockForUpdate()
                    ->first();

                if ($meeshoProduct?->product) {
                    return response()->json([
                        'message' => 'This product is already imported in your store.',
                        'meesho_product' => $meeshoProduct->load('product'),
                    ]);
                }

                $title = trim($validated['custom_title'] ?? $source['title']);
                $category = !empty($validated['category_id'])
                    ? Category::where('store_id', $store->id)->find($validated['category_id'])
                    : null;
                if (!empty($validated['category_id']) && !$category) {
                    return response()->json([
                        'message' => 'Selected category does not belong to this store.',
                        'errors' => ['category_id' => ['Selected category does not belong to this store.']],
                    ], 422);
                }

                $categoryName = trim($validated['category'] ?? ($source['category'] ?? ''));
                if (!$category && $categoryName !== '') {
                    $category = Category::where('store_id', $store->id)
                        ->whereRaw('LOWER(name) = ?', [mb_strtolower($categoryName)])
                        ->first();
                }
                if (!$category && !empty($validated['category_id'])) {
                    return response()->json([
                        'message' => 'Select a category for this product.',
                        'errors' => ['category_id' => ['Select a category for this product.']],
                    ], 422);
                }
                if (!$category && $categoryName !== '') {
                    $capitalizedName = ucfirst($categoryName);
                    $category = Category::create([
                        'store_id' => $store->id,
                        'name' => $categoryName,
                        'slug' => Str::slug($categoryName) . '-' . Str::random(4),
                        'description' => "Explore our curated collection of {$capitalizedName} featuring high quality designs and contemporary styles.",
                    ]);
                }
                if (!$category) {
                    return response()->json([
                        'message' => 'A valid category is required to import this product.',
                        'errors' => ['category_id' => ['Please select a category for this product.']],
                    ], 422);
                }
                $categoryName = $category->name;

                $stock = (int) ($validated['stock_quantity'] ?? $source['stock_quantity']);
                $productStatus = $stock <= 0 ? 'Out of Stock' : ($stock <= 5 ? 'Low Stock' : 'In Stock');
                $images = $validated['images'] ?? ($source['images'] ?? []);
                $description = $validated['description'] ?? $source['description'] ?? '';
                // Resolve Size: validated > source size > variants > description
                $finalSize = !empty($validated['size']) ? trim($validated['size']) : ($source['size'] ?? null);
                if (!$finalSize && is_array($source['variants'] ?? null) && !empty($source['variants'])) {
                    $variantNames = array_filter(array_map(
                        fn ($variant) => is_string($variant) ? $variant : ($variant['name'] ?? null),
                        $source['variants']
                    ));
                    if (!empty($variantNames)) {
                        $finalSize = implode(', ', $variantNames);
                    }
                }
                if (!$finalSize && !empty($description)) {
                    if (preg_match('/(?:Sizes?)\s*[:=-]\s*([^\n\r]+)/i', $description, $sm)) {
                        $candidate = trim($sm[1]);
                        if (strlen($candidate) < 100 && !preg_match('/^[0-9]+$/', $candidate)) {
                            $finalSize = $candidate;
                        }
                    }
                    if (!$finalSize && preg_match_all('/(?:^|\n)\s*([SMLX|XXL|XXXL|Free Size|\d+]+)\s*\(/i', $description, $mm)) {
                        $finalSize = implode(', ', array_unique($mm[1]));
                    }
                }

                // Resolve Color: validated > source color > attributes > variants > description > title
                $finalColor = !empty($validated['color']) ? trim($validated['color']) : ($source['color'] ?? $source['colour'] ?? null);
                if (!$finalColor && is_array($source['attributes'] ?? null)) {
                    foreach ($source['attributes'] as $attr) {
                        if (is_array($attr)) {
                            $key = strtolower(trim($attr['name'] ?? $attr['key'] ?? $attr['attribute_name'] ?? ''));
                            if (in_array($key, ['color', 'colour'])) {
                                $finalColor = trim($attr['value'] ?? $attr['attribute_value'] ?? '');
                                break;
                            }
                        }
                    }
                }
                if (!$finalColor && is_array($source['variants'] ?? null) && !empty($source['variants'])) {
                    $variantColors = array_filter(array_map(fn($v) => is_array($v) ? ($v['color'] ?? null) : null, $source['variants']));
                    if (!empty($variantColors)) {
                        $finalColor = implode(', ', array_unique($variantColors));
                    }
                }
                if (!$finalColor && !empty($description)) {
                    if (preg_match('/(?:Color|Colour)\s*[:=-]\s*([^\n\r,;]+)/i', $description, $cm)) {
                        $finalColor = trim($cm[1]);
                    }
                }
                if (!$finalColor) {
                    $colorKeywords = [
                        'Black & White', 'Black and White', 'Navy Blue', 'Royal Blue', 'Sky Blue', 'Light Blue',
                        'Dark Green', 'Olive Green', 'Teal Green', 'Bottle Green', 'Mint Green', 'Baby Pink',
                        'Rose Gold', 'Mustard Yellow', 'Wine Maroon', 'Off White', 'Pure White', 'Jet Black',
                        'Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Gold', 'Maroon', 'Teal',
                        'Purple', 'Orange', 'Grey', 'Gray', 'Silver', 'Beige', 'Cream', 'Brown', 'Rust',
                        'Multicolor', 'Multi', 'Crimson', 'Coral', 'Khaki', 'Charcoal', 'Burgundy', 'Lavender',
                        'Peach', 'Turquoise', 'Indigo', 'Magenta'
                    ];
                    $sources = [
                        $title,
                        $source['hero_product_name'] ?? '',
                        str_replace(['-', '_'], ' ', $source['slug'] ?? ''),
                        $description
                    ];
                    foreach ($sources as $st) {
                        if (!$st) continue;
                        foreach ($colorKeywords as $ck) {
                            if (preg_match('/\b' . preg_quote($ck, '/') . '\b/i', $st)) {
                                $finalColor = $ck;
                                break 2;
                            }
                        }
                    }
                }

                $isActive = isset($validated['is_active']) ? (bool) $validated['is_active'] : false;

                $product = Product::create([
                    'store_id' => $store->id,
                    'category_id' => $category->id,
                    'name' => $title,
                    'slug' => Str::slug($title) . '-' . Str::random(4),
                    'sku' => $source['sku'] ?? ('MSH-' . Str::upper(Str::random(8))),
                    'price' => $sellingPrice,
                    'compare_price' => $maxSellingPrice,
                    'stock_quantity' => $stock,
                    'description' => $description,
                    'image' => $images[0] ?? null,
                    'images' => $images,
                    'status' => $productStatus,
                    'is_active' => $isActive,
                    'color' => $finalColor,
                    'size' => $finalSize,
                ]);

                $meeshoProduct = MeeshoProduct::updateOrCreate(
                    ['store_id' => $store->id, 'meesho_product_id' => $source['meesho_product_id']],
                    [
                        'product_id' => $product->id,
                        'meesho_catalog_id' => $source['meesho_catalog_id'],
                        'title' => $title,
                        'description' => $description,
                        'category' => $categoryName,
                        'sku' => $product->sku,
                        'source_price' => $sourcePrice,
                        'selling_price' => $sellingPrice,
                        'original_price' => $maxSellingPrice,
                        'estimated_shipping' => $estimatedShipping,
                        'margin_amount' => $marginAmt,
                        'margin_percentage' => $marginPct,
                        'stock_quantity' => $stock,
                        'stock_status' => $productStatus,
                        'images' => $images,
                        'variants' => $source['variants'] ?? [],
                        'last_synced_at' => now(),
                        'sync_status' => 'synced',
                    ]
                );

                MeeshoSyncLog::create([
                    'store_id' => $store->id,
                    'action_type' => 'catalog_sync',
                    'status' => 'success',
                    'message' => "Imported product {$title} [{$source['meesho_product_id']}] at ₹{$sellingPrice}.",
                    'payload' => [
                        'product_id' => $product->id,
                        'meesho_product_id' => $source['meesho_product_id'],
                        'category_id' => $category->id,
                        'category' => $categoryName,
                        'subcategory' => $validated['subcategory'] ?? null,
                        'supplier_cost' => $sourcePrice,
                        'original_price' => $maxSellingPrice,
                        'selling_price' => $sellingPrice,
                    ],
                ]);

                return response()->json([
                    'message' => 'Product successfully imported into your store!',
                    'meesho_product' => $meeshoProduct->load('product'),
                ], 201);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                $existing = MeeshoProduct::with('product')
                    ->where('store_id', $store->id)
                    ->where('meesho_product_id', $validated['meesho_product_id'])
                    ->first();
                if ($existing) {
                    return response()->json([
                        'message' => 'This product is already imported in your store.',
                        'meesho_product' => $existing,
                    ]);
                }
            }
            throw $e;
        }
    }

    /**
     * GET /api/meesho/products
     * Returns store owner's imported reselling products.
     */
    public function getResellingProducts(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $products = MeeshoProduct::with('product')
            ->where('store_id', $store->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($products);
    }

    /**
     * PUT /api/meesho/products/{id}/price
     * Update selling price and recalculate margins.
     */
    public function updatePrice(Request $request, $id)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $product = MeeshoProduct::where('store_id', $store->id)->findOrFail($id);

        $validated = $request->validate([
            'selling_price' => 'required|numeric|min:1',
        ]);

        $newPrice = (float)$validated['selling_price'];
        $marginAmt = round($newPrice - (float)$product->source_price - (float)$product->estimated_shipping, 2);
        $marginPct = $newPrice > 0 ? round(($marginAmt / $newPrice) * 100, 2) : 0;

        $product->update([
            'selling_price' => $newPrice,
            'margin_amount' => $marginAmt,
            'margin_percentage' => $marginPct,
        ]);

        if ($product->product) {
            $product->product->update(['price' => $newPrice]);
        }

        MeeshoSyncLog::create([
            'store_id' => $store->id,
            'action_type' => 'price_sync',
            'status' => 'success',
            'message' => "Updated selling price for {$product->title} to ₹{$newPrice} (Margin: ₹{$marginAmt}).",
            'payload' => ['id' => $product->id, 'selling_price' => $newPrice],
        ]);

        return response()->json([
            'message' => 'Selling price updated successfully.',
            'product' => $product->fresh()->load('product'),
        ]);
    }

    /**
     * POST /api/meesho/products/{id}/sync
     * Sync single product price & stock with supplier.
     */
    public function syncProduct(Request $request, $id)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $product = MeeshoProduct::where('store_id', $store->id)->findOrFail($id);
        $account = MeeshoAccount::where('store_id', $store->id)->first();

        $result = $this->meeshoService->syncProductPriceAndStock($product, $account);

        MeeshoSyncLog::create([
            'store_id' => $store->id,
            'action_type' => 'stock_sync',
            'status' => $result['status'] === 'success' ? 'success' : 'warning',
            'message' => "Synchronized product {$product->title} with supplier catalog.",
            'payload' => $result,
        ]);

        return response()->json([
            'message' => 'Product synchronized with supplier catalog.',
            'result' => $result,
            'product' => $product->fresh()->load('product'),
        ]);
    }

    /**
     * POST /api/meesho/sync-all
     * Bulk sync all imported reselling products.
     */
    public function syncAllProducts(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $products = MeeshoProduct::where('store_id', $store->id)->get();
        $account = MeeshoAccount::where('store_id', $store->id)->first();

        $synced = 0;
        foreach ($products as $p) {
            $this->meeshoService->syncProductPriceAndStock($p, $account);
            $synced++;
        }

        MeeshoSyncLog::create([
            'store_id' => $store->id,
            'action_type' => 'catalog_sync',
            'status' => 'success',
            'message' => "Bulk synchronized {$synced} reselling products.",
            'payload' => ['synced_count' => $synced],
        ]);

        return response()->json([
            'message' => "Successfully synchronized {$synced} products.",
            'synced_count' => $synced,
        ]);
    }

    /**
     * GET /api/meesho/orders
     * Fetch customer orders eligible for / mapped to Meesho dropshipping.
     */
    public function getOrders(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $orders = MeeshoOrder::with(['order.items.product', 'meeshoProduct'])
            ->where('store_id', $store->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($orders);
    }

    /**
     * POST /api/meesho/orders/create-from-toastkart
     * Maps an existing Toastkart store order to a Meesho Dropshipping fulfilment record.
     */
    public function mapOrder(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'meesho_product_id' => 'nullable|integer',
        ]);

        $order = Order::with('items.product')->where('store_id', $store->id)->findOrFail($validated['order_id']);

        // Check if already mapped
        $existing = MeeshoOrder::where('order_id', $order->id)->first();
        if ($existing) {
            return response()->json([
                'message' => 'This order is already in the dropshipping processing queue.',
                'order' => $existing->load(['order', 'meeshoProduct']),
            ], 200);
        }

        $mProduct = null;
        if (!empty($validated['meesho_product_id'])) {
            $mProduct = MeeshoProduct::where('store_id', $store->id)->find($validated['meesho_product_id']);
            if (!$mProduct) {
                return response()->json(['message' => 'Selected reselling product not found or does not belong to this store.'], 422);
            }
        } else {
            foreach ($order->items as $item) {
                if ($item->product_id) {
                    $mProduct = MeeshoProduct::where('store_id', $store->id)->where('product_id', $item->product_id)->first();
                    if ($mProduct) break;
                }
            }
        }

        $sourceCost = $mProduct ? (float)$mProduct->source_price : 0.00;
        $shipping = $mProduct ? (float)$mProduct->estimated_shipping : 45.00;
        $sellingPrice = (float)$order->total_amount;
        $platformFee = round($sellingPrice * 0.02, 2);
        $gatewayFee = round($sellingPrice * 0.02, 2);

        $grossMargin = round($sellingPrice - $sourceCost, 2);
        $netProfit = round($sellingPrice - $sourceCost - $shipping - $platformFee - $gatewayFee, 2);

        $meeshoOrder = MeeshoOrder::create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'meesho_product_id' => $mProduct?->id,
            'toastkart_selling_price' => $sellingPrice,
            'source_purchase_cost' => $sourceCost,
            'shipping_charges' => $shipping,
            'platform_fees' => $platformFee,
            'payment_gateway_fees' => $gatewayFee,
            'gross_margin' => $grossMargin,
            'net_profit' => $netProfit,
            'is_profit_confirmed' => false,
            'customer_payment_status' => $order->payment_status ?? 'Paid',
            'supplier_order_status' => 'Pending Placement',
            'shipment_status' => 'Unfulfilled',
            'fulfilment_mode' => 'manual_assisted',
            'notes' => 'Generated from Toastkart store order ' . $order->order_number,
        ]);

        MeeshoSyncLog::create([
            'store_id' => $store->id,
            'action_type' => 'order_dispatch',
            'status' => 'info',
            'message' => "Queued Order {$order->order_number} for Meesho fulfilment. Est profit: ₹{$netProfit}.",
            'payload' => ['order_id' => $order->id, 'meesho_order_id' => $meeshoOrder->id],
        ]);

        return response()->json([
            'message' => 'Order mapped to dropshipping workflow.',
            'meesho_order' => $meeshoOrder->load(['order', 'meeshoProduct']),
        ], 201);
    }

    /**
     * POST /api/meesho/orders/{id}/process
     * Process order with supplier (enter Meesho Order ID / Place with Supplier).
     */
    public function processSupplierOrder(Request $request, $id)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $mOrder = MeeshoOrder::where('store_id', $store->id)->findOrFail($id);

        $validated = $request->validate([
            'meesho_order_id' => 'required|string|max:100',
            'supplier_order_status' => 'required|string|in:Placed with Supplier,Supplier Processing,Confirmed,Cancelled',
            'notes' => 'nullable|string',
        ]);

        $res = $this->fulfillmentService->submitToSupplier(
            $mOrder,
            $validated['meesho_order_id'],
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => $res['message'],
            'order' => $res['order'] ?? $mOrder->fresh()->load(['order', 'meeshoProduct']),
        ], $res['status'] ?? ($res['ok'] ? 200 : 422));
    }

    /**
     * POST /api/meesho/orders/{id}/retry
     * Retries submission to supplier safely using the configured provider.
     */
    public function retrySupplierOrder(Request $request, $id)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $mOrder = MeeshoOrder::where('store_id', $store->id)->findOrFail($id);
        $result = $this->fulfillmentService->submitToSupplier($mOrder);

        return response()->json([
            'message' => $result['message'],
            'order' => $result['order'] ?? $mOrder->fresh()->load(['order', 'meeshoProduct']),
        ], $result['status'] ?? ($result['ok'] ? 200 : 422));
    }

    /**
     * POST /api/meesho/orders/{id}/sync-tracking
     * Queries upstream tracking status and synchronizes Toastkart customer order.
     */
    public function syncOrderTracking(Request $request, $id)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $mOrder = MeeshoOrder::where('store_id', $store->id)->findOrFail($id);
        $result = $this->fulfillmentService->syncTracking($mOrder);

        return response()->json([
            'message' => $result['message'],
            'order' => $result['order'] ?? $mOrder->fresh()->load(['order', 'meeshoProduct']),
        ], $result['ok'] ? 200 : 422);
    }

    /**
     * POST /api/meesho/orders/sync-all-tracking
     * Synchronize tracking for all active in-transit orders.
     */
    public function syncAllStoreTracking(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $activeOrders = MeeshoOrder::where('store_id', $store->id)
            ->whereIn('shipment_status', ['Label Created', 'Picked Up', 'In Transit', 'Out for Delivery'])
            ->get();

        $synced = 0;
        foreach ($activeOrders as $ord) {
            $res = $this->fulfillmentService->syncTracking($ord);
            if ($res['ok']) $synced++;
        }

        return response()->json([
            'message' => "Synchronized tracking for {$synced} of {$activeOrders->count()} orders.",
            'synced_count' => $synced,
        ]);
    }

    /**
     * PUT /api/meesho/orders/{id}/tracking
     * Update Courier AWB, Shipment Status & Tracking URL.
     */
    public function updateTracking(Request $request, $id)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $mOrder = MeeshoOrder::where('store_id', $store->id)->findOrFail($id);

        $validated = $request->validate([
            'courier_partner' => 'nullable|string|max:100',
            'awb_number' => 'nullable|string|max:100',
            'shipment_status' => 'required|string|in:Unfulfilled,Label Created,Picked Up,In Transit,Out for Delivery,Delivered,RTO_Initiated,Returned',
            'tracking_url' => 'nullable|string|max:500',
        ]);

        $isDelivered = $validated['shipment_status'] === 'Delivered';

        $mOrder->update([
            'courier_partner' => $validated['courier_partner'] ?? $mOrder->courier_partner,
            'awb_number' => $validated['awb_number'] ?? $mOrder->awb_number,
            'shipment_status' => $validated['shipment_status'],
            'tracking_url' => $validated['tracking_url'] ?? $mOrder->tracking_url,
            'dispatched_at' => $mOrder->dispatched_at ?? now(),
            'delivered_at' => $isDelivered ? now() : $mOrder->delivered_at,
            'is_profit_confirmed' => $isDelivered,
        ]);

        if ($mOrder->order) {
            if ($isDelivered) {
                $mOrder->order->update(['status' => 'Delivered']);
            } elseif (in_array($validated['shipment_status'], ['Picked Up', 'In Transit', 'Out for Delivery'])) {
                $mOrder->order->update(['status' => 'Shipped']);
            }
        }

        MeeshoSyncLog::create([
            'store_id' => $store->id,
            'action_type' => 'tracking_update',
            'status' => 'success',
            'message' => "Shipment tracking updated for Order #{$mOrder->order_id} ({$validated['shipment_status']}, AWB: {$mOrder->awb_number}).",
            'payload' => $validated,
        ]);

        return response()->json([
            'message' => 'Tracking information updated.',
            'order' => $mOrder->fresh()->load(['order', 'meeshoProduct']),
        ]);
    }

    /**
     * POST /api/meesho/orders/{id}/return
     * Handle cancellations, returns, and refunds.
     */
    public function handleReturn(Request $request, $id)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $mOrder = MeeshoOrder::where('store_id', $store->id)->findOrFail($id);

        $validated = $request->validate([
            'return_status' => 'required|string|in:requested,approved,picked_up,refunded,rejected,rto',
            'return_reason' => 'required|string|max:500',
            'refund_amount' => 'nullable|numeric|min:0|max:' . max(1, (float)$mOrder->toastkart_selling_price),
        ]);

        $refundAmt = isset($validated['refund_amount']) ? (float)$validated['refund_amount'] : null;

        $res = $this->fulfillmentService->handleReturn(
            $mOrder,
            $validated['return_status'],
            $validated['return_reason'],
            $refundAmt
        );

        return response()->json([
            'message' => $res['message'],
            'order' => $res['order'] ?? $mOrder->fresh()->load(['order', 'meeshoProduct']),
        ], $res['status'] ?? ($res['ok'] ? 200 : 422));
    }

    /**
     * POST /api/webhooks/meesho-tracking
     * Public carrier / supplier tracking webhook endpoint.
     */
    public function handleTrackingWebhook(Request $request)
    {
        $webhookSecret = config('services.meesho.webhook_secret');
        if (!empty($webhookSecret)) {
            $signature = $request->header('X-Webhook-Signature');
            $expectedSignature = hash_hmac('sha256', $request->getContent(), $webhookSecret);
            if (!hash_equals($expectedSignature, (string)$signature)) {
                return response()->json(['message' => 'Invalid webhook signature.'], 401);
            }
        }

        $supplierOrderId = $request->input('supplier_order_id') ?? $request->input('order_id');
        $awb = $request->input('awb_number') ?? $request->input('tracking_number');
        $shipmentStatus = $request->input('shipment_status');

        if (!$shipmentStatus || (!$supplierOrderId && !$awb)) {
            return response()->json(['message' => 'Missing required webhook parameters.'], 422);
        }

        $query = MeeshoOrder::query();
        if ($supplierOrderId) {
            $query->where('meesho_order_id', $supplierOrderId);
        } elseif ($awb) {
            $query->where('awb_number', $awb);
        }
        $mOrder = $query->first();

        if (!$mOrder) {
            return response()->json(['message' => 'Fulfillment record not found.'], 404);
        }

        $isDelivered = $shipmentStatus === 'Delivered';
        $mOrder->update([
            'shipment_status' => $shipmentStatus,
            'courier_partner' => $request->input('courier_partner') ?? $mOrder->courier_partner,
            'awb_number' => $awb ?? $mOrder->awb_number,
            'tracking_url' => $request->input('tracking_url') ?? $mOrder->tracking_url,
            'delivered_at' => $isDelivered ? now() : $mOrder->delivered_at,
            'is_profit_confirmed' => $isDelivered,
        ]);

        if ($mOrder->order) {
            if ($isDelivered) {
                $mOrder->order->update(['status' => 'Delivered']);
            } elseif (in_array($shipmentStatus, ['Picked Up', 'In Transit', 'Out for Delivery'])) {
                $mOrder->order->update(['status' => 'Shipped']);
            }
        }

        MeeshoSyncLog::create([
            'store_id' => $mOrder->store_id,
            'action_type' => 'tracking_update',
            'status' => 'success',
            'message' => "Webhook tracking update: Order #{$mOrder->order_id} status changed to {$shipmentStatus}.",
            'payload' => $request->all(),
        ]);

        return response()->json(['message' => 'Webhook tracking processed successfully.']);
    }

    /**
     * GET /api/meesho/logs
     * Fetch synchronization and audit history logs.
     */
    public function getLogs(Request $request)
    {
        $store = $this->getStore($request);
        if (!$store) {
            return response()->json(['message' => 'Store not found or unauthorized access.'], 403);
        }

        $logs = MeeshoSyncLog::where('store_id', $store->id)
            ->orderBy('id', 'desc')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }
}
