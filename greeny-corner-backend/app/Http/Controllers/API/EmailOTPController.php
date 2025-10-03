<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class EmailOTPController extends Controller
{
    /**
     * Send email OTP
     */
    public function sendOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
            'mode' => 'required|in:login,register',
            'name' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = $request->email;
        $mode = $request->mode;
        $name = $request->name ?? 'User';

        // Check if user exists based on mode
        $user = User::where('email', $email)->first();
        
        if ($mode === 'login' && !$user) {
            return response()->json([
                'message' => 'No account found with this email address'
            ], 404);
        }
        
        if ($mode === 'register' && $user) {
            return response()->json([
                'message' => 'An account with this email already exists'
            ], 409);
        }

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store OTP in cache for 10 minutes
        $cacheKey = 'email_otp_' . md5($email);
        Cache::put($cacheKey, [
            'otp' => $otp,
            'email' => $email,
            'mode' => $mode,
            'name' => $name,
            'created_at' => now()
        ], 600); // 10 minutes

        try {
            // Send email
            Mail::send('emails.otp', [
                'otp' => $otp,
                'name' => $name,
                'mode' => $mode
            ], function ($message) use ($email, $mode) {
                $message->to($email)
                       ->subject($mode === 'login' ? 'Your Greeny Corner Login Code' : 'Your Greeny Corner Verification Code');
            });

            return response()->json([
                'message' => 'Verification code sent successfully',
                'email' => $email
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send verification code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify email OTP
     */
    public function verifyOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'mode' => 'required|in:login,register',
            'name' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = $request->email;
        $code = $request->code;
        $mode = $request->mode;
        $name = $request->name ?? 'User';

        // Get OTP from cache
        $cacheKey = 'email_otp_' . md5($email);
        $otpData = Cache::get($cacheKey);

        if (!$otpData) {
            return response()->json([
                'message' => 'Verification code expired or invalid'
            ], 400);
        }

        if ($otpData['otp'] !== $code) {
            return response()->json([
                'message' => 'Invalid verification code'
            ], 400);
        }

        // Remove OTP from cache
        Cache::forget($cacheKey);

        try {
            // Handle login vs register
            if ($mode === 'login') {
                $user = User::where('email', $email)->first();
                
                if (!$user) {
                    return response()->json([
                        'message' => 'User not found'
                    ], 404);
                }
            } else {
                // Register new user
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'email_verified_at' => now(),
                    'provider' => 'email_otp',
                    'password' => null // No password needed for OTP auth
                ]);
            }

            // Create Sanctum token
            $token = $user->createToken('greeny-corner-email-otp')->plainTextToken;

            return response()->json([
                'message' => 'Authentication successful',
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
                'auth_type' => 'email_otp'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Authentication failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}