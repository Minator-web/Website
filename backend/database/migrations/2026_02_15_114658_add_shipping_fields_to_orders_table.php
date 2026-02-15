<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'shipping_method')) {
                $table->string('shipping_method', 50)->nullable()->after('shipping_fee');
            }
            if (!Schema::hasColumn('orders', 'tracking_code')) {
                $table->string('tracking_code', 100)->nullable()->after('order_code')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'shipping_method')) {
                $table->dropColumn('shipping_method');
            }
            if (Schema::hasColumn('orders', 'tracking_code')) {
                $table->dropColumn('tracking_code');
            }
        });
    }
};
