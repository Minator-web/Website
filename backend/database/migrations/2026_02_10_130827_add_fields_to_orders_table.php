<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('subtotal')->default(0)->after('user_id');
            $table->unsignedBigInteger('shipping_fee')->default(0)->after('subtotal');

            $table->string('customer_name')->nullable()->after('status');
            $table->string('customer_email')->nullable()->after('customer_name');
            $table->string('customer_phone')->nullable()->after('customer_email');
            $table->text('shipping_address')->nullable()->after('customer_phone');

            $table->timestamp('paid_at')->nullable()->after('shipping_address');
            $table->string('payment_ref')->nullable()->after('paid_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'subtotal','shipping_fee',
                'customer_name','customer_email','customer_phone','shipping_address',
                'paid_at','payment_ref'
            ]);
        });
    }
};
