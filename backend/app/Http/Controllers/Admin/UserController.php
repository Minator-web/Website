<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $q = User::query()->select('id','name','email','role','created_at')->latest();

        if ($request->filled('search')) {
            $s = trim($request->search);
            $q->where(function ($qq) use ($s) {
                $qq->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
            });
        }

        return $q->paginate(20);
    }

    public function setRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(['user', 'admin'])],
        ]);

        if ($user->role === 'super_admin') {
            return response()->json(['message' => 'Cannot change super_admin role'], 422);
        }

        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'You cannot change your own role'], 422);
        }

        $user->role = $data['role'];
        $user->save();

        return response()->json([
            'message' => 'Role updated',
            'user' => $user->only(['id','name','email','role']),
        ]);
    }
}
