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
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('razorpay_customer_id')->nullable()->after('razorpay_signature');
            $table->string('razorpay_subscription_id')->nullable()->after('razorpay_customer_id');
            $table->string('razorpay_plan_id')->nullable()->after('razorpay_subscription_id');
            $table->string('payment_mode')->default('manual')->after('razorpay_plan_id');
            $table->boolean('autopay_enabled')->default(false)->after('payment_mode');
            $table->timestamp('next_billing_date')->nullable()->after('expiry_date');
            $table->string('billing_status')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'razorpay_customer_id',
                'razorpay_subscription_id',
                'razorpay_plan_id',
                'payment_mode',
                'autopay_enabled',
                'next_billing_date',
                'billing_status',
            ]);
        });
    }
};
