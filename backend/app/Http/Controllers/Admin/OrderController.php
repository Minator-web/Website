<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{


    public function setTracking(Request $request, Order $order)
    {
        $data = $request->validate([
            'tracking_code' => ['nullable','string','max:100'],
        ]);

        $order->tracking_code = $data['tracking_code'] ?? null;
        $order->save();

        return response()->json([
            'message' => 'Tracking updated',
            'order' => $order->fresh()->load(['user','items.product']),
        ]);
    }

    public function index(Request $request)
    {
        $q = Order::query();

        $q->with(['user']);

        if ($request->filled('status') && $request->status !== 'all') {
            $q->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);

            $q->where(function ($qq) use ($search) {
                if (ctype_digit($search)) {
                    $qq->orWhere('id', (int) $search);
                }

                $qq->orWhereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });

            });
        }

        $perPage = (int) ($request->per_page ?? 10);
        $perPage = max(1, min($perPage, 50));

        return $q->latest()->paginate($perPage);
    }

    public function show(Order $order)
    {
        return $order->load([
            'user',
            'items.product'
        ]);
    }

    public function update(Request $request, Order $order)
    {
        $allowedStatuses = Order::allowedStatuses();

        $data = $request->validate([
            'status' => ['required', 'string', Rule::in($allowedStatuses)],
        ]);

        $from = (string) $order->status;
        $to   = (string) $data['status'];

        if (!Order::canTransition($from, $to)) {
            return response()->json([
                'message' => "Invalid status change: {$from} -> {$to}",
                'allowed_next' => Order::transitionFlow()[strtolower($from)] ?? [],
            ], 422);
        }

        if ($to === Order::STATUS_CANCELLED && $from !== Order::STATUS_CANCELLED) {
            $order->load('items');

            DB::transaction(function () use ($order) {
                foreach ($order->items as $item) {
                    Product::where('id', $item->product_id)
                        ->lockForUpdate()
                        ->increment('stock', (int) $item->qty);
                }
            });
        }

        $order->status = $to;
        $order->save();

        return response()->json([
            'message' => 'Status updated',
            'order' => $order->fresh()->load('user'),
        ]);
    }



    public function destroy(Order $order)
    {

        $order->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Order cancelled',
            'order' => $order->fresh()->load('user'),
        ]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }
}
