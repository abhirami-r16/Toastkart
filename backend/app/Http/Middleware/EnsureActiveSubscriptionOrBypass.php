<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveSubscriptionOrBypass
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        if ($user->hasActiveSubscriptionOrBypass()) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Active subscription required to access this resource.',
            'subscription_required' => true,
        ], 403);
    }
}
