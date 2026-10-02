<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\RegistrationSuccessful;
use App\Mail\GoogleSignInNotification;
use Google_Client;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string',
            'email' => ['required', 'string', 'email', 'regex:/^[a-zA-Z0-9._%+-]+@gmail\.com$/', 'unique:users,email'],
            'phone' => 'nullable|string|max:15',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string',
            'store_name' => 'nullable|string|max:255',
            'store_description' => 'nullable|string',
        ], [
            'email.regex' => 'Please enter a valid Gmail address ending with @gmail.com'
        ]);

        $role = $fields['role'] ?? 'owner';
        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'phone' => $fields['phone'] ?? null,
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

        try {
            Mail::to($user->email)->send(new RegistrationSuccessful($user->name));
        } catch (\Exception $e) {
            Log::error('Failed to send registration email: ' . $e->getMessage());
        }

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Registration successful',
        ], 201);
    }
    public function updatePassword(Request $request)
    {
        $fields = $request->validate([
            'email' => ['required', 'string', 'email', 'regex:/^[a-zA-Z0-9._%+-]+@gmail\.com$/'],
            'new_password' => 'required|string|min:6'
        ], [
            'email.regex' => 'Please enter a valid Gmail address ending with @gmail.com'
        ]);

        $user = User::where('email', $fields['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'No account found with this email.'
            ], 404);
        }

        $user->password = Hash::make($fields['new_password']);
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }

    public function login(Request $request)
    {
        $fields = $request->validate([
            'email' => ['required', 'string', 'email', 'regex:/^[a-zA-Z0-9._%+-]+@gmail\.com$/'],
            'password' => 'required|string'
        ], [
            'email.regex' => 'Please enter a valid Gmail address ending with @gmail.com'
        ]);

        $user = User::where('email', $fields['email'])->first();

        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password credentials.'
            ], 401);
        }

        $token = $user->createToken('shopify_token')->plainTextToken;
        $user->load(['stores', 'activeSubscription']);

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Login successful',
        ]);
    }

    public function googleLogin(Request $request)
    {
        $fields = $request->validate([
            'id_token' => 'required|string',
            'role' => 'nullable|string'
        ]);

        $client = new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
        $payload = $client->verifyIdToken($fields['id_token']);

        if (!$payload) {
            return response()->json(['message' => 'Invalid Google token'], 401);
        }

        $email = $payload['email'];
        $name = $payload['name'];
        $googleId = $payload['sub'];
        $role = $fields['role'] ?? 'owner';

        // Check if user exists by email
        $user = User::where('email', $email)->first();


        if ($user) {
            // Update auth provider if they previously registered via email
            if (!$user->google_id) {
                $user->google_id = $googleId;
                $user->auth_provider = 'google';
                $user->save();
            }
        } else {
            // Register new user
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(24)), // Random password for google users
                'role' => $role,
                'google_id' => $googleId,
                'auth_provider' => 'google'
            ]);
        }

        try {
            Mail::to($payload['email'])
                ->send(new GoogleSignInNotification($user));
        } catch (\Throwable $e) {
            Log::error('Toastkart Google sign-in email failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        $user->load(['stores', 'activeSubscription']);
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
        $user->load(['stores', 'activeSubscription']);
        return response()->json($user);
    }
}
