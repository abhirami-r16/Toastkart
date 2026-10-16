<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Models\Order;
use App\Models\Product;
use App\Models\MeeshoAccount;
use App\Models\MeeshoProduct;
use App\Models\MeeshoOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

class MeeshoDropshippingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.reefapi.api_key' => null]);
    }

    private function createStoreForUser(User $user, string $name = 'Test Store'): Store
    {
        return Store::create([
            'user_id' => $user->id,
            'name' => $name,
            'slug' => strtolower(str_replace(' ', '-', $name)) . '-' . rand(100, 999),
            'currency' => 'INR',
            'status' => 'Active',
        ]);
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
        $this->postJson('/api/logout')->assertStatus(401);

        $response = $this->getJson('/api/meesho/status');
        $response->assertStatus(401);
        $this->getJson('/api/meesho/search?query=Lipstick')->assertStatus(401);
        $this->postJson('/api/meesho/import', [])->assertStatus(401);

        $responsePost = $this->postJson('/api/meesho/connect', [
            'account_name' => 'Store',
            'registered_email' => 'store@test.com',
            'mode' => 'manual_assisted'
        ]);
        $responsePost->assertStatus(401);
    }

    public function test_sanctum_bearer_token_authenticates_the_current_user_endpoint(): void
    {
        $user = User::factory()->create([
            'email' => 'auth-test@gmail.com',
            'password' => Hash::make('correct-password'),
            'role' => 'owner',
        ]);

        $login = $this->postJson('/api/login', [
            'email' => 'auth-test@gmail.com',
            'password' => 'correct-password',
        ]);
        $login->assertOk()->assertJsonPath('user.id', $user->id);
        $token = $login->json('token');
        $this->assertNotEmpty($token);

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('id', $user->id);

        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_cross_store_access_is_forbidden(): void
    {
        $userA = User::factory()->create(['role' => 'owner']);
        $userB = User::factory()->create(['role' => 'owner']);

        $storeA = $this->createStoreForUser($userA, 'Store A');
        $storeB = $this->createStoreForUser($userB, 'Store B');

        // User A attempts to access Store B's Meesho status
        $response = $this->actingAs($userA)
            ->withHeaders(['X-Store-Id' => $storeB->id])
            ->getJson('/api/meesho/status');

        $response->assertStatus(403);
        $response->assertJson(['message' => 'Store not found or unauthorized access.']);
    }

    public function test_store_selection_is_required_for_meesho_requests(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $this->createStoreForUser($user);

        $this->actingAs($user)
            ->getJson('/api/meesho/status')
            ->assertStatus(403)
            ->assertJson(['message' => 'Store not found or unauthorized access.']);
    }

    public function test_fake_live_credentials_are_rejected_and_status_remains_pending_approval(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Owner Store');

        $payload = [
            'account_name' => 'Aura Reselling Store',
            'registered_email' => 'reseller@aura.com',
            'api_key' => 'fake_or_dummy_key_123',
            'api_secret' => 'dummy_secret_abc',
            'mode' => 'live_approved',
        ];

        $response = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/connect', $payload);

        $response->assertStatus(422);
        $response->assertJsonFragment(['connection_status' => 'pending_approval']);

        $this->assertDatabaseHas('meesho_accounts', [
            'store_id' => $store->id,
            'connection_status' => 'pending_approval',
            'mode' => 'live_approved',
        ]);
    }

    public function test_can_connect_manual_mode_and_fetch_status(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Manual Boutique');

        $payload = [
            'account_name' => 'Manual Reseller',
            'registered_email' => 'manual@test.com',
            'mode' => 'manual_assisted',
        ];

        $response = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/connect', $payload);

        $response->assertStatus(200);
        $response->assertJsonFragment(['connection_status' => 'manual_active']);

        $statusRes = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->getJson('/api/meesho/status');

        $statusRes->assertStatus(200);
        $statusRes->assertJsonFragment(['connection_status' => 'manual_active']);
        $this->assertFalse($statusRes->json('capabilities.public_oauth_supported'));
        $this->assertFalse($statusRes->json('capabilities.live_catalog_search_configured'));
        $this->assertFalse($statusRes->json('capabilities.partner_channel_api_ready'));
    }

    public function test_catalog_search_returns_matching_staging_suggestions(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Catalog Search Store');

        $response = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->getJson('/api/meesho/catalog?query=kurta');

        $response->assertOk()
            ->assertJsonPath('catalog_source', 'Curated Staging Catalog')
            ->assertJsonFragment(['title' => 'Anarkali Printed Rayon Kurta Set with Dupatta'])
            ->assertJsonPath('total', 1);
    }

    public function test_lipstick_search_returns_paginated_staging_results_and_details(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Lipstick Search Store');

        $firstPage = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->getJson('/api/meesho/search?query=LiPsTiCk&limit=2&page=1');

        $firstPage->assertOk()
            ->assertJsonPath('catalog_source', 'Curated Sample Staging Catalog')
            ->assertJsonPath('is_staging', true)
            ->assertJsonPath('live_search_configured', false)
            ->assertJsonPath('total', 3)
            ->assertJsonPath('has_more', true);
        $this->assertCount(2, $firstPage->json('catalog'));

        $secondPage = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->getJson('/api/meesho/search?query=Lipstick&limit=2&page=2');
        $secondPage->assertOk()->assertJsonPath('has_more', false);
        $this->assertCount(1, $secondPage->json('catalog'));

        $productId = $firstPage->json('catalog.0.meesho_product_id');
        $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->getJson('/api/meesho/product/' . $productId)
            ->assertOk()
            ->assertJsonPath('product.meesho_product_id', $productId);
    }

    public function test_live_search_uses_documented_reefapi_url_header_and_cursor(): void
    {
        config(['services.reefapi.api_key' => 'fake-test-key']);
        Http::fake([
            'https://api.reefapi.com/meesho/v1/search' => Http::response([
                'ok' => true,
                'data' => [
                    'query' => 'Lipstick',
                    'results' => [[
                        'product_id' => 'lip123',
                        'catalog_id' => 'cat-789',
                        'title' => 'Live Matte Lipstick',
                        'price' => 249,
                        'currency' => 'INR',
                        'url' => 'https://www.meesho.com/matte-lipstick/p/lip123',
                        'image' => 'https://images.meesho.com/live-lipstick.jpg',
                        'images' => ['https://images.meesho.com/live-lipstick.jpg'],
                    ]],
                    'total_results' => null,
                ],
                'meta' => ['pagination' => ['cursor' => 'next-cursor', 'has_more' => true]],
                'error' => null,
            ]),
        ]);
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Reef Search Store');

        $response = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->getJson('/api/meesho/search?query=Lipstick&limit=1&cursor=previous-cursor');

        $response->assertOk()
            ->assertJsonPath('catalog_source', 'ReefAPI / Meesho Live')
            ->assertJsonPath('is_staging', false)
            ->assertJsonPath('catalog.0.meesho_product_id', 'lip123')
            ->assertJsonPath('catalog.0.source_price', 249)
            ->assertJsonPath('catalog.0.product_url', 'https://www.meesho.com/matte-lipstick/p/lip123')
            ->assertJsonPath('cursor', 'next-cursor')
            ->assertJsonPath('has_more', true)
            ->assertDontSee('fake-test-key');

        Http::assertSent(fn ($request) =>
            $request->method() === 'POST'
            && $request->url() === 'https://api.reefapi.com/meesho/v1/search'
            && $request->hasHeader('x-api-key', 'fake-test-key')
            && $request['query'] === 'Lipstick'
            && $request['limit'] === 1
            && $request['cursor'] === 'previous-cursor'
        );
    }

    public function test_live_detail_can_be_imported_once_into_the_existing_product_system(): void
    {
        config(['services.reefapi.api_key' => 'fake-test-key']);
        Http::fake([
            'https://api.reefapi.com/meesho/v1/product/detail' => Http::response([
                'ok' => true,
                'data' => ['product' => [
                    'product_id' => 'lip123',
                    'catalog_id' => 'cat-789',
                    'title' => 'Live Matte Lipstick',
                    'price' => 249,
                    'currency' => 'INR',
                    'in_stock' => true,
                    'images' => ['https://images.meesho.com/live-lipstick.jpg'],
                    'description' => 'Description from ReefAPI.',
                    'category_name' => 'Beauty',
                    'url' => 'https://www.meesho.com/matte-lipstick/p/lip123',
                    'variants' => [['variant_id' => 'v1', 'name' => 'Red', 'price' => 249, 'in_stock' => true]],
                    'shop' => ['name' => 'Example Shop'],
                ]],
                'meta' => [],
                'error' => null,
            ]),
        ]);
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Reef Import Store');
        $headers = ['X-Store-Id' => $store->id];

        $this->actingAs($user)->withHeaders($headers)
            ->getJson('/api/meesho/product/lip123')
            ->assertOk()
            ->assertJsonPath('product.is_live', true)
            ->assertJsonPath('product.source_price', 249)
            ->assertJsonPath('product.supplier_name', 'Example Shop');

        $import = $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'lip123',
            'custom_title' => 'Owner Lipstick Listing',
            'description' => 'Owner edited description.',
            'selling_price' => 399,
            'category' => 'Beauty',
            'images' => ['https://images.meesho.com/live-lipstick.jpg'],
            'stock_quantity' => 10,
        ]);

        $import->assertCreated()->assertJsonPath('meesho_product.product.name', 'Owner Lipstick Listing');
        $productId = $import->json('meesho_product.product.id');
        $this->assertDatabaseHas('products', [
            'id' => $productId,
            'store_id' => $store->id,
            'name' => 'Owner Lipstick Listing',
            'price' => 399,
            'description' => 'Owner edited description.',
        ]);
        $this->assertDatabaseHas('meesho_products', [
            'store_id' => $store->id,
            'product_id' => $productId,
            'meesho_product_id' => 'lip123',
            'source_price' => 249,
        ]);

        $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'lip123',
            'selling_price' => 399,
            'category' => 'Beauty',
        ])->assertOk()->assertJsonPath('meesho_product.product.id', $productId);

        Http::assertSentCount(1);
        $this->assertDatabaseCount('products', 1);
    }

    public function test_reefapi_connection_check_empty_search_and_provider_errors_are_safe(): void
    {
        config(['services.reefapi.api_key' => 'fake-test-key']);
        Http::fake([
            'https://api.reefapi.com/meesho/v1/categories' => Http::response([
                'ok' => true, 'data' => ['categories' => [['id' => 1]], 'count' => 1], 'meta' => [], 'error' => null,
            ]),
            'https://api.reefapi.com/meesho/v1/search' => Http::sequence()
                ->push(['ok' => true, 'data' => ['results' => []], 'meta' => ['pagination' => ['has_more' => false]], 'error' => null])
                ->push(['ok' => false, 'data' => null, 'meta' => [], 'error' => ['code' => 'RATE_LIMITED', 'message' => 'key omitted by provider wrapper'] ], 429),
        ]);
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Reef Connection Store');
        $headers = ['X-Store-Id' => $store->id];

        $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/reefapi/test')
            ->assertOk()->assertJsonPath('ok', true)->assertJsonPath('category_count', 1)
            ->assertDontSee('fake-test-key');
        $this->actingAs($user)->withHeaders($headers)->getJson('/api/meesho/search?query=Lipstick')
            ->assertOk()->assertJsonPath('catalog', [])->assertJsonPath('has_more', false);
        \Illuminate\Support\Facades\Cache::flush();
        $this->actingAs($user)->withHeaders($headers)->getJson('/api/meesho/search?query=Lipstick')
            ->assertStatus(429)->assertJsonPath('code', 'RATE_LIMITED')
            ->assertJsonPath('message', 'ReefAPI rate limit reached. Retry shortly.')
            ->assertJsonPath('retry_after', 5)
            ->assertDontSee('fake-test-key');
    }

    public function test_provider_categories_endpoint_returns_categories_and_caches_response(): void
    {
        config(['services.reefapi.api_key' => 'fake-test-key']);
        \Illuminate\Support\Facades\Cache::forget('reefapi_meesho_categories');

        Http::fake([
            'https://api.reefapi.com/meesho/v1/categories' => Http::response([
                'ok' => true,
                'data' => [
                    'count' => 3,
                    'categories' => [
                        ['id' => 'cat-1', 'name' => 'Ethnic Wear'],
                        ['id' => 'cat-2', 'name' => 'Footwear'],
                        ['id' => 'cat-3', 'name' => 'Electronics'],
                    ],
                ],
                'meta' => [],
                'error' => null,
            ]),
        ]);

        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Categories Test Store');
        $headers = ['X-Store-Id' => $store->id];

        $response = $this->actingAs($user)->withHeaders($headers)->getJson('/api/meesho/provider-categories');
        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('count', 3)
            ->assertJsonPath('categories.0.name', 'Ethnic Wear')
            ->assertJsonPath('categories.1.name', 'Footwear')
            ->assertJsonPath('categories.2.name', 'Electronics')
            ->assertDontSee('fake-test-key');

        // Verify cache prevents second HTTP call
        $secondResponse = $this->actingAs($user)->withHeaders($headers)->getJson('/api/meesho/provider-categories');
        $secondResponse->assertOk()->assertJsonPath('count', 3);
        Http::assertSentCount(1);
    }

    public function test_universal_search_supports_all_categories_by_default_and_filters_when_specified(): void
    {
        config(['services.reefapi.api_key' => 'fake-test-key']);
        Http::fake([
            'https://api.reefapi.com/meesho/v1/search' => Http::response([
                'ok' => true,
                'data' => [
                    'query' => 'shoes',
                    'results' => [
                        [
                            'product_id' => 'shoe-101',
                            'title' => 'Sport Running Shoes',
                            'price' => 499,
                            'original_price' => 999,
                            'currency' => 'INR',
                            'category_name' => 'Footwear',
                            'images' => ['https://images.meesho.com/shoe1.jpg'],
                        ],
                    ],
                ],
                'meta' => ['pagination' => ['cursor' => 'cur-2', 'has_more' => true]],
                'error' => null,
            ]),
        ]);

        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Universal Search Store');
        $headers = ['X-Store-Id' => $store->id];

        // 1. Universal Search (no category filter) -> searches across all products
        $resUniversal = $this->actingAs($user)->withHeaders($headers)
            ->getJson('/api/meesho/search?query=shoes&limit=10');
        $resUniversal->assertOk()
            ->assertJsonPath('catalog.0.meesho_product_id', 'shoe-101')
            ->assertJsonPath('catalog.0.category', 'Footwear')
            ->assertJsonPath('cursor', 'cur-2')
            ->assertJsonPath('has_more', true);

        Http::assertSent(fn ($req) =>
            $req->url() === 'https://api.reefapi.com/meesho/v1/search'
            && $req['query'] === 'shoes'
            && !array_key_exists('category', $req->data())
        );

        // 2. Filtered Search with Category, Price Range, and Sort
        $resFiltered = $this->actingAs($user)->withHeaders($headers)
            ->getJson('/api/meesho/search?query=shoes&category=Footwear&sort=price_asc&min_price=200&max_price=800');
        $resFiltered->assertOk()
            ->assertJsonPath('category_applied', 'Footwear');

        Http::assertSent(fn ($req) =>
            $req->url() === 'https://api.reefapi.com/meesho/v1/search'
            && ($req->data()['query'] ?? '') === 'shoes'
            && ($req->data()['category'] ?? '') === 'Footwear'
            && ($req->data()['sort'] ?? '') === 'price_asc'
            && ($req->data()['min_price'] ?? null) == 200
            && ($req->data()['max_price'] ?? null) == 800
        );
    }

    public function test_staging_search_searches_across_multiple_unrelated_product_types(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Multi Product Staging Store');
        $headers = ['X-Store-Id' => $store->id];

        // Unrelated product types tested in staging catalog
        $queries = ['saree', 'kurti', 'shoes', 'neckband', 'toys', 'container'];
        foreach ($queries as $q) {
            $res = $this->actingAs($user)->withHeaders($headers)->getJson('/api/meesho/search?query=' . $q);
            $res->assertOk();
            $this->assertGreaterThan(0, count($res->json('catalog')), "Expected results for staging search query '{$q}'");
            $this->assertFalse($res->json('is_staging') === false);
        }

        // Test category filter in staging
        $resCategory = $this->actingAs($user)->withHeaders($headers)
            ->getJson('/api/meesho/search?query=neckband&category=Electronics');
        $resCategory->assertOk();
        $this->assertGreaterThan(0, count($resCategory->json('catalog')));
        $this->assertSame('Electronics', $resCategory->json('catalog.0.category'));

        // Category mismatch returns empty
        $resMismatch = $this->actingAs($user)->withHeaders($headers)
            ->getJson('/api/meesho/search?query=neckband&category=Beauty');
        $resMismatch->assertOk();
        $this->assertCount(0, $resMismatch->json('catalog'));
    }

    public function test_import_saves_owner_edits_under_a_store_owned_category(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Edited Import Store');
        $otherStore = $this->createStoreForUser($user, 'Other Category Store');
        $category = \App\Models\Category::create([
            'store_id' => $store->id,
            'name' => 'Cosmetics',
            'slug' => 'cosmetics-' . $store->id,
        ]);
        $foreignCategory = \App\Models\Category::create([
            'store_id' => $otherStore->id,
            'name' => 'Foreign Category',
            'slug' => 'foreign-category-' . $otherStore->id,
        ]);
        $headers = ['X-Store-Id' => $store->id];

        $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-BT-516',
            'selling_price' => 450,
            'custom_title' => 'Owner Edited Lipstick',
            'description' => 'Owner edited description.',
            'images' => ['https://example.com/lipstick-main.jpg', 'https://example.com/lipstick-alt.jpg'],
            'stock_quantity' => 12,
            'category_id' => $category->id,
        ])->assertCreated();

        $product = Product::where('store_id', $store->id)->firstOrFail();
        $this->assertSame($category->id, $product->category_id);
        $this->assertSame('Owner Edited Lipstick', $product->name);
        $this->assertSame('Owner edited description.', $product->description);
        $this->assertSame(12, $product->stock_quantity);
        $this->assertSame('https://example.com/lipstick-main.jpg', $product->image);
        $this->assertSame([
            'https://example.com/lipstick-main.jpg',
            'https://example.com/lipstick-alt.jpg',
        ], $product->images);
        $this->assertDatabaseHas('meesho_products', [
            'product_id' => $product->id,
            'meesho_product_id' => 'MSH-BT-516',
            'source_price' => 180,
            'selling_price' => 450,
            'category' => 'Cosmetics',
        ]);

        $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-BT-517',
            'selling_price' => 500,
            'category_id' => $foreignCategory->id,
        ])->assertStatus(422);
    }

    public function test_import_rejects_price_below_supplier_cost_and_cross_store_access(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $otherOwner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'Price Validation Store');
        $otherStore = $this->createStoreForUser($otherOwner, 'Private Other Store');

        $this->actingAs($owner)->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/import', [
                'meesho_product_id' => 'MSH-BT-516',
                'selling_price' => 100,
                'category' => 'Beauty',
            ])->assertStatus(422)->assertJsonValidationErrors(['selling_price']);

        $this->actingAs($owner)->withHeaders(['X-Store-Id' => $otherStore->id])
            ->getJson('/api/meesho/search?query=Lipstick')->assertStatus(403);
        $this->actingAs($owner)->withHeaders(['X-Store-Id' => $otherStore->id])
            ->postJson('/api/meesho/import', [
                'meesho_product_id' => 'MSH-BT-516',
                'selling_price' => 200,
            ])->assertStatus(403);

        $this->actingAs($owner)->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/import', [
                'meesho_product_id' => 'MSH-BT-516',
                'selling_price' => 100,
                'category' => 'Beauty',
            ])->assertStatus(422)->assertJsonValidationErrors(['selling_price']);
        $this->assertDatabaseCount('products', 0);
    }

    public function test_imported_product_appears_in_catalog_can_be_edited_and_duplicate_import_is_idempotent(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Import Store');

        $importPayload = [
            'meesho_product_id' => 'MSH-AP-101',
            'selling_price' => 799.00,
            'custom_title' => 'Anarkali Rayon Kurta Set',
        ];

        // First import should succeed
        $res1 = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/import', $importPayload);

        $res1->assertStatus(201);
        $meeshoProductId = $res1->json('meesho_product.id');
        $toastkartProductId = $res1->json('meesho_product.product.id');
        $this->assertNotEmpty($toastkartProductId);

        $this->assertDatabaseHas('meesho_products', [
            'store_id' => $store->id,
            'meesho_product_id' => 'MSH-AP-101',
            'product_id' => $toastkartProductId,
            'source_price' => 380.00,
            'selling_price' => 799.00,
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $toastkartProductId,
            'store_id' => $store->id,
            'name' => 'Anarkali Rayon Kurta Set',
            'price' => 799.00,
            'stock_quantity' => 140,
            'status' => 'In Stock',
            'is_active' => false,
        ]);
        $importedProduct = Product::with('category')->findOrFail($toastkartProductId);
        $this->assertSame($store->id, $importedProduct->category->store_id);
        $this->assertSame('Ethnic Wear', $importedProduct->category->name);
        $this->assertSame('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80', $importedProduct->image);

        $productsResponse = $this->getJson("/api/products?store_id={$store->id}");
        $productsResponse->assertOk()
            ->assertJsonFragment(['id' => $toastkartProductId, 'name' => 'Anarkali Rayon Kurta Set']);

        $this->putJson("/api/products/{$toastkartProductId}", [
            'name' => 'Updated Kurta Set',
            'price' => 849.00,
        ])->assertOk();

        $this->getJson("/api/products?store_id={$store->id}")
            ->assertOk()
            ->assertJsonFragment(['id' => $toastkartProductId, 'name' => 'Updated Kurta Set']);
        $this->assertDatabaseHas('meesho_products', [
            'id' => $meeshoProductId,
            'selling_price' => 849.00,
            'margin_amount' => 424.00,
        ]);

        $storefrontResponse = $this->getJson("/api/stores/{$store->slug}");
        $storefrontResponse->assertOk();
        $this->assertFalse(collect($storefrontResponse->json('products'))->contains('id', $toastkartProductId));

        $this->putJson("/api/products/{$toastkartProductId}", ['is_active' => true])->assertOk();
        $publishedStorefront = $this->getJson("/api/stores/{$store->slug}");
        $publishedStorefront->assertOk()
            ->assertJsonFragment(['id' => $toastkartProductId, 'name' => 'Updated Kurta Set']);

        // Re-importing the same supplier reference returns the existing mapping and product.
        $res2 = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/import', $importPayload);

        $res2->assertOk()
            ->assertJsonPath('meesho_product.id', $meeshoProductId)
            ->assertJsonPath('meesho_product.product.id', $toastkartProductId);
        $this->assertDatabaseCount('meesho_products', 1);
        $this->assertDatabaseCount('products', 1);

        $this->putJson("/api/products/{$toastkartProductId}", ['is_active' => false])->assertOk();
        $inactiveStorefront = $this->getJson("/api/stores/{$store->slug}");
        $this->assertFalse(collect($inactiveStorefront->json('products'))->contains('id', $toastkartProductId));
    }

    public function test_unknown_supplier_reference_requires_manual_listing_details(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Store Missing Product');

        $response = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/import', [
                'meesho_product_id' => 'NON-EXISTENT-ID-999',
                'selling_price' => 999.00,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['product_name', 'category', 'supplier_price', 'image_url']);
    }

    public function test_manual_assisted_import_creates_a_single_unpublished_store_product(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Manual Import Store');
        $payload = [
            'meesho_product_id' => 'MEE-SUP-98765',
            'product_name' => 'Manual Cotton Shirt',
            'description' => 'Owner-entered supplier listing details.',
            'category' => 'Menswear',
            'supplier_price' => 350,
            'estimated_shipping' => 40,
            'selling_price' => 699,
            'image_url' => 'https://example.com/manual-cotton-shirt.jpg',
            'stock_quantity' => 0,
        ];

        $first = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/import', $payload);

        $first->assertCreated()
            ->assertJsonPath('meesho_product.meesho_product_id', 'MEE-SUP-98765')
            ->assertJsonPath('meesho_product.meesho_catalog_id', 'MANUAL-ASSISTED');

        $productId = $first->json('meesho_product.product.id');
        $this->assertDatabaseHas('products', [
            'id' => $productId,
            'store_id' => $store->id,
            'name' => 'Manual Cotton Shirt',
            'price' => 699,
            'stock_quantity' => 0,
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('meesho_products', [
            'store_id' => $store->id,
            'meesho_product_id' => 'MEE-SUP-98765',
            'meesho_catalog_id' => 'MANUAL-ASSISTED',
            'source_price' => 350,
            'selling_price' => 699,
        ]);

        $second = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/import', $payload);

        $second->assertOk()
            ->assertJsonPath('meesho_product.product.id', $productId);
        $this->assertDatabaseCount('products', 1);
        $this->assertDatabaseCount('meesho_products', 1);
    }

    public function test_failed_customer_payment_prevents_supplier_order_booking(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Store Failed Payment');

        $order = Order::create([
            'store_id' => $store->id,
            'order_number' => 'ORD-TEST-FAIL-1',
            'customer_name' => 'Ravi Kumar',
            'customer_email' => 'ravi@test.com',
            'total_amount' => 699.00,
            'status' => 'Pending',
            'payment_status' => 'Failed',
        ]);

        // Map order
        $mapRes = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/orders/create-from-toastkart', [
                'order_id' => $order->id,
            ]);

        $mapRes->assertStatus(201);
        $meeshoOrderId = $mapRes->json('meesho_order.id');

        // Attempting to book supplier order should fail due to payment status
        $processRes = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$meeshoOrderId}/process", [
                'meesho_order_id' => 'MSH-SUP-ORD-101',
                'supplier_order_status' => 'Placed with Supplier',
            ]);

        $processRes->assertStatus(422);
        $processRes->assertJsonFragment([
            'message' => 'Cannot process supplier fulfillment for an order with failed customer payment.'
        ]);
    }

    public function test_repeated_supplier_booking_is_idempotent_and_overwriting_is_prevented(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Store Idempotent Booking');

        $order = Order::create([
            'store_id' => $store->id,
            'order_number' => 'ORD-TEST-IDEMP-1',
            'customer_name' => 'Pooja Verma',
            'customer_email' => 'pooja@test.com',
            'total_amount' => 899.00,
            'status' => 'Pending',
            'payment_status' => 'Paid',
        ]);

        $mapRes = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson('/api/meesho/orders/create-from-toastkart', [
                'order_id' => $order->id,
            ]);
        $meeshoOrderId = $mapRes->json('meesho_order.id');

        // First placement
        $p1 = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$meeshoOrderId}/process", [
                'meesho_order_id' => 'MSH-SUP-ORD-555',
                'supplier_order_status' => 'Placed with Supplier',
            ]);
        $p1->assertStatus(200);

        // Repeated request with same supplier ID returns idempotent 200
        $p2 = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$meeshoOrderId}/process", [
                'meesho_order_id' => 'MSH-SUP-ORD-555',
                'supplier_order_status' => 'Placed with Supplier',
            ]);
        $p2->assertStatus(200);
        $p2->assertJsonFragment(['message' => 'Order is already booked with this supplier reference.']);

        // Overwriting with a different ID without cancellation returns 422
        $p3 = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$meeshoOrderId}/process", [
                'meesho_order_id' => 'MSH-SUP-ORD-DIFFERENT',
                'supplier_order_status' => 'Placed with Supplier',
            ]);
        $p3->assertStatus(422);
    }

    public function test_tracking_delivery_confirms_profit_and_refund_reverses_it(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Store Tracking Refund');

        $order = Order::create([
            'store_id' => $store->id,
            'order_number' => 'ORD-TRACK-1',
            'customer_name' => 'Vikram Seth',
            'customer_email' => 'vikram@test.com',
            'total_amount' => 1000.00,
            'status' => 'Processing',
            'payment_status' => 'Paid',
        ]);

        $mOrder = MeeshoOrder::create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'toastkart_selling_price' => 1000.00,
            'source_purchase_cost' => 400.00,
            'shipping_charges' => 50.00,
            'platform_fees' => 20.00,
            'payment_gateway_fees' => 20.00,
            'gross_margin' => 600.00,
            'net_profit' => 510.00,
            'is_profit_confirmed' => false,
            'customer_payment_status' => 'Paid',
            'supplier_order_status' => 'Placed with Supplier',
            'shipment_status' => 'In Transit',
        ]);

        // Update tracking to Delivered
        $trackRes = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->putJson("/api/meesho/orders/{$mOrder->id}/tracking", [
                'shipment_status' => 'Delivered',
                'courier_partner' => 'Delhivery',
                'awb_number' => 'DLH12345678',
            ]);

        $trackRes->assertStatus(200);
        $this->assertTrue((bool)$trackRes->json('order.is_profit_confirmed'));

        // Issue refund
        $refundRes = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$mOrder->id}/return", [
                'return_status' => 'refunded',
                'return_reason' => 'Customer requested return due to fit.',
                'refund_amount' => 1000.00,
            ]);

        $refundRes->assertStatus(200);
        $this->assertFalse((bool)$refundRes->json('order.is_profit_confirmed'));
        $this->assertEquals(0.00, (float)$refundRes->json('order.net_profit'));

        // Duplicate refund attempt must be rejected
        $dupRefundRes = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$mOrder->id}/return", [
                'return_status' => 'refunded',
                'return_reason' => 'Duplicate refund',
            ]);

        $dupRefundRes->assertStatus(422);
    }

    public function test_get_store_categories_returns_store_categories_and_subcategories_flag(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Category Check Store');
        $otherStore = $this->createStoreForUser($user, 'Other Store');

        $cat1 = \App\Models\Category::create([
            'store_id' => $store->id,
            'name' => 'Fashion Accessories',
            'slug' => 'fashion-accessories-' . $store->id,
        ]);
        $cat2 = \App\Models\Category::create([
            'store_id' => $store->id,
            'name' => 'Home & Kitchen',
            'slug' => 'home-kitchen-' . $store->id,
        ]);
        \App\Models\Category::create([
            'store_id' => $otherStore->id,
            'name' => 'Other Category',
            'slug' => 'other-category-' . $otherStore->id,
        ]);

        $res = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->getJson('/api/meesho/categories');

        $res->assertOk();
        $this->assertCount(2, $res->json('categories'));
        $this->assertFalse($res->json('supports_subcategories'));
        $names = collect($res->json('categories'))->pluck('name')->all();
        $this->assertContains('Fashion Accessories', $names);
        $this->assertContains('Home & Kitchen', $names);
        $this->assertNotContains('Other Category', $names);
    }

    public function test_import_with_selected_category_and_subcategory_persists_in_products_and_dashboard(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Import Workflow Store');
        $headers = ['X-Store-Id' => $store->id];

        $category = \App\Models\Category::create([
            'store_id' => $store->id,
            'name' => 'Ethnic Wear',
            'slug' => 'ethnic-wear-' . $store->id,
        ]);

        // 1. Validation error when foreign category is submitted
        $foreignCategory = \App\Models\Category::create([
            'store_id' => null,
            'name' => 'Unowned Category',
            'slug' => 'unowned-cat',
        ]);
        $failRes = $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-AP-101',
            'selling_price' => 1299,
            'category_id' => $foreignCategory->id,
        ]);
        $failRes->assertStatus(422);
        $failRes->assertJsonValidationErrors(['category_id']);

        // 2. Successful import with selected category and subcategory
        $importRes = $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-AP-101',
            'selling_price' => 1499,
            'custom_title' => 'Festive Silk Saree',
            'category_id' => $category->id,
            'subcategory' => 'Silk Sarees',
            'description' => 'A beautiful silk saree for celebrations.',
            'images' => ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'],
            'stock_quantity' => 20,
        ]);

        $importRes->assertCreated();
        $product = Product::where('store_id', $store->id)->where('name', 'Festive Silk Saree')->firstOrFail();
        $this->assertSame($category->id, $product->category_id);
        $this->assertSame($store->id, $product->store_id);

        // 3. Confirm the product appears under the correct category in the owner dashboard Products API
        $dashboardListRes = $this->actingAs($user)
            ->getJson("/api/products?store_id={$store->id}&category_id={$category->id}");
        $dashboardListRes->assertOk();
        $items = $dashboardListRes->json();
        $this->assertNotEmpty($items);
        $found = collect($items)->firstWhere('id', $product->id);
        $this->assertNotNull($found);
        $this->assertSame($category->id, $found['category_id']);
        $this->assertSame('Ethnic Wear', $found['category']['name']);

        // 4. Duplicate import returns existing product without creating another product
        $dupRes = $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-AP-101',
            'selling_price' => 1499,
            'category_id' => $category->id,
        ]);
        $dupRes->assertOk();
        $this->assertStringContainsString('already imported', $dupRes->json('message'));
        $this->assertSame(1, Product::where('store_id', $store->id)->count());
    }

    public function test_supplier_cost_and_maximum_selling_price_display_and_persistence(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreForUser($user, 'Pricing Store');
        $category = \App\Models\Category::create([
            'store_id' => $store->id,
            'name' => 'Fashion & Ethnic',
            'slug' => 'fashion-ethnic',
        ]);
        $headers = ['X-Store-Id' => (string) $store->id];

        // 1. Fetch product detail: returns supplier cost and verified maximum selling price
        $detailRes = $this->actingAs($user)->withHeaders($headers)->getJson('/api/meesho/product/MSH-AP-101');
        $detailRes->assertOk();
        $productData = $detailRes->json('product');
        $this->assertSame(380.0, (float) $productData['source_price']);
        $this->assertSame(1299.0, (float) $productData['original_price']);

        // 2. Store owner sets their own selling price (₹899), different from supplier's maximum (₹1299)
        $importRes = $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-AP-101',
            'selling_price' => 899.00,
            'custom_title' => 'Anarkali Rayon Kurta Set',
            'category_id' => $category->id,
            'description' => 'Tested description',
            'images' => ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'],
        ]);
        $importRes->assertCreated();

        // 3. Verify persistence in Toastkart Product system
        $toastkartProduct = Product::where('store_id', $store->id)->where('name', 'Anarkali Rayon Kurta Set')->firstOrFail();
        $this->assertEquals(899.00, (float) $toastkartProduct->price); // Owner chosen selling price
        $this->assertEquals(1299.00, (float) $toastkartProduct->compare_price); // Maximum selling price / MRP
        $this->assertSame($category->id, $toastkartProduct->category_id);
        $this->assertFalse($toastkartProduct->is_active); // Preserved as draft/unpublished

        // 4. Verify persistence in MeeshoProduct reselling metadata
        $meeshoProduct = MeeshoProduct::where('store_id', $store->id)->where('meesho_product_id', 'MSH-AP-101')->firstOrFail();
        $this->assertEquals(380.00, (float) $meeshoProduct->source_price); // Supplier cost
        $this->assertEquals(1299.00, (float) $meeshoProduct->original_price); // Supplier maximum selling price
        $this->assertEquals(899.00, (float) $meeshoProduct->selling_price); // Chosen selling price
        $this->assertEquals(519.00, (float) $meeshoProduct->margin_amount); // 899 - 380 = 519
        $this->assertEquals(57.73, (float) $meeshoProduct->margin_percentage); // (519 / 899) * 100 = 57.73%
    }

    public function test_missing_maximum_selling_price_persists_null_without_inventing_values(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreForUser($user, 'Jewelry Store');
        $category = \App\Models\Category::create([
            'store_id' => $store->id,
            'name' => 'Jewelry',
            'slug' => 'jewelry',
        ]);
        $headers = ['X-Store-Id' => (string) $store->id];

        // 1. Fetch MSH-JW-204 which does not supply an original_price
        $detailRes = $this->actingAs($user)->withHeaders($headers)->getJson('/api/meesho/product/MSH-JW-204');
        $detailRes->assertOk();
        $productData = $detailRes->json('product');
        $this->assertSame(240.0, (float) $productData['source_price']);
        $this->assertNull($productData['original_price'] ?? null);

        // 2. Import product without providing a maximum price
        $importRes = $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-JW-204',
            'selling_price' => 549.00,
            'category_id' => $category->id,
        ]);
        $importRes->assertCreated();

        // 3. Verify compare_price is null on Product and original_price is null on MeeshoProduct
        $toastkartProduct = Product::where('store_id', $store->id)->where('category_id', $category->id)->firstOrFail();
        $this->assertEquals(549.00, (float) $toastkartProduct->price);
        $this->assertNull($toastkartProduct->compare_price);

        $meeshoProduct = MeeshoProduct::where('store_id', $store->id)->where('meesho_product_id', 'MSH-JW-204')->firstOrFail();
        $this->assertEquals(240.00, (float) $meeshoProduct->source_price);
        $this->assertNull($meeshoProduct->original_price);
        $this->assertEquals(309.00, (float) $meeshoProduct->margin_amount); // 549 - 240
    }

    public function test_price_validation_rejects_negative_prices_and_selling_price_below_cost(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreForUser($user, 'Validation Store');
        $category = \App\Models\Category::create([
            'store_id' => $store->id,
            'name' => 'General',
            'slug' => 'general',
        ]);
        $headers = ['X-Store-Id' => (string) $store->id];

        // 1. Reject negative selling price
        $negRes = $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-AP-101',
            'selling_price' => -100,
            'category_id' => $category->id,
        ]);
        $negRes->assertStatus(422);
        $negRes->assertJsonValidationErrors(['selling_price']);

        // 2. Reject zero selling price
        $zeroRes = $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-AP-101',
            'selling_price' => 0,
            'category_id' => $category->id,
        ]);
        $zeroRes->assertStatus(422);
        $zeroRes->assertJsonValidationErrors(['selling_price']);

        // 3. Reject selling price below supplier cost (MSH-AP-101 supplier cost is 380)
        $belowCostRes = $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-AP-101',
            'selling_price' => 250.00,
            'category_id' => $category->id,
        ]);
        $belowCostRes->assertStatus(422);
        $belowCostRes->assertJsonValidationErrors(['selling_price']);
        $this->assertStringContainsString('cover the supplier cost', $belowCostRes->json('message'));
    }

    public function test_category_creation_and_collections_storefront_synchronization(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreForUser($user, 'Sync Store');
        $headers = ['X-Store-Id' => (string) $store->id];

        // 1. Store owner creates a category via CategoryController
        $catRes = $this->actingAs($user)->withHeaders($headers)->postJson('/api/categories', [
            'store_id' => $store->id,
            'name' => 'Handcrafted Accessories',
            'description' => 'Bespoke handmade goods',
        ]);
        $catRes->assertCreated();
        $createdCatId = $catRes->json('id');
        $this->assertNotNull($createdCatId);

        // 2. Category is immediately available in Meesho import category dropdown
        $meeshoCatRes = $this->actingAs($user)->withHeaders($headers)->getJson('/api/meesho/categories');
        $meeshoCatRes->assertOk();
        $cats = $meeshoCatRes->json('categories');
        $this->assertTrue(collect($cats)->contains('id', $createdCatId));

        // 3. Category appears in Store Owner Dashboard Collections section
        $collectionsRes = $this->actingAs($user)->getJson("/api/categories?store_id={$store->id}");
        $collectionsRes->assertOk();
        $collectionList = $collectionsRes->json();
        $this->assertTrue(collect($collectionList)->contains('id', $createdCatId));

        // 4. Import a product assigned to this category
        $importRes = $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-AP-101',
            'selling_price' => 999.00,
            'category_id' => $createdCatId,
            'custom_title' => 'Sync Saree Test',
        ]);
        $importRes->assertCreated();
        $product = Product::where('store_id', $store->id)->where('name', 'Sync Saree Test')->firstOrFail();

        // 5. As draft product (is_active = false), it is not visible on public storefront
        $this->assertFalse($product->is_active);
        $draftStorefrontRes = $this->getJson("/api/products?store_id={$store->id}&is_active=1");
        $draftStorefrontRes->assertOk();
        $this->assertFalse(collect($draftStorefrontRes->json())->contains('id', $product->id));

        // 6. When published (is_active = true), product appears under the correct collection on storefront
        $product->update(['is_active' => true]);
        $pubStorefrontRes = $this->getJson("/api/products?store_id={$store->id}&is_active=1");
        $pubStorefrontRes->assertOk();
        $pubItem = collect($pubStorefrontRes->json())->firstWhere('id', $product->id);
        $this->assertNotNull($pubItem);
        $this->assertSame($createdCatId, $pubItem['category_id']);
        $this->assertSame('Handcrafted Accessories', $pubItem['category']['name']);
    }

    public function test_future_sync_never_overwrites_owner_selling_price(): void
    {
        $user = User::factory()->create();
        $store = $this->createStoreForUser($user, 'Sync Price Store');
        $category = \App\Models\Category::create([
            'store_id' => $store->id,
            'name' => 'Fashion',
            'slug' => 'fashion',
        ]);
        $headers = ['X-Store-Id' => (string) $store->id];

        // Import product with custom owner selling price ₹1199 (supplier cost is ₹380)
        $this->actingAs($user)->withHeaders($headers)->postJson('/api/meesho/import', [
            'meesho_product_id' => 'MSH-AP-101',
            'selling_price' => 1199.00,
            'category_id' => $category->id,
        ])->assertCreated();

        $toastkartProduct = Product::where('store_id', $store->id)->firstOrFail();
        $meeshoProduct = MeeshoProduct::where('store_id', $store->id)->firstOrFail();
        $this->assertEquals(1199.00, (float) $toastkartProduct->price);
        $this->assertEquals(1199.00, (float) $meeshoProduct->selling_price);

        // Run sync
        $syncRes = $this->actingAs($user)->withHeaders($headers)->postJson("/api/meesho/products/{$meeshoProduct->id}/sync");
        $syncRes->assertOk();

        // Refresh and verify selling price was NOT overwritten by supplier suggested or source price
        $toastkartProduct->refresh();
        $meeshoProduct->refresh();
        $this->assertEquals(1199.00, (float) $toastkartProduct->price);
        $this->assertEquals(1199.00, (float) $meeshoProduct->selling_price);
        $this->assertEquals(380.00, (float) $meeshoProduct->source_price);
        $this->assertEquals(1299.00, (float) $meeshoProduct->original_price);
        $this->assertEquals(1299.00, (float) $toastkartProduct->compare_price);
    }

    public function test_product_detail_serves_pre_cached_search_product_during_reefapi_rate_limit(): void
    {
        config(['services.reefapi.api_key' => 'fake-test-key']);
        \Illuminate\Support\Facades\Cache::flush();

        // 1. Search returns products and pre-caches them
        Http::fake([
            'https://api.reefapi.com/meesho/v1/search' => Http::response([
                'ok' => true,
                'data' => [
                    'query' => 'Lipstick',
                    'results' => [[
                        'product_id' => 'cached-lip-999',
                        'catalog_id' => 'cat-999',
                        'title' => 'Cached Velvet Lipstick',
                        'price' => 299,
                        'original_price' => 599,
                        'currency' => 'INR',
                        'url' => 'https://www.meesho.com/velvet-lipstick/p/cached-lip-999',
                        'image' => 'https://images.meesho.com/velvet.jpg',
                        'images' => ['https://images.meesho.com/velvet.jpg'],
                    ]],
                ],
                'meta' => ['pagination' => ['cursor' => null, 'has_more' => false]],
                'error' => null,
            ]),
        ]);

        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Detail Cache Store');

        $searchRes = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->getJson('/api/meesho/search?query=Lipstick');
        $searchRes->assertOk();

        // 2. Now ReefAPI rate-limits (HTTP 429) for product/detail
        Http::fake([
            'https://api.reefapi.com/meesho/v1/product/detail' => Http::response([
                'ok' => false,
                'error' => ['code' => 'RATE_LIMITED', 'message' => 'Rate limit exceeded'],
            ], 429, ['Retry-After' => '10']),
        ]);

        // 3. Requesting product detail still succeeds using cached search data!
        $detailRes = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->getJson('/api/meesho/product/cached-lip-999');

        $detailRes->assertOk()
            ->assertJsonPath('product.meesho_product_id', 'cached-lip-999')
            ->assertJsonPath('product.title', 'Cached Velvet Lipstick')
            ->assertJsonPath('product.source_price', 299)
            ->assertJsonPath('product.original_price', 599);
    }

    public function test_product_detail_falls_back_to_staging_if_live_detail_rate_limited(): void
    {
        config(['services.reefapi.api_key' => 'fake-test-key']);
        \Illuminate\Support\Facades\Cache::flush();

        // Product detail endpoint returns 429 rate limit
        Http::fake([
            'https://api.reefapi.com/meesho/v1/product/detail' => Http::response([
                'ok' => false,
                'error' => ['code' => 'RATE_LIMITED', 'message' => 'Rate limit reached'],
            ], 429),
        ]);

        $user = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($user, 'Fallback Staging Store');

        // Staging catalog product MSH-AP-101
        $detailRes = $this->actingAs($user)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->getJson('/api/meesho/product/MSH-AP-101');

        $detailRes->assertOk()
            ->assertJsonPath('product.meesho_product_id', 'MSH-AP-101')
            ->assertJsonPath('product.source_price', 380);
    }
}

