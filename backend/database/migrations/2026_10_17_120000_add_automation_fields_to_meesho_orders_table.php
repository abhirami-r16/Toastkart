<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meesho_orders', function (Blueprint $table) {
            $table->integer('quantity')->default(1)->after('meesho_product_id');
            $table->json('variant_info')->nullable()->after('quantity');
            $table->string('customer_name')->nullable()->after('variant_info');
            $table->string('customer_email')->nullable()->after('customer_name');
            $table->string('customer_phone')->nullable()->after('customer_email');
            $table->text('customer_address')->nullable()->after('customer_phone');
            $table->string('idempotency_key')->nullable()->unique()->after('customer_address');
            $table->text('failure_reason')->nullable()->after('notes');
            $table->integer('retry_count')->default(0)->after('failure_reason');
            $table->timestamp('last_retry_at')->nullable()->after('retry_count');
        });
    }

    public function down(): void
    {
        Schema::table('meesho_orders', function (Blueprint $table) {
            $table->dropColumn([
                'quantity',
                'variant_info',
                'customer_name',
                'customer_email',
                'customer_phone',
                'customer_address',
                'idempotency_key',
                'failure_reason',
                'retry_count',
                'last_retry_at',
            ]);
        });
    }
};
