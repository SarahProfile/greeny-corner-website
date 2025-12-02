<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\HelpMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HelpMessageController extends Controller
{
    /**
     * Store a new help message
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category' => 'required|string|in:question,bug,feature,other',
            'message' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        try {
            $helpMessage = HelpMessage::create([
                'user_id' => $request->user()->id,
                'category' => $request->category,
                'message' => $request->message,
                'status' => 'pending',
            ]);

            return response()->json([
                'message' => 'Help message submitted successfully',
                'data' => $helpMessage
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to submit help message',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all help messages for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            $messages = HelpMessage::where('user_id', $request->user()->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'data' => $messages
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch help messages',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
