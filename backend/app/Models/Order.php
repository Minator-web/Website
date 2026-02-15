<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{

    // وضعیت‌های مجاز سفارش (یکپارچه با فرانت/ادمین)
    public const STATUS_PENDING   = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_SHIPPED   = 'shipped';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_CANCELLED = 'cancelled';

    public static function allowedStatuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_CONFIRMED,
            self::STATUS_SHIPPED,
            self::STATUS_DELIVERED,
            self::STATUS_CANCELLED,
        ];
    }

    /**
     * جریان مجاز تغییر وضعیت.
     * فعلاً بدون پرداخت.
     */
    public static function transitionFlow(): array
    {
        return [
            self::STATUS_PENDING   => [self::STATUS_CONFIRMED, self::STATUS_CANCELLED],
            self::STATUS_CONFIRMED => [self::STATUS_SHIPPED, self::STATUS_CANCELLED],
            self::STATUS_SHIPPED   => [self::STATUS_DELIVERED, self::STATUS_CANCELLED],
            self::STATUS_DELIVERED => [],
            self::STATUS_CANCELLED => [],
        ];
    }

    public static function canTransition(string $from, string $to): bool
    {
        $from = strtolower(trim($from));
        $to   = strtolower(trim($to));

        if ($from === $to) return true;

        $flow = self::transitionFlow();
        $allowedNext = $flow[$from] ?? [];

        return in_array($to, $allowedNext, true);
    }

    protected $fillable = [
        'user_id','subtotal','shipping_fee','total_price','status',
        'customer_name','customer_email','customer_phone','shipping_address',
        'paid_at','payment_ref','city','order_code','client_request_id','shipping_method','tracking_code',

    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
