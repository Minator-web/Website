<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsSuperAdmin
{
    public function handle($request, Closure $next)
    {
        $u = $request->user();
        if (!$u || $u->role !== 'super_admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return $next($request);
    }
}
