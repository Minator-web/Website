<?php

// app/Http/Middleware/IsAdmin.php
// app/Http/Middleware/IsAdmin.php
namespace App\Http\Middleware;

use Closure;

class IsAdmin
{
    public function handle($request, Closure $next)
    {
        $u = $request->user();
        if (!$u || !in_array($u->role, ['admin','super_admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return $next($request);
    }
}

