<?php

namespace App\Services;

class ShippingService
{
    /**
     * می‌تونی بعداً این رو از DB بخونی (جدول shipping_rules)
     */
    public function calculate(string $city, int $subtotal): array
    {
        $c = mb_strtolower(trim($city));

        // حداقل‌ها
        $method = 'post'; // پیشفرض
        $fee = 60000;

        // تهران
        if ($c === 'تهران' || $c === 'tehran') {
            $method = 'courier';
            $fee = 30000;
        }

        // رایگان بالای 1,000,000
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
