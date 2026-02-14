<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_name' => ['required','string','max:255'],
            'customer_email' => ['required','email','max:255'],
            'customer_phone' => ['nullable','string','max:50'],
            'shipping_address' => ['required','string','max:2000'],
            'city' => ['required','string','max:255'],

            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','integer','exists:products,id'],
            'items.*.qty' => ['required','integer','min:1'],
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($data, $user) {

            // 1) محصولات را از DB بگیر (برای قیمت/اکتیو/استوک واقعی)
            $productIds = collect($data['items'])->pluck('product_id')->unique()->values();
            $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            $itemsPayload = [];
            $subtotal = 0;

            foreach ($data['items'] as $it) {
                $p = $products->get($it['product_id']);
                if (!$p) {
                    abort(422, "Product not found");
                }

                if (!$p->is_active) {
                    return response()->json(['message' => "Product {$p->id} is not active"], 422);
                }

                $qty = (int) $it['qty'];

                if ($p->stock < $qty) {
                    return response()->json([
                        'message' => "Insufficient stock for {$p->title}",
                        'product_id' => $p->id,
                        'available' => $p->stock
                    ], 422);
                }

                $unitPrice = (int) $p->price; // فرض: قیمت رو integer ذخیره کردی
                $lineSubtotal = $unitPrice * $qty;
                $subtotal += $lineSubtotal;

                $itemsPayload[] = [
                    'product_id' => $p->id,
                    'product_title' => $p->title,
                    'unit_price' => $unitPrice,
                    'qty' => $qty,
                    'subtotal' => $lineSubtotal,
                ];
            }

            // 2) shipping fee)
            $city = trim($data['city']);

            $shippingFee = 60000;
            if (mb_strtolower($city) === 'تهران' || mb_strtolower($city) === 'tehran') {
                $shippingFee = 30000;
            }
            if ($subtotal >= 1000000) {
                $shippingFee = 0;
            }
            $total = $subtotal + $shippingFee;


            // 3) ساخت Order
            $order = Order::create([
                'user_id' => $user->id,
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'total_price' => $total,
                'status' => 'pending',


                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'shipping_address' => $data['shipping_address'],
                'city' => $city,
            ]);

            $order->order_code = 'ORD-' . now()->format('Y') . '-' . str_pad((string)$order->id, 6, '0', STR_PAD_LEFT);
            $order->save();

            // 4) ساخت Order Items
            foreach ($itemsPayload as $row) {
                $order->items()->create($row);
            }

            // 5) کم کردن stock
            foreach ($data['items'] as $it) {
                $p = $products->get($it['product_id']);
                $p->decrement('stock', (int)$it['qty']);
            }

            return response()->json([
                'message' => 'Order created',
                'order' => $order->load(['items','user']),
            ], 201);
        });
    }

    public function myOrders(Request $request)
    {
        return Order::where('user_id', $request->user()->id)
            ->with('items')   // یا with('items.product') اگر خواستی
            ->latest()
            ->paginate(10);
    }

    public function showMine(Request $request, Order $order)
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $order->load(['items.product']); // این خیلی به درد UI می‌خوره
    }
}
