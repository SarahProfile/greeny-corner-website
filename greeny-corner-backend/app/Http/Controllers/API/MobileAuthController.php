<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MobileAuthController extends Controller
{
    protected FirebaseService $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }

    public function requestPhoneReset(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        $phone = $request->phone;
        $user = User::where('phone', $phone)->first();

        if (!$user) {
            return response()->json([
                'message' => 'No user found with this phone number.'
            ], 404);
        }

        // Generate a 6-digit reset code
        $resetCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store reset code in database (expires in 10 minutes)
        $user->update([
            'password_reset_token' => Hash::make($resetCode),
            'password_reset_expires' => now()->addMinutes(10)
        ]);

        // In a real app, you would send this code via SMS
        // For development, we'll return it in the response
        return response()->json([
            'message' => 'Reset code generated successfully.',
            'reset_code' => $resetCode, // Remove this in production
            'expires_in' => 600 // 10 minutes in seconds
        ]);
    }

    public function verifyPhoneResetCode(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $phone = $request->phone;
        $code = $request->code;
        
        $user = User::where('phone', $phone)->first();

        if (!$user || !$user->password_reset_token || !$user->password_reset_expires) {
            return response()->json([
                'message' => 'Invalid or expired reset code.'
            ], 400);
        }

        if (now()->isAfter($user->password_reset_expires)) {
            return response()->json([
                'message' => 'Reset code has expired.'
            ], 400);
        }

        if (!Hash::check($code, $user->password_reset_token)) {
            return response()->json([
                'message' => 'Invalid reset code.'
            ], 400);
        }

        // Generate a temporary access token for password reset
        $resetToken = $user->createToken('password_reset', ['password-reset'])->plainTextToken;

        return response()->json([
            'message' => 'Reset code verified successfully.',
            'reset_token' => $resetToken,
            'expires_in' => 900 // 15 minutes to complete password reset
        ]);
    }

    public function resetPasswordWithToken(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        // Check if user has password-reset ability via token
        if (!$request->user()->tokenCan('password-reset')) {
            return response()->json([
                'message' => 'Invalid reset token or permissions.'
            ], 403);
        }

        $user = $request->user();
        
        // Verify phone matches the token user
        if ($user->phone !== $request->phone) {
            return response()->json([
                'message' => 'Phone number mismatch.'
            ], 400);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password),
            'password_reset_token' => null,
            'password_reset_expires' => null,
        ]);

        // Also update Firebase password if user has Firebase UID
        if ($user->firebase_uid) {
            try {
                $this->firebaseService->updateUser($user->firebase_uid, [
                    'password' => $request->new_password
                ]);
            } catch (\Exception $e) {
                \Log::warning('Failed to update Firebase password: ' . $e->getMessage());
                // Continue - Laravel password was updated successfully
            }
        }

        // Revoke the reset token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Password reset successfully. Please log in with your new password.'
        ]);
    }

    public function linkEmailToPhone(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'firebase_token' => 'required|string', // Firebase ID token from phone auth
        ]);

        // Verify Firebase token and get user info
        try {
            $verifiedIdToken = $this->firebaseService->verifyIdToken($request->firebase_token);
            $firebaseUid = $verifiedIdToken->claims()->get('sub');
            
            // Find user by phone
            $user = User::where('phone', $request->phone)->first();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not found with this phone number.'
                ], 404);
            }

            // Add email to user account
            $user->update([
                'email' => $request->email,
                'firebase_uid' => $firebaseUid
            ]);

            // Update Firebase user with email
            $this->firebaseService->updateUser($firebaseUid, [
                'email' => $request->email,
                'emailVerified' => false
            ]);

            return response()->json([
                'message' => 'Email linked successfully. You can now use email for password reset.',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to verify Firebase token.',
                'error' => $e->getMessage()
            ], 400);
        }
    }
}