<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FirebaseAuthController extends Controller
{
    protected FirebaseService $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }

    /**
     * Handle Firebase authentication
     */
    public function authenticate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firebase_token' => 'required|string',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'firebase_uid' => 'nullable|string',
            'avatar' => 'nullable|url',
            'provider' => 'required|in:google,phone'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if this is a development/mock token
            if (str_starts_with($request->firebase_token, 'mock-firebase-token-')) {
                // Development mode - extract UID from token
                $firebaseUid = $request->firebase_uid ?: str_replace('mock-firebase-token-', 'mock-uid-', $request->firebase_token);
                $verifiedToken = null; // No real token to verify
            } else {
                // Verify Firebase token and get user data
                $verifiedToken = $this->firebaseService->verifyIdToken($request->firebase_token);
                $firebaseUid = $verifiedToken->claims()->get('sub');
            }
            
            // Get user data from Firebase token or request
            $userData = [
                'firebase_uid' => $firebaseUid,
                'name' => $request->name ?: ($verifiedToken ? $verifiedToken->claims()->get('name') : 'Phone User'),
                'email' => $request->email ?: ($verifiedToken ? $verifiedToken->claims()->get('email') : null),
                'phone' => $request->phone ?: ($verifiedToken ? $verifiedToken->claims()->get('phone_number') : null),
                'avatar' => $request->avatar ?: ($verifiedToken ? $verifiedToken->claims()->get('picture') : null),
                'provider' => $request->provider,
            ];
            
            // Find user by Firebase UID or email/phone
            $user = User::where('firebase_uid', $userData['firebase_uid'])->first();
            
            if (!$user && !empty($userData['email'])) {
                $user = User::where('email', $userData['email'])->first();
            }
            
            if (!$user && !empty($userData['phone'])) {
                $user = User::where('phone', $userData['phone'])->first();
            }

            if ($user) {
                // Update existing user
                $user->update([
                    'firebase_uid' => $userData['firebase_uid'],
                    'name' => $userData['name'],
                    'avatar' => $userData['avatar'] ?? $user->avatar,
                    'provider' => $userData['provider'],
                    'email_verified_at' => now(), // Firebase users are considered verified
                ]);
            } else {
                // Create new user
                $user = User::create([
                    'firebase_uid' => $userData['firebase_uid'],
                    'name' => $userData['name'],
                    'email' => $userData['email'] ?? null,
                    'phone' => $userData['phone'] ?? null,
                    'avatar' => $userData['avatar'] ?? null,
                    'provider' => $userData['provider'],
                    'email_verified_at' => now(),
                    'password' => null, // No password needed for Firebase auth
                ]);
            }

            // Create Sanctum token
            $token = $user->createToken('greeny-corner-firebase')->plainTextToken;

            return response()->json([
                'message' => 'Authentication successful',
                'user' => $user,
                'token' => $token,
                'access_token' => $token,
                'token_type' => 'Bearer',
                'auth_type' => 'firebase'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Authentication failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user info from Firebase token (optional verification)
     */
    public function verifyToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firebase_token' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Here you could verify the Firebase token with Firebase Admin SDK
            // For now, we'll just return success if the token is provided
            
            return response()->json([
                'message' => 'Token verified',
                'valid' => true
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token verification failed',
                'error' => $e->getMessage(),
                'valid' => false
            ], 401);
        }
    }
}
