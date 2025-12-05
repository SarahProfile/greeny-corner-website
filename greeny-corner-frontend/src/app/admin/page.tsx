'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { adminAPI, DashboardStats, GrowthData, PopularPlant, MessageCategory } from '@/lib/adminApi';
import Header from '@/components/Header';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import UsersTab from '@/components/admin/UsersTab';
import MessagesTab from '@/components/admin/MessagesTab';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<GrowthData[]>([]);
  const [plantAdditions, setPlantAdditions] = useState<GrowthData[]>([]);
  const [popularPlants, setPopularPlants] = useState<PopularPlant[]>([]);
  const [messageCategories, setMessageCategories] = useState<MessageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

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
      } catch (error: any) {
        console.error('Error fetching admin data:', error);
        if (error.response?.status === 403) {
          setError('You do not have permission to access the admin dashboard.');
          setTimeout(() => router.push('/'), 3000);
        } else {
          setError('Failed to load dashboard data. Please try again later.');
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">{error}</p>
          </div>
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
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="New Users" />
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
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="New Plants" />
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
                      data={messageCategories as any}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => entry.category}
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
