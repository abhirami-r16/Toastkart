<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shiprocket_shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('store_id')->default(86)->constrained('stores')->onDelete('cascade');
            $table->string('shiprocket_order_id')->nullable()->index();
            $table->string('shipment_id')->nullable()->index();
            $table->string('awb_code')->nullable()->index();
            $table->unsignedBigInteger('courier_company_id')->nullable();
            $table->string('courier_name')->nullable();
            $table->string('pickup_location')->default('Primary');
            $table->string('sync_status')->default('unsynced')->index(); // unsynced, synced, awb_generated, pickup_scheduled, in_transit, out_for_delivery, delivered, cancelled, failed
            $table->string('shipment_status')->nullable();
            $table->integer('shipment_status_code')->nullable();
            $table->text('label_url')->nullable();
            $table->text('manifest_url')->nullable();
            $table->text('tracking_url')->nullable();
            $table->string('etd')->nullable();
            $table->decimal('package_weight', 8, 2)->default(0.50);
            $table->decimal('package_length', 8, 2)->default(10.00);
            $table->decimal('package_breadth', 8, 2)->default(10.00);
            $table->decimal('package_height', 8, 2)->default(10.00);
            $table->decimal('shipping_charges', 10, 2)->nullable();
            $table->string('pickup_scheduled_date')->nullable();
            $table->json('response_payload')->nullable();
            $table->json('tracking_history')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            // Unique composite index to prevent duplicate records per order
            $table->unique(['order_id', 'store_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shiprocket_shipments');
    }
};
