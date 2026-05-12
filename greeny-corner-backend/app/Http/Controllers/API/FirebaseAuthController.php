<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class FirebaseAuthController extends Controller
{
    /**
     * Verify a Firebase ID token using the REST API (no service account needed).
     * Returns ['uid', 'email', 'name', 'picture'] or throws on failure.
     */
    private function verifyFirebaseToken(string $idToken): array
    {
        $apiKey = config('services.firebase.api_key') ?: env('FIREBASE_API_KEY');

        if (!$apiKey) {
            throw new \Exception('FIREBASE_API_KEY is not configured');
        }

        $response = Http::post(
            "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={$apiKey}",
            ['idToken' => $idToken]
        );

        if (!$response->successful()) {
            $error = $response->json('error.message') ?? 'Token verification failed';
            throw new \Exception($error);
        }

        $users = $response->json('users');
        if (empty($users)) {
            throw new \Exception('No user found for the given token');
        }

        $firebaseUser = $users[0];

        return [
            'uid'     => $firebaseUser['localId'],
            'email'   => $firebaseUser['email'] ?? null,
            'name'    => $firebaseUser['displayName'] ?? null,
            'picture' => $firebaseUser['photoUrl'] ?? null,
            'phone'   => $firebaseUser['phoneNumber'] ?? null,
        ];
    }

    /**
     * Handle Firebase authentication
     */
    public function authenticate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firebase_token' => 'required|string',
            'name'           => 'nullable|string|max:255',
            'email'          => 'nullable|email|max:255',
            'phone'          => 'nullable|string|max:20',
            'firebase_uid'   => 'nullable|string',
            'avatar'         => 'nullable|url',
            'provider'       => 'required|in:google,phone'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            // Check if this is a development/mock token
            if (str_starts_with($request->firebase_token, 'mock-firebase-token-')) {
                $firebaseUid = $request->firebase_uid
                    ?: str_replace('mock-firebase-token-', 'mock-uid-', $request->firebase_token);
                $tokenData = null;
            } else {
                $tokenData = $this->verifyFirebaseToken($request->firebase_token);
                $firebaseUid = $tokenData['uid'];
            }

            $userData = [
                'firebase_uid' => $firebaseUid,
                'name'         => $request->name   ?: ($tokenData['name']    ?? 'User'),
                'email'        => $request->email  ?: ($tokenData['email']   ?? null),
                'phone'        => $request->phone  ?: ($tokenData['phone']   ?? null),
                'avatar'       => $request->avatar ?: ($tokenData['picture'] ?? null),
                'provider'     => $request->provider,
            ];

            // Find existing user by Firebase UID, email, or phone
            $user = User::where('firebase_uid', $userData['firebase_uid'])->first();

            if (!$user && !empty($userData['email'])) {
                $user = User::where('email', $userData['email'])->first();
            }

            if (!$user && !empty($userData['phone'])) {
                $user = User::where('phone', $userData['phone'])->first();
            }

            if ($user) {
                $user->update([
                    'firebase_uid'       => $userData['firebase_uid'],
                    'name'               => $userData['name'],
                    'avatar'             => $userData['avatar'] ?? $user->avatar,
                    'provider'           => $userData['provider'],
                    'email_verified_at'  => now(),
                ]);
            } else {
                $user = User::create([
                    'firebase_uid'       => $userData['firebase_uid'],
                    'name'               => $userData['name'],
                    'email'              => $userData['email'] ?? null,
                    'phone'              => $userData['phone'] ?? null,
                    'avatar'             => $userData['avatar'] ?? null,
                    'provider'           => $userData['provider'],
                    'email_verified_at'  => now(),
                    'password'           => null,
                ]);
            }

            $token = $user->createToken('greeny-corner-firebase')->plainTextToken;

            return response()->json([
                'message'      => 'Authentication successful',
                'user'         => $user,
                'token'        => $token,
                'access_token' => $token,
                'token_type'   => 'Bearer',
                'auth_type'    => 'firebase'
            ]);

        } catch (\Exception $e) {
            \Log::error('Firebase auth failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Authentication failed',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify a Firebase token (lightweight check).
     */
    public function verifyToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firebase_token' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $tokenData = $this->verifyFirebaseToken($request->firebase_token);
            return response()->json(['message' => 'Token verified', 'valid' => true, 'uid' => $tokenData['uid']]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Token verification failed', 'error' => $e->getMessage(), 'valid' => false], 401);
        }
    }
}
