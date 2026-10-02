<?php

namespace App\Http\Controllers;

use App\Services\GmailService;
use Illuminate\Http\Request;

class GmailOAuthController extends Controller
{
    public function connect(GmailService $gmail)
    {
        return redirect()->away(
            $gmail->getAuthorizationUrl()
        );
    }

    public function callback(
        Request $request,
        GmailService $gmail
    ) {
        if ($request->has('error')) {
            return response()->json([
                'success' => false,
                'message' => $request->get('error_description')
                    ?? $request->get('error'),
            ], 400);
        }

        $code = $request->get('code');

        if (!$code) {
            return response()->json([
                'success' => false,
                'message' => 'Authorization code was not received.',
            ], 400);
        }

        try {
            $token = $gmail->exchangeAuthorizationCode($code);

            if (empty($token['refresh_token'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Refresh token was not returned.',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Gmail authorization successful.',
                'refresh_token' => $token['refresh_token'],
            ]);

        } catch (\Throwable $e) {
            \Log::error('Gmail OAuth callback failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gmail authorization failed.',
            ], 500);
        }
    }
}