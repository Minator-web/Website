<?php

namespace App\Services;

class ShippingService
{

    public function calculate(string $city, int $subtotal): array
    {
        $c = mb_strtolower(trim($city));

        $method = 'post';
        $fee = 60000;

        if ($c === 'Tehran' || $c === 'tehran') {
            $method = 'courier';
            $fee = 30000;
        }

        if ($subtotal >= 1_000_000) {
            $method = 'free';
            $fee = 0;
        }

        return [
            'shipping_method' => $method,
            'shipping_fee' => $fee,
        ];
    }
}
