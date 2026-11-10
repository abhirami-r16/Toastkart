<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Return all registered platform users.
     * Used by the Admin Dashboard to populate the Users module.
     */
    public function index(Request $request)
    {
        $query = User::with('stores')
            ->orderBy('id', 'desc');

        // Optional role filter
        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }

        $users = $query->get()->map(function ($user) {
            return [
                'id'                      => $user->id,
                'name'                    => $user->name,
                'email'                   => $user->email,
                'role'                    => ucfirst($user->role ?? 'customer'),
                'phone'                   => $user->phone ?? null,
                'address'                 => $user->address ?? null,
                'last_login'              => $user->last_login_at
                    ? \Carbon\Carbon::parse($user->last_login_at)->diffForHumans()
                    : null,
                'registered'              => $user->created_at
                    ? $user->created_at->format('M d, Y')
                    : null,
                'status'                  => 'Active',
                'stores'                  => $user->stores->map(fn($s) => ['id' => $s->id, 'name' => $s->name]),
                'subscription_bypass'     => (bool) $user->hasSubscriptionBypass(),
                'subscription_bypass_at'  => $user->subscription_bypass_at
                    ? $user->subscription_bypass_at->format('M d, Y h:i A')
                    : null,
                'has_active_subscription' => (bool) $user->hasActiveSubscriptionOrBypass(),
            ];
        });

        return response()->json($users);
    }

    /**
     * Show a single user.
     */
    public function show($id)
    {
        $user = User::with('stores')->findOrFail($id);

        return response()->json([
            'id'                      => $user->id,
            'name'                    => $user->name,
            'email'                   => $user->email,
            'role'                    => ucfirst($user->role ?? 'customer'),
            'registered'              => $user->created_at?->format('M d, Y'),
            'status'                  => 'Active',
            'stores'                  => $user->stores->map(fn($s) => ['id' => $s->id, 'name' => $s->name]),
            'subscription_bypass'     => (bool) $user->hasSubscriptionBypass(),
            'subscription_bypass_at'  => $user->subscription_bypass_at?->format('M d, Y h:i A'),
            'has_active_subscription' => (bool) $user->hasActiveSubscriptionOrBypass(),
        ]);
    }

    /**
     * Enable or disable subscription bypass privilege for a specific user.
     * Admin only.
     */
    public function toggleSubscriptionBypass(Request $request, $id)
    {
        $admin = $request->user();

        // Strict authorization check: Only system admins can manage subscription bypass privileges
        $isAdmin = $admin && ($admin->role === 'admin' || in_array(strtolower(trim($admin->email ?? '')), ['admin@gmail.com', 'admin@toastkart.local']));

        if (!$isAdmin) {
            return response()->json([
                'message' => 'Unauthorized. Only administrators can manage subscription bypass privileges.',
            ], 403);
        }

        $validated = $request->validate([
            'bypass' => 'required|boolean',
        ]);

        $user = User::findOrFail($id);

        $user->subscription_bypass = (bool) $validated['bypass'];
        $user->subscription_bypass_at = $validated['bypass'] ? now() : null;
        $user->save();

        return response()->json([
            'message' => $validated['bypass']
                ? "Subscription bypass granted for {$user->name} ({$user->email})."
                : "Subscription bypass revoked for {$user->name} ({$user->email}).",
            'user' => [
                'id'                      => $user->id,
                'name'                    => $user->name,
                'email'                   => $user->email,
                'subscription_bypass'     => (bool) $user->hasSubscriptionBypass(),
                'subscription_bypass_at'  => $user->subscription_bypass_at?->format('M d, Y h:i A'),
                'has_active_subscription' => (bool) $user->hasActiveSubscriptionOrBypass(),
            ],
        ]);
    }
}
