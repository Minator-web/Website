<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => 'pending',
            'subtotal' => 0,
            'shipping_fee' => 30000,
            'total_price' => 0,
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'shipping_address' => fake()->address(),
            'city' => 'Tehran',
        ];
    }

}
