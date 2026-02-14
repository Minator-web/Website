<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;







// public
Route::get('/products', [PublicProductController::class, 'index']);
Route::get('/products/{product}', [PublicProductController::class, 'show']);
Route::post('/products/stock', [PublicProductController::class, 'stock']);


Route::post('/register', [AuthController::class, 'register']);
Route::middleware('auth:sanctum')
    ->post('/logout', [AuthController::class, 'logout']);
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');// routes/api.php


Route::middleware(['auth:sanctum', 'is_admin'])
    ->prefix('admin')
    ->group(function () {
        Route::apiResource('products', ProductController::class);
        Route::get('dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index']);
        Route::apiResource('orders', OrderController::class)
            ->only(['index', 'show', 'update', 'destroy']);
    });


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/checkout', [CheckoutController::class, 'store']);
    Route::get('/orders/me', [CheckoutController::class, 'myOrders']);
    Route::get('/orders/me/{order}', [CheckoutController::class, 'showMine']);
    Route::patch('/me', [ProfileController::class, 'update']);
    Route::post('/me/change-password', [ProfileController::class, 'changePassword']);
    Route::get('/me', function (Request $request) {
        return $request->user();
    });
});
