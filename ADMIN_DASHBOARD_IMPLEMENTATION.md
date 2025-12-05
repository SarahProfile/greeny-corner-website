# Admin Dashboard Implementation Guide

## ✅ Already Completed

1. **Backend API Endpoints** - `/greeny-corner-backend/app/Http/Controllers/API/AdminController.php`
2. **API Routes** - Added admin routes to `/greeny-corner-backend/routes/api.php`
3. **Google Analytics Integration** - `/greeny-corner-frontend/src/lib/analytics.ts`
4. **NPM Packages Installed** - react-ga4, recharts, @tanstack/react-table

## 🔧 Step 1: Run Database Migration

```bash
cd /Users/sarah/greeny-corner-website/greeny-corner-backend

# Edit the migration file
# File: database/migrations/2025_12_02_154624_add_is_admin_to_users_table.php
```

Add this content to the migration:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
```

Then run:
```bash
php artisan migrate
```

## 🔧 Step 2: Make Your User an Admin

```bash
php artisan tinker
```

Then in tinker:
```php
$user = User::where('email', 'your-email@example.com')->first();
$user->is_admin = true;
$user->save();
exit
```

## 🔧 Step 3: Update User Model

Edit `/greeny-corner-backend/app/Models/User.php`:

Add `'is_admin'` to the `$fillable` array:
```php
protected $fillable = [
    'name',
    'email',
    'password',
    'firebase_uid',
    'phone',
    'provider',
    'provider_id',
    'avatar',
    'password_reset_token',
    'password_reset_expires',
    'is_admin', // Add this
];
```

Add to casts():
```php
protected function casts(): array
{
    return [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'password_reset_expires' => 'datetime',
        'is_admin' => 'boolean', // Add this
    ];
}
```

## 🔧 Step 4: Add Status to HelpMessage Model

Check if `HelpMessage` model has a `status` field. If not, create a migration:

```bash
php artisan make:migration add_status_to_help_messages_table
```

Migration content:
```php
public function up(): void
{
    Schema::table('help_messages', function (Blueprint $table) {
        $table->enum('status', ['pending', 'in_progress', 'resolved', 'closed'])
              ->default('pending')
              ->after('message');
    });
}
```

## 🔧 Step 5: Frontend API File

Create `/greeny-corner-frontend/src/lib/adminApi.ts`:

```typescript
import api from './api';

export interface DashboardStats {
  total_users: number;
  total_plants: number;
  total_messages: number;
  pending_messages: number;
  users_today: number;
  plants_today: number;
  messages_today: number;
  users_this_week: number;
  plants_this_week: number;
  users_this_month: number;
  plants_this_month: number;
  avg_plants_per_user: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  plants_count: number;
}

export interface HelpMessage {
  id: number;
  user_id: number;
  category: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export const adminAPI = {
  getDashboardStats: async () => {
    const response = await api.get<DashboardStats>('/admin/dashboard/stats');
    return response.data;
  },

  getUserGrowth: async (days: number = 30) => {
    const response = await api.get(`/admin/dashboard/user-growth?days=${days}`);
    return response.data;
  },

  getPlantAdditions: async (days: number = 30) => {
    const response = await api.get(`/admin/dashboard/plant-additions?days=${days}`);
    return response.data;
  },

  getPopularPlants: async () => {
    const response = await api.get('/admin/dashboard/popular-plants');
    return response.data;
  },

  getMessageCategories: async () => {
    const response = await api.get('/admin/dashboard/message-categories');
    return response.data;
  },

  getUsers: async (page: number = 1, perPage: number = 15, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(search && { search }),
    });
    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },

  getMessages: async (page: number = 1, perPage: number = 15, status?: string, category?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(status && { status }),
      ...(category && { category }),
    });
    const response = await api.get(`/admin/messages?${params}`);
    return response.data;
  },

  updateMessageStatus: async (id: number, status: string) => {
    const response = await api.put(`/admin/messages/${id}/status`, { status });
    return response.data;
  },
};
```

## 🔧 Step 6: Create Admin Dashboard Page

Create `/greeny-corner-frontend/src/app/admin/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { adminAPI, DashboardStats } from '@/lib/adminApi';
import Header from '@/components/Header';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [plantAdditions, setPlantAdditions] = useState([]);
  const [popularPlants, setPopularPlants] = useState([]);
  const [messageCategories, setMessageCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is admin (you'll need to add this field to your user object)
    const fetchData = async () => {
      try {
        const [statsData, growthData, additionsData, plantsData, categoriesData] = await Promise.all([
          adminAPI.getDashboardStats(),
          adminAPI.getUserGrowth(30),
          adminAPI.getPlantAdditions(30),
          adminAPI.getPopularPlants(),
          adminAPI.getMessageCategories(),
        ]);

        setStats(statsData);
        setUserGrowth(growthData);
        setPlantAdditions(additionsData);
        setPopularPlants(plantsData);
        setMessageCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        if ((error as any).response?.status === 403) {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, monitor analytics, and track system health</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            change={`+${stats.users_today} today`}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Total Plants"
            value={stats.total_plants}
            change={`+${stats.plants_today} today`}
            icon="🌱"
            color="green"
          />
          <StatCard
            title="Help Messages"
            value={stats.total_messages}
            change={`${stats.pending_messages} pending`}
            icon="💬"
            color="purple"
          />
          <StatCard
            title="Avg Plants/User"
            value={stats.avg_plants_per_user}
            change={`${stats.plants_this_week} this week`}
            icon="📊"
            color="orange"
          />
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'users', 'messages'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm capitalize
                    ${activeTab === tab
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="User Growth (Last 30 Days)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Plant Additions (Last 30 Days)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={plantAdditions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Most Popular Plants">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={popularPlants}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Message Categories">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={messageCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.category}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {messageCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'messages' && <MessagesTab />}
      </div>
    </div>
  );
}

// Component definitions continue in next message due to length...
```

## 🔧 Step 7: Add Google Analytics to _app or layout

Add this to your root layout or _app.tsx to initialize Google Analytics:

```typescript
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initGA, logPageView } from '@/lib/analytics';

// In your root component
useEffect(() => {
  initGA();
}, []);

useEffect(() => {
  logPageView(pathname);
}, [pathname]);
```

## 🔧 Step 8: Add Environment Variable

Add to `.env.local`:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace with your actual Google Analytics 4 measurement ID.

## 📋 TODO for Complete Implementation

1. Complete the admin dashboard components (StatCard, ChartCard, UsersTab, MessagesTab)
2. Add admin dashboard link to the Header navigation (only show if user.is_admin)
3. Style improvements and responsive design
4. Add export functionality for data
5. Add date range filters
6. Implement real-time updates with WebSockets or polling
7. Add notification system for new messages
8. Create admin settings page

## 🚀 Quick Start

1. Run migrations
2. Make your user an admin
3. Clear Laravel cache: `php artisan config:clear && php artisan cache:clear`
4. Navigate to `/admin` on your frontend
5. Verify all API endpoints are working

## 📊 Google Analytics Integration Points

- Track page views automatically
- Track user actions (plant additions, watering, etc.)
- Track help message submissions
- Track plant identification success/failure
- Monitor user engagement metrics

## 🔒 Security Notes

- All admin routes check `is_admin` flag
- Use middleware for additional security
- Consider rate limiting on admin endpoints
- Add CSRF protection
- Implement audit logging for admin actions

---

**Need help?** Check Laravel logs at `storage/logs/laravel.log` for any API errors.
