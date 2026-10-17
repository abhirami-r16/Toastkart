<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\MeeshoAccount;
use App\Models\MeeshoOrder;
use App\Models\MeeshoProduct;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class MeeshoAutomatedFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.meesho.fulfillment_mode', 'manual_assisted');
        Config::set('services.meesho.auto_fulfill_policy', 'paid_only');
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

    private function createMeeshoProduct(Store $store, float $sourcePrice = 300.0, float $sellingPrice = 699.0): array
    {
        $category = Category::create([
            'store_id' => $store->id,
            'name' => 'Fashion',
            'slug' => 'fashion-' . rand(100, 999),
        ]);

        $product = Product::create([
            'store_id' => $store->id,
            'category_id' => $category->id,
            'name' => 'Designer Cotton Kurti',
            'slug' => 'designer-cotton-kurti-' . rand(1000, 9999),
            'price' => $sellingPrice,
            'stock_quantity' => 50,
            'status' => 'In Stock',
            'size' => 'L',
            'color' => 'Navy Blue',
            'is_active' => true,
        ]);

        $meeshoProduct = MeeshoProduct::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'meesho_product_id' => 'MSH-TEST-' . rand(1000, 9999),
            'title' => 'Designer Cotton Kurti',
            'source_price' => $sourcePrice,
            'selling_price' => $sellingPrice,
            'estimated_shipping' => 45.00,
            'margin_amount' => $sellingPrice - $sourcePrice,
            'margin_percentage' => round((($sellingPrice - $sourcePrice) / $sellingPrice) * 100, 2),
            'stock_quantity' => 50,
            'stock_status' => 'In Stock',
        ]);

        return [$product, $meeshoProduct];
    }

    public function test_order_creation_with_meesho_product_automatically_generates_fulfillment_record(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'Auto Fulfillment Store');
        [$product, $meeshoProduct] = $this->createMeeshoProduct($store, 300.0, 700.0);

        // Customer places order on storefront
        $payload = [
            'store_id' => $store->id,
            'customer_name' => 'Ananya Sharma',
            'customer_email' => 'ananya@example.com',
            'customer_phone' => '9876543210',
            'shipping_address' => 'Flat 402, Lotus Tower, Indiranagar, Bengaluru - 560038',
            'payment_method' => 'online', // Paid
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => 700.00,
                    'quantity' => 2,
                ],
            ],
        ];

        $res = $this->postJson('/api/orders', $payload);
        $res->assertStatus(201);
        $orderId = $res->json('id');

        // Verify that a dropshipping fulfillment record was automatically created
        $this->assertDatabaseHas('meesho_orders', [
            'store_id' => $store->id,
            'order_id' => $orderId,
            'meesho_product_id' => $meeshoProduct->id,
            'quantity' => 2,
            'customer_name' => 'Ananya Sharma',
            'toastkart_selling_price' => 1400.00, // 700 * 2
            'source_purchase_cost' => 600.00,    // 300 * 2
            'shipping_charges' => 45.00,
            'is_profit_confirmed' => false,
            'customer_payment_status' => 'Paid',
            'supplier_order_status' => 'Pending Fulfillment',
        ]);

        $mOrder = MeeshoOrder::where('order_id', $orderId)->firstOrFail();
        $this->assertNotEmpty($mOrder->idempotency_key);
        $this->assertSame('L', $mOrder->variant_info['size'] ?? null);
        $this->assertSame('Navy Blue', $mOrder->variant_info['color'] ?? null);
    }

    public function test_non_meesho_products_do_not_generate_dropshipping_fulfillment(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'Standard Store');

        $category = Category::create([
            'store_id' => $store->id,
            'name' => 'General',
            'slug' => 'general',
        ]);

        $customProduct = Product::create([
            'store_id' => $store->id,
            'category_id' => $category->id,
            'name' => 'Handmade Soap',
            'slug' => 'handmade-soap-' . rand(100, 999),
            'price' => 250.00,
            'stock_quantity' => 10,
            'status' => 'In Stock',
        ]);

        $res = $this->postJson('/api/orders', [
            'store_id' => $store->id,
            'customer_name' => 'Rohit Verma',
            'customer_email' => 'rohit@example.com',
            'customer_phone' => '9123456789',
            'shipping_address' => 'Mumbai, India',
            'payment_method' => 'online',
            'items' => [
                [
                    'product_id' => $customProduct->id,
                    'product_name' => 'Handmade Soap',
                    'price' => 250.00,
                    'quantity' => 1,
                ],
            ],
        ]);

        $res->assertStatus(201);
        $this->assertDatabaseCount('meesho_orders', 0);
    }

    public function test_auto_fulfillment_policy_waits_for_paid_status_before_supplier_submission(): void
    {
        Config::set('services.meesho.fulfillment_mode', 'sandbox');
        Config::set('services.meesho.auto_fulfill_policy', 'paid_only');

        $owner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'COD Policy Store');
        [$product, $meeshoProduct] = $this->createMeeshoProduct($store, 200.0, 500.0);

        // Place order with COD
        $res = $this->postJson('/api/orders', [
            'store_id' => $store->id,
            'customer_name' => 'Kavita Pillai',
            'customer_email' => 'kavita@example.com',
            'customer_phone' => '9888877776',
            'shipping_address' => 'Chennai, Tamil Nadu',
            'payment_method' => 'cod',
            'items' => [
                [
                    'product_id' => $product->id,
                    'price' => 500.00,
                    'quantity' => 1,
                ],
            ],
        ]);

        $res->assertStatus(201);
        $orderId = $res->json('id');

        $mOrder = MeeshoOrder::where('order_id', $orderId)->firstOrFail();
        $this->assertSame('COD', $mOrder->customer_payment_status);
        // Under paid_only policy, COD order must wait in Pending Fulfillment
        $this->assertSame('Pending Fulfillment', $mOrder->supplier_order_status);
        $this->assertNull($mOrder->meesho_order_id);
    }

    public function test_paid_order_in_sandbox_mode_automatically_places_supplier_order(): void
    {
        Config::set('services.meesho.fulfillment_mode', 'sandbox');
        Config::set('services.meesho.auto_fulfill_policy', 'paid_only');

        $owner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'Auto Sandbox Store');
        [$product, $meeshoProduct] = $this->createMeeshoProduct($store, 400.0, 999.0);

        $res = $this->postJson('/api/orders', [
            'store_id' => $store->id,
            'customer_name' => 'Deepak Chopra',
            'customer_email' => 'deepak@example.com',
            'customer_phone' => '9777766665',
            'shipping_address' => 'Delhi NCR',
            'payment_method' => 'online',
            'items' => [
                [
                    'product_id' => $product->id,
                    'price' => 999.00,
                    'quantity' => 1,
                ],
            ],
        ]);

        $res->assertStatus(201);
        $orderId = $res->json('id');

        $mOrder = MeeshoOrder::where('order_id', $orderId)->firstOrFail();
        // In sandbox mode with paid order, auto submission should succeed
        $this->assertSame('Supplier Confirmed', $mOrder->supplier_order_status);
        $this->assertStringStartsWith('SANDBOX-MSH-', $mOrder->meesho_order_id);
        $this->assertSame('Delhivery Express', $mOrder->courier_partner);
        $this->assertNotEmpty($mOrder->awb_number);

        // Toastkart customer order should automatically transition to Processing
        $order = Order::findOrFail($orderId);
        $this->assertSame('Processing', $order->status);
    }

    public function test_duplicate_order_idempotency_prevents_duplicate_supplier_bookings(): void
    {
        Config::set('services.meesho.fulfillment_mode', 'sandbox');

        $owner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'Idempotent Store');
        [$product, $meeshoProduct] = $this->createMeeshoProduct($store, 300.0, 600.0);

        $order = Order::create([
            'store_id' => $store->id,
            'order_number' => '#ORD-IDEMP-99',
            'customer_name' => 'Suresh Raina',
            'customer_email' => 'suresh@test.com',
            'total_amount' => 600.00,
            'status' => 'Pending',
            'payment_status' => 'Paid',
        ]);

        $mOrder = MeeshoOrder::create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'meesho_product_id' => $meeshoProduct->id,
            'toastkart_selling_price' => 600.00,
            'source_purchase_cost' => 300.00,
            'customer_payment_status' => 'Paid',
            'supplier_order_status' => 'Pending Fulfillment',
        ]);

        // First submission
        $res1 = $this->actingAs($owner)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$mOrder->id}/retry");

        $res1->assertOk();
        $assignedSupplierId = $res1->json('order.meesho_order_id');
        $this->assertNotEmpty($assignedSupplierId);

        // Second submission attempt on already booked order returns idempotent 200 without creating a new ID
        $res2 = $this->actingAs($owner)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$mOrder->id}/retry");

        $res2->assertOk();
        $this->assertSame($assignedSupplierId, $res2->json('order.meesho_order_id'));
    }

    public function test_supplier_api_timeout_marks_submission_pending_verification_safely(): void
    {
        Config::set('services.meesho.fulfillment_mode', 'sandbox');

        $owner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'Timeout Store');
        [$product, $meeshoProduct] = $this->createMeeshoProduct($store, 250.0, 550.0);

        $order = Order::create([
            'store_id' => $store->id,
            'order_number' => '#ORD-TIMEOUT-01',
            'customer_name' => 'Timeout User',
            'customer_email' => 'timeout@test.com',
            'customer_phone' => '0000000002', // Special test phone triggering timeout simulation
            'shipping_address' => 'Indore, MP',
            'total_amount' => 550.00,
            'status' => 'Pending',
            'payment_status' => 'Paid',
        ]);

        $mOrder = MeeshoOrder::create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'meesho_product_id' => $meeshoProduct->id,
            'customer_phone' => '0000000002',
            'customer_payment_status' => 'Paid',
            'supplier_order_status' => 'Pending Fulfillment',
        ]);

        $res = $this->actingAs($owner)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$mOrder->id}/retry");

        $res->assertStatus(422);
        $mOrder->refresh();
        $this->assertSame('Submission Pending Verification', $mOrder->supplier_order_status);
        $this->assertStringContainsString('timed out', $mOrder->failure_reason);
        $this->assertSame(1, $mOrder->retry_count);
    }

    public function test_supplier_out_of_stock_failure_marks_status_failed_and_records_reason(): void
    {
        Config::set('services.meesho.fulfillment_mode', 'sandbox');

        $owner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'OOS Store');
        [$product, $meeshoProduct] = $this->createMeeshoProduct($store, 200.0, 450.0);

        $order = Order::create([
            'store_id' => $store->id,
            'order_number' => '#ORD-OOS-01',
            'customer_name' => 'OOS User',
            'customer_email' => 'oos@test.com',
            'customer_phone' => '0000000001', // Special test phone triggering out-of-stock simulation
            'total_amount' => 450.00,
            'status' => 'Pending',
            'payment_status' => 'Paid',
        ]);

        $mOrder = MeeshoOrder::create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'meesho_product_id' => $meeshoProduct->id,
            'customer_phone' => '0000000001',
            'customer_payment_status' => 'Paid',
            'supplier_order_status' => 'Pending Fulfillment',
        ]);

        $res = $this->actingAs($owner)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$mOrder->id}/retry");

        $res->assertStatus(422);
        $mOrder->refresh();
        $this->assertSame('Failed', $mOrder->supplier_order_status);
        $this->assertStringContainsString('out of stock', $mOrder->failure_reason);
    }

    public function test_tracking_sync_updates_carrier_awb_and_marks_toastkart_order_delivered_confirming_profit(): void
    {
        Config::set('services.meesho.fulfillment_mode', 'sandbox');

        $owner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'Tracking Store');
        [$product, $meeshoProduct] = $this->createMeeshoProduct($store, 350.0, 850.0);

        $order = Order::create([
            'store_id' => $store->id,
            'order_number' => '#ORD-TRACK-99',
            'customer_name' => 'Meera Nair',
            'customer_email' => 'meera@test.com',
            'total_amount' => 850.00,
            'status' => 'Processing',
            'payment_status' => 'Paid',
        ]);

        $mOrder = MeeshoOrder::create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'meesho_product_id' => $meeshoProduct->id,
            'meesho_order_id' => 'SANDBOX-MSH-777',
            'toastkart_selling_price' => 850.00,
            'source_purchase_cost' => 350.00,
            'shipping_charges' => 45.00,
            'net_profit' => 421.00,
            'is_profit_confirmed' => false,
            'customer_payment_status' => 'Paid',
            'supplier_order_status' => 'Supplier Confirmed',
            'shipment_status' => 'Out for Delivery',
        ]);

        // Polling sync-tracking advances 'Out for Delivery' to 'Delivered' in sandbox simulation
        $res = $this->actingAs($owner)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$mOrder->id}/sync-tracking");

        $res->assertOk();
        $mOrder->refresh();
        $this->assertSame('Delivered', $mOrder->shipment_status);
        $this->assertTrue((bool)$mOrder->is_profit_confirmed);
        $this->assertNotNull($mOrder->delivered_at);

        // Toastkart customer order must automatically update to Delivered
        $order->refresh();
        $this->assertSame('Delivered', $order->status);
    }

    public function test_rto_reconciles_unrecoverable_shipping_charges_as_operational_loss(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'RTO Store');
        [$product, $meeshoProduct] = $this->createMeeshoProduct($store, 300.0, 700.0);

        $order = Order::create([
            'store_id' => $store->id,
            'order_number' => '#ORD-RTO-01',
            'customer_name' => 'Rajesh Khanna',
            'customer_email' => 'rajesh@test.com',
            'total_amount' => 700.00,
            'status' => 'Shipped',
            'payment_status' => 'Paid',
        ]);

        $mOrder = MeeshoOrder::create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'meesho_product_id' => $meeshoProduct->id,
            'meesho_order_id' => 'MSH-REAL-999',
            'toastkart_selling_price' => 700.00,
            'source_purchase_cost' => 300.00,
            'shipping_charges' => 50.00,
            'net_profit' => 322.00,
            'is_profit_confirmed' => false,
            'customer_payment_status' => 'Paid',
            'supplier_order_status' => 'Supplier Confirmed',
            'shipment_status' => 'In Transit',
        ]);

        // Customer refused package at doorstep -> RTO
        $res = $this->actingAs($owner)
            ->withHeaders(['X-Store-Id' => $store->id])
            ->postJson("/api/meesho/orders/{$mOrder->id}/return", [
                'return_status' => 'rto',
                'return_reason' => 'Customer refused COD/delivery at doorstep.',
            ]);

        $res->assertOk();
        $mOrder->refresh();
        $this->assertSame('Returned', $mOrder->shipment_status);
        $this->assertFalse((bool)$mOrder->is_profit_confirmed);
        // Net profit should reflect the unrecoverable shipping loss (-50.00)
        $this->assertEquals(-50.00, (float)$mOrder->net_profit);
    }

    public function test_public_tracking_webhook_updates_status(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $store = $this->createStoreForUser($owner, 'Webhook Store');

        $order = Order::create([
            'store_id' => $store->id,
            'order_number' => '#ORD-WH-01',
            'customer_name' => 'Webhook Customer',
            'customer_email' => 'webhook@test.com',
            'total_amount' => 500.00,
            'status' => 'Processing',
        ]);

        $mOrder = MeeshoOrder::create([
            'store_id' => $store->id,
            'order_id' => $order->id,
            'meesho_order_id' => 'MSH-CARRIER-WH-123',
            'awb_number' => 'DLH987654321',
            'shipment_status' => 'Picked Up',
            'is_profit_confirmed' => false,
        ]);

        $payload = [
            'supplier_order_id' => 'MSH-CARRIER-WH-123',
            'awb_number' => 'DLH987654321',
            'shipment_status' => 'In Transit',
            'courier_partner' => 'Delhivery',
            'tracking_url' => 'https://track.delhivery.com/DLH987654321',
        ];

        $res = $this->postJson('/api/webhooks/meesho-tracking', $payload);
        $res->assertOk();

        $mOrder->refresh();
        $this->assertSame('In Transit', $mOrder->shipment_status);
        $order->refresh();
        $this->assertSame('Shipped', $order->status);
    }
}
