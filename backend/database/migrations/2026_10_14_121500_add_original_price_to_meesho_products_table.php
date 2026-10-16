<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('meesho_products') && !Schema::hasColumn('meesho_products', 'original_price')) {
            Schema::table('meesho_products', function (Blueprint $table) {
                $table->decimal('original_price', 10, 2)->nullable()->after('selling_price');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('meesho_products') && Schema::hasColumn('meesho_products', 'original_price')) {
            Schema::table('meesho_products', function (Blueprint $table) {
                $table->dropColumn('original_price');
            });
        }
    }
};
