<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    // اینجا status های مجاز رو یکجا نگه می‌داریم
    private array $allowedStatuses = [
        'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'
    ];

    public function index(Request $request)
    {
        $q = Order::query();

        // اگر رابطه user داری
        $q->with(['user']); // اگر نداری، این خط رو کامنت کن

        // ✅ فیلتر status
        if ($request->filled('status') && $request->status !== 'all') {
            $q->where('status', $request->status);
        }

        // ✅ جستجو: order id یا نام/ایمیل کاربر
        if ($request->filled('search')) {
            $search = trim($request->search);

            $q->where(function ($qq) use ($search) {
                // اگر عدد بود: با id هم سرچ کن
                if (ctype_digit($search)) {
                    $qq->orWhere('id', (int) $search);
                }

                // سرچ روی user (name/email)
                $qq->orWhereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });

                // اگر فیلدهای دیگه داری مثل tracking_code یا phone:
                // $qq->orWhere('tracking_code', 'like', "%{$search}%");
            });
        }

        $perPage = (int) ($request->per_page ?? 10);
        $perPage = max(1, min($perPage, 50)); // محدودیت منطقی

        return $q->latest()->paginate($perPage);
    }

    public function show(Order $order)
    {
        // اگر رابطه items و product داری:
        return $order->load([
            'user',
            'items.product'
        ]);
    }

    public function update(Request $request, Order $order)
    {
        $allowedStatuses = ['pending','confirmed','shipped','delivered','cancelled'];

        $data = $request->validate([
            'status' => ['required','string', \Illuminate\Validation\Rule::in($allowedStatuses)],
        ]);

        $flow = [
            'pending'   => ['confirmed', 'cancelled'],
            'confirmed' => ['shipped', 'cancelled'],
            'shipped'   => ['delivered', 'cancelled'],
            'delivered' => [],
            'cancelled' => [],
        ];

        $from = (string) $order->status;
        $to   = (string) $data['status'];

        // اجازه بده همون وضعیت قبلی دوباره ست بشه
        if ($to !== $from) {
            $allowedNext = $flow[$from] ?? [];
            if (!in_array($to, $allowedNext, true)) {
                return response()->json([
                    'message' => "Invalid status change: {$from} -> {$to}"
                ], 422);
            }
        }

        $order->status = $to;
        $order->save();

        return response()->json([
            'message' => 'Status updated',
            'order' => $order->fresh()->load('user'),
        ]);
    }


    // معمولاً پیشنهاد نمی‌شه سفارش رو حذف کنی. بهتره status = cancelled
    public function destroy(Order $order)
    {
        // اگر میخوای واقعاً حذف بشه:
        // $order->delete();

        // پیشنهاد بهتر: cancel کردن
        $order->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Order cancelled',
            'order' => $order->fresh()->load('user'),
        ]);
    }

    // store رو برای ادمین معمولاً نیاز نداری (order توسط مشتری ساخته میشه)
    public function store(Request $request)
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }
}
