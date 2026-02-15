<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\ShippingService;

class CheckoutController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'client_request_id' => ['nullable', 'string', 'max:80'], // ✅ idempotency

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

        $mergedItems = collect($data['items'])
            ->groupBy('product_id')
            ->map(function ($rows, $productId) {
                return [
                    'product_id' => (int) $productId,
                    'qty' => (int) $rows->sum('qty'),
                ];
            })
            ->values()
            ->all();

        return DB::transaction(function () use ($data, $user, $mergedItems) {

            $productIds = collect($mergedItems)->pluck('product_id')->values();
            $products = Product::whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $itemsPayload = [];
            $subtotal = 0;

            foreach ($mergedItems as $it) {
                $p = $products->get($it['product_id']);
                if (!$p) {
                    return response()->json(['message' => "Product not found"], 422);
                }

                if (!$p->is_active) {
                    return response()->json(['message' => "Product {$p->id} is not active"], 422);
                }

                $qty = (int) $it['qty'];

                if ((int) $p->stock < $qty) {
                    return response()->json([
                        'message' => "Insufficient stock for {$p->title}",
                        'product_id' => $p->id,
                        'available' => (int) $p->stock,
                        'requested' => $qty,
                    ], 422);
                }

                $unitPrice = (int) $p->price;
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

            $city = trim($data['city']);

            $shippingFee = 60000;
            if (mb_strtolower($city) === 'Tehran' || mb_strtolower($city) === 'tehran') {
                $shippingFee = 30000;
            }
            if ($subtotal >= 1000000) {
                $shippingFee = 0;
            }

            $total = $subtotal + $shippingFee;

            $clientRequestId = $data['client_request_id'] ?? null;

            if (!empty($clientRequestId)) {
                $existing = Order::where('client_request_id', $clientRequestId)->first();
                if ($existing) {
                    return response()->json([
                        'message' => 'Order already created',
                        'order' => $existing->load(['items.product','user']),
                    ], 200);
                }
            }

            $shipping = app(ShippingService::class)->calculate($city, $subtotal);
            $shippingFee = (int) $shipping['shipping_fee'];
            $shippingMethod = $shipping['shipping_method'];

            $total = $subtotal + $shippingFee;

            $order = Order::create([
                'user_id' => $user->id,
                'client_request_id' => $clientRequestId,
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'total_price' => $total,
                'status' => Order::STATUS_PENDING,
                'shipping_method' => $shippingMethod,


                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'shipping_address' => $data['shipping_address'],
                'city' => $city,
            ]);

            $order->order_code = 'ORD-' . now()->format('Y') . '-' . str_pad((string)$order->id, 6, '0', STR_PAD_LEFT);
            $order->save();


            foreach ($itemsPayload as $row) {
                $order->items()->create($row);
            }

            foreach ($mergedItems as $it) {
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
            ->with('items')
            ->latest()
            ->paginate(10);
    }

    public function showMine(Request $request, Order $order)
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $order->load(['items.product']);
    }

    public function cancelMine(Request $request, Order $order)
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($order->status === Order::STATUS_CANCELLED) {
            return response()->json([
                'message' => 'Order already cancelled',
                'order' => $order->load(['items.product']),
            ], 200);
        }

        if (!in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_CONFIRMED], true)) {
            return response()->json([
                'message' => 'Order cannot be cancelled in current status',
                'status' => $order->status,
            ], 422);
        }

        return DB::transaction(function () use ($order) {
            $order->load('items');

            foreach ($order->items as $item) {
                Product::where('id', $item->product_id)
                    ->lockForUpdate()
                    ->increment('stock', (int) $item->qty);
            }

            $order->status = Order::STATUS_CANCELLED;
            $order->save();

            return response()->json([
                'message' => 'Order cancelled',
                'order' => $order->fresh()->load(['items.product']),
            ], 200);
        });
    }
}
