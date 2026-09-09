<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string',
            'store_name' => 'nullable|string|max:255',
            'store_description' => 'nullable|string',
        ]);

        $role = $fields['role'] ?? 'owner';
        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
            'role' => $role,
        ]);

        if ($role === 'owner' && !empty($fields['store_name'])) {
            $storeName = $fields['store_name'];
            $slug = Str::slug($storeName);
            $originalSlug = $slug;
            $count = 1;
            while (\App\Models\Store::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $count++;
            }

            $user->stores()->create([
                'name' => $storeName,
                'owner_name' => $user->name,
                'slug' => $slug,
                'description' => $fields['store_description'] ?? '',
                'currency' => 'USD',
                'status' => 'Active',
            ]);
        }

        $user->load('stores');
        $token = $user->createToken('shopify_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Registration successful',
        ], 201);
    }

    public function login(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $fields['email'])->first();

        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password credentials.'
            ], 401);
        }

        $token = $user->createToken('shopify_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Login successful',
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->tokens()->delete();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $user->load('stores');
        return response()->json($user);
    }
}
