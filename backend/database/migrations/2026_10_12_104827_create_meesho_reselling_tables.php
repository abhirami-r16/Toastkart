<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Marketplace Connection (stores Meesho credentials / account status per Toastkart store)
        Schema::create('meesho_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('supplier_id')->nullable();
            $table->string('account_name')->nullable();
            $table->string('registered_email')->nullable();
            $table->string('registered_phone')->nullable();
            // Encrypted server-side credentials
            $table->text('encrypted_api_key')->nullable();
            $table->text('encrypted_api_secret')->nullable();
            $table->text('encrypted_auth_token')->nullable();
            // Provider & approval mode: pending_approval, sandbox_verified, live_approved, disconnected
            $table->string('connection_status')->default('disconnected');
            $table->string('mode')->default('manual_assisted'); // manual_assisted, sandbox_mock, partner_api
            $table->timestamp('connected_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 2. Reselling Products (maps Meesho Catalog/Products to Toastkart Product catalog)
        Schema::create('meesho_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('cascade');
            $table->string('meesho_product_id')->index();
            $table->string('meesho_catalog_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('sku')->nullable();
            $table->decimal('source_price', 10, 2)->default(0.00); // Supplier price on Meesho
            $table->decimal('selling_price', 10, 2)->default(0.00); // Toastkart store listing price
            $table->decimal('estimated_shipping', 10, 2)->default(0.00);
            $table->decimal('margin_amount', 10, 2)->default(0.00);
            $table->decimal('margin_percentage', 5, 2)->default(0.00);
            $table->integer('stock_quantity')->default(0);
            $table->string('stock_status')->default('In Stock'); // In Stock, Low Stock, Out of Stock
            $table->text('images')->nullable(); // JSON list of permitted image URLs
            $table->json('variants')->nullable(); // Size, color, variant supplier IDs
            $table->timestamp('last_synced_at')->nullable();
            $table->string('sync_status')->default('synced'); // synced, pending, price_changed, out_of_stock
            $table->timestamps();

            $table->unique(['store_id', 'meesho_product_id']);
        });

        // 3. Reselling Orders & Fulfilment (maps Toastkart Orders to Supplier Order Processing)
        Schema::create('meesho_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('meesho_product_id')->nullable()->constrained('meesho_products')->onDelete('set null');
            
            // External Supplier References
            $table->string('meesho_order_id')->nullable()->index();
            $table->string('meesho_sub_order_id')->nullable();
            
            // Financial Snapshots at time of order
            $table->decimal('toastkart_selling_price', 10, 2)->default(0.00);
            $table->decimal('source_purchase_cost', 10, 2)->default(0.00);
            $table->decimal('shipping_charges', 10, 2)->default(0.00);
            $table->decimal('platform_fees', 10, 2)->default(0.00);
            $table->decimal('payment_gateway_fees', 10, 2)->default(0.00);
            $table->decimal('gross_margin', 10, 2)->default(0.00);
            $table->decimal('net_profit', 10, 2)->default(0.00);
            $table->boolean('is_profit_confirmed')->default(false);

            // Separate Statuses
            $table->string('customer_payment_status')->default('Paid'); // Paid, COD, Pending, Refunded
            $table->string('supplier_order_status')->default('Pending Placement'); 
            // Options: Pending Placement, Placed with Supplier, Supplier Processing, Confirmed, Cancelled
            $table->string('shipment_status')->default('Unfulfilled');
            // Options: Unfulfilled, Label Created, Picked Up, In Transit, Out for Delivery, Delivered, RTO_Initiated, Returned
            
            // Logistics & Tracking
            $table->string('courier_partner')->nullable(); // Delhivery, Shadowfax, Xpressbees, Ekart
            $table->string('awb_number')->nullable()->index();
            $table->string('tracking_url')->nullable();
            $table->timestamp('supplier_placed_at')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            // Returns & Cancellations
            $table->string('return_status')->nullable(); // requested, approved, picked_up, refunded, rejected
            $table->text('return_reason')->nullable();
            $table->decimal('refund_amount', 10, 2)->default(0.00);

            // Fulfilment mode: manual_assisted vs api_automated
            $table->string('fulfilment_mode')->default('manual_assisted');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 4. Synchronization & Audit Logs
        Schema::create('meesho_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('action_type'); // catalog_sync, price_sync, stock_sync, order_dispatch, tracking_update, connection_check
            $table->string('status'); // success, warning, failed, info
            $table->text('message');
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meesho_sync_logs');
        Schema::dropIfExists('meesho_orders');
        Schema::dropIfExists('meesho_products');
        Schema::dropIfExists('meesho_accounts');
    }
};
