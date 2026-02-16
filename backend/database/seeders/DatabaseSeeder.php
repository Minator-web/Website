<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Super Admin',
            'email' => 'super@admin.com',
            'password' => bcrypt('password'),
            'role' => 'super_admin',
        ]);

        User::create([
            'name' => 'Admin User',
            'email' => 'admin@admin.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        User::factory(8)->create();

        $products = Product::factory(50)->create();

        $users = User::all();

        Order::factory(30)->create()->each(function ($order) use ($products) {

            $randomProducts = $products->random(rand(1, 3));

            $subtotal = 0;

            foreach ($randomProducts as $product) {

                $qty = rand(1, 2);
                $line = $product->price * $qty;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_title' => $product->title,
                    'unit_price' => $product->price,
                    'qty' => $qty,
                    'subtotal' => $line,
                ]);

                $subtotal += $line;
            }

            $order->update([
                'subtotal' => $subtotal,
                'total_price' => $subtotal + 30000,
            ]);
        });
    }
}

