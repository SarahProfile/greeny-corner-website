<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AppleAuthController extends Controller
{
    public function authenticate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identity_token'    => 'required|string',
            'authorization_code' => 'nullable|string',
            'user'              => 'nullable|string',
            'email'             => 'nullable|email|max:255',
            'name'              => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            // Decode the identity token (JWT) to extract the Apple user subject (sub)
            $tokenParts = explode('.', $request->identity_token);
            if (count($tokenParts) !== 3) {
                return response()->json(['message' => 'Invalid identity token'], 401);
            }

            $payload = json_decode(base64_decode(strtr($tokenParts[1], '-_', '+/')), true);
            if (!$payload || empty($payload['sub'])) {
                return response()->json(['message' => 'Could not decode identity token'], 401);
            }

            $appleUid = $payload['sub'];
            $tokenEmail = $payload['email'] ?? null;

            // Apple only sends name/email on first sign-in; fall back to token claims
            $email = $request->email ?: $tokenEmail;
            $name  = $this->buildName($request->name) ?: ($email ? explode('@', $email)[0] : 'Apple User');

            // Find or create user
            $user = User::where('firebase_uid', 'apple:' . $appleUid)->first();

            if (!$user && $email) {
                $user = User::where('email', $email)->first();
            }

            if ($user) {
                $user->update([
                    'firebase_uid'       => 'apple:' . $appleUid,
                    'name'               => $user->name ?: $name,
                    'email'              => $user->email ?: $email,
                    'provider'           => 'apple',
                    'email_verified_at'  => $user->email_verified_at ?? now(),
                ]);
            } else {
                $user = User::create([
                    'firebase_uid'       => 'apple:' . $appleUid,
                    'name'               => $name,
                    'email'              => $email,
                    'provider'           => 'apple',
                    'email_verified_at'  => now(),
                    'password'           => null,
                ]);
            }

            $token = $user->createToken('greeny-corner-apple')->plainTextToken;

            return response()->json([
                'message'      => 'Authentication successful',
                'user'         => $user,
                'token'        => $token,
                'access_token' => $token,
                'token_type'   => 'Bearer',
                'auth_type'    => 'apple',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Authentication failed',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    private function buildName(?array $name): string
    {
        if (!$name) return '';
        $parts = array_filter([
            $name['givenName']  ?? $name['firstName'] ?? '',
            $name['familyName'] ?? $name['lastName']  ?? '',
        ]);
        return implode(' ', $parts);
    }
}
