<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\PasswordResetMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
        ];

        if ($request->has('email')) {
            $rules['email'] = 'required|string|email|max:255|unique:users';
        }

        if ($request->has('phone')) {
            $rules['phone'] = 'required|string|max:20|unique:users';
        }

        if (!$request->has('email') && !$request->has('phone')) {
            return response()->json([
                'message' => 'Either email or phone is required'
            ], 422);
        }

        $request->validate($rules);

        $userData = [
            'name' => $request->name,
            'password' => Hash::make($request->password),
        ];

        if ($request->has('email')) {
            $userData['email'] = $request->email;
        }

        if ($request->has('phone')) {
            $userData['phone'] = $request->phone;
        }

        $user = User::create($userData);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required',
        ]);

        $loginField = $request->email;
        $user = null;

        // Check if input is email or phone
        if (filter_var($loginField, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', $loginField)->first();
        } else {
            $user = User::where('phone', $loginField)->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
        ]);

        $emailOrPhone = $request->email;
        $user = null;

        // Check if input is email or phone
        if (filter_var($emailOrPhone, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', $emailOrPhone)->first();
        } else {
            $user = User::where('phone', $emailOrPhone)->first();
        }

        if (!$user) {
            return response()->json([
                'message' => 'We could not find a user with that email address or phone number.'
            ], 404);
        }

        // Generate reset token
        $token = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store token in database
        $user->update([
            'password_reset_token' => Hash::make($token),
            'password_reset_expires' => now()->addMinutes(15)
        ]);

        // Create reset URL for the email
        $resetUrl = config('app.frontend_url', 'http://localhost:3000') . '/reset-password?email=' . urlencode($emailOrPhone) . '&token=' . $token;

        // Send email if user has email address
        if ($user->email) {
            try {
                Mail::to($user->email)->send(new PasswordResetMail($user, $token, $resetUrl));
                
                return response()->json([
                    'message' => 'Password reset instructions have been sent to your email address.'
                ]);
            } catch (\Exception $e) {
                // Log error but don't expose details to user
                \Log::error('Failed to send password reset email: ' . $e->getMessage());
                
                return response()->json([
                    'message' => 'Failed to send email. Please try again later.',
                    'reset_token' => $token // Fallback for development
                ], 500);
            }
        } else {
            // For phone users, return token (in production you'd send SMS)
            return response()->json([
                'message' => 'Password reset instructions have been sent.',
                'reset_token' => $token // In production, send via SMS instead
            ]);
        }
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $emailOrPhone = $request->email;
        $user = null;

        // Check if input is email or phone
        if (filter_var($emailOrPhone, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', $emailOrPhone)->first();
        } else {
            $user = User::where('phone', $emailOrPhone)->first();
        }

        if (!$user || !$user->password_reset_token || !$user->password_reset_expires) {
            return response()->json([
                'message' => 'Invalid or expired reset token.'
            ], 400);
        }

        if (now()->isAfter($user->password_reset_expires)) {
            return response()->json([
                'message' => 'Reset token has expired.'
            ], 400);
        }

        if (!Hash::check($request->token, $user->password_reset_token)) {
            return response()->json([
                'message' => 'Invalid reset token.'
            ], 400);
        }

        // Reset password
        $user->update([
            'password' => Hash::make($request->password),
            'password_reset_token' => null,
            'password_reset_expires' => null,
        ]);

        return response()->json([
            'message' => 'Your password has been reset successfully.'
        ]);
    }
}
