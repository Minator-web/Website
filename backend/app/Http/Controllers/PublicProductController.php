<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class PublicProductController extends Controller
{
    public function index() {
        return Product::where('is_active', true)->latest()->paginate(12);
    }

    public function show(Product $product) {
        abort_unless($product->is_active, 404);
        return $product;
    }


    public function stock(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:products,id'],
        ]);

        return Product::whereIn('id', $data['ids'])
            ->get(['id', 'stock', 'is_active']);
    }
}
