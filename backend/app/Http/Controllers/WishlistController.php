<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function ids(Request $request)
    {
        $user = $request->user();
        $ids = $user->wishlistProducts()->pluck('products.id');
        return $ids->map(fn ($x) => (int) $x)->values();
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $items = $user->wishlistProducts()
            ->where('products.is_active', true) // می‌تونی برداری اگر خواستی inactive هم نشون بدی
            ->latest('wishlists.id')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function toggle(Request $request, Product $product)
    {
        $user = $request->user();

        $exists = $user->wishlistProducts()->where('products.id', $product->id)->exists();

        if ($exists) {
            $user->wishlistProducts()->detach($product->id);
            return response()->json(['liked' => false]);
        }

        $user->wishlistProducts()->attach($product->id);
        return response()->json(['liked' => true]);
    }

    public function destroy(Request $request, Product $product)
    {
        $request->user()->wishlistProducts()->detach($product->id);
        return response()->json(['message' => 'Removed']);
    }
}
