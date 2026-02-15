<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();

        $totalOrders = Order::count();
        $totalUsers = User::count();
        $totalProducts = Product::count();

        $todayOrders = Order::whereDate('created_at', $today)->count();

        $todayRevenue = (int) Order::whereDate('created_at', $today)->sum('total_price');
        $totalRevenue = (int) Order::sum('total_price');

        $latestOrders = Order::with('user')
            ->latest()
            ->take(5)
            ->get();

        $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->orderBy('count', 'desc')
            ->get();

        return response()->json([
            'stats' => [
                'total_orders' => $totalOrders,
                'today_orders' => $todayOrders,
                'total_users' => $totalUsers,
                'total_products' => $totalProducts,
                'total_revenue' => $totalRevenue,
                'today_revenue' => $todayRevenue,
            ],
            'latest_orders' => $latestOrders,
            'orders_by_status' => $ordersByStatus,
        ]);
    }
}
