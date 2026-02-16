<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\WishlistController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicProductController;

use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\DashboardController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Products (public)
Route::get('/products', [PublicProductController::class, 'index']);
Route::get('/products/{product}', [PublicProductController::class, 'show']);
Route::post('/products/stock', [PublicProductController::class, 'stock']);

// Auth (rate limited)
Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:5,1');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');


/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'is_admin', 'throttle:60,1'])
    ->prefix('admin')
    ->group(function () {

        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::apiResource('products', ProductController::class);

        Route::apiResource('orders', OrderController::class)
            ->only(['index', 'show', 'update', 'destroy']);

        Route::patch('orders/{order}/tracking', [OrderController::class, 'setTracking']);

        // فقط سوپر ادمین:
        Route::middleware('is_super_admin')->group(function () {
            Route::get('users', [UserController::class, 'index']);
            Route::patch('users/{user}/role', [UserController::class, 'setRole']);
        });
    });



/*
|--------------------------------------------------------------------------
| Authenticated User Routes
|--------------------------------------------------------------------------
*/


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::get('/wishlist/ids', [WishlistController::class, 'ids']);
    Route::post('/wishlist/{product}/toggle', [WishlistController::class, 'toggle']);
    Route::delete('/wishlist/{product}', [WishlistController::class, 'destroy']); // اختیاری
});


Route::middleware('auth:sanctum')->group(function () {

    // Checkout (حساس → throttle)
    Route::post('/checkout', [CheckoutController::class, 'store'])
        ->middleware('throttle:10,1');

    // Cancel order (حساس → throttle)
    Route::post('/orders/me/{order}/cancel', [CheckoutController::class, 'cancelMine'])
        ->middleware('throttle:10,1');

    // My Orders
    Route::get('/orders/me', [CheckoutController::class, 'myOrders']);
    Route::get('/orders/me/{order}', [CheckoutController::class, 'showMine']);

    // Profile
    Route::patch('/me', [ProfileController::class, 'update'])
        ->middleware('throttle:30,1');

    Route::post('/me/change-password', [ProfileController::class, 'changePassword'])
        ->middleware('throttle:10,1');

    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware('throttle:10,1');

    Route::get('/me', function (Request $request) {
        return $request->user();
    });
});
