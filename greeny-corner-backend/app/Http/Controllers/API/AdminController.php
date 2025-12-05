<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Plant;
use App\Models\HelpMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function getDashboardStats(Request $request)
    {
        // Check if user is admin
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $totalUsers = User::count();
            $totalPlants = Plant::count();

            $stats = [
                // Total counts
                'total_users' => $totalUsers,
                'total_plants' => $totalPlants,
                'total_messages' => 0,
                'pending_messages' => 0,

                // Today's stats
                'users_today' => User::whereDate('created_at', '>=', now()->startOfDay())->count(),
                'plants_today' => Plant::whereDate('added_at', '>=', now()->startOfDay())->count(),
                'messages_today' => 0,

                // This week
                'users_this_week' => User::where('created_at', '>=', now()->startOfWeek())->count(),
                'plants_this_week' => Plant::where('added_at', '>=', now()->startOfWeek())->count(),

                // This month
                'users_this_month' => User::whereYear('created_at', now()->year)
                                          ->whereMonth('created_at', now()->month)
                                          ->count(),
                'plants_this_month' => Plant::whereYear('added_at', now()->year)
                                            ->whereMonth('added_at', now()->month)
                                            ->count(),

                // Average plants per user
                'avg_plants_per_user' => $totalUsers > 0 ? round($totalPlants / $totalUsers, 2) : 0,
            ];

            // Try to get message counts if table exists
            try {
                if (DB::getSchemaBuilder()->hasTable('help_messages')) {
                    $stats['total_messages'] = HelpMessage::count();
                    $stats['messages_today'] = HelpMessage::whereDate('created_at', '>=', now()->startOfDay())->count();

                    if (DB::getSchemaBuilder()->hasColumn('help_messages', 'status')) {
                        $stats['pending_messages'] = HelpMessage::where('status', 'pending')->count();
                    }
                }
            } catch (\Exception $msgError) {
                \Log::warning('Could not fetch message stats: ' . $msgError->getMessage());
            }

            return response()->json($stats);
        } catch (\Exception $e) {
            \Log::error('Admin dashboard stats error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Error fetching dashboard stats',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Get user growth data for charts
     */
    public function getUserGrowth(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $days = $request->input('days', 30);

        $growth = User::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
        ->where('created_at', '>=', Carbon::now()->subDays($days))
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        return response()->json($growth);
    }

    /**
     * Get plant additions data for charts
     */
    public function getPlantAdditions(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $days = $request->input('days', 30);

        $additions = Plant::select(
            DB::raw('DATE(added_at) as date'),
            DB::raw('COUNT(*) as count')
        )
        ->where('added_at', '>=', Carbon::now()->subDays($days))
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        return response()->json($additions);
    }

    /**
     * Get all users with pagination
     */
    public function getUsers(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');

        $query = User::query()->withCount('plants');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Get all help messages with pagination
     */
    public function getHelpMessages(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $perPage = $request->input('per_page', 15);
        $status = $request->input('status');
        $category = $request->input('category');

        $query = HelpMessage::with('user');

        if ($status) {
            $query->where('status', $status);
        }

        if ($category) {
            $query->where('category', $category);
        }

        $messages = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($messages);
    }

    /**
     * Update help message status
     */
    public function updateMessageStatus(Request $request, $id)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,resolved,closed'
        ]);

        $message = HelpMessage::findOrFail($id);
        $message->update([
            'status' => $validated['status'],
            'updated_at' => now()
        ]);

        return response()->json([
            'message' => 'Status updated successfully',
            'help_message' => $message
        ]);
    }

    /**
     * Get popular plants (most frequently added)
     */
    public function getPopularPlants(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $popular = Plant::select('name', DB::raw('COUNT(*) as count'))
            ->whereNotNull('name')
            ->where('name', '!=', 'Unknown Plant')
            ->groupBy('name')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();

        return response()->json($popular);
    }

    /**
     * Get message categories distribution
     */
    public function getMessageCategories(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $categories = HelpMessage::select('category', DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->get();

        return response()->json($categories);
    }
}
