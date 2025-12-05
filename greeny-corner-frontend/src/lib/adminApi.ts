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

export interface AdminUser {
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

export interface GrowthData {
  date: string;
  count: number;
}

export interface PopularPlant {
  name: string;
  count: number;
}

export interface MessageCategory {
  category: string;
  count: number;
}

export const adminAPI = {
  getDashboardStats: async () => {
    const response = await api.get<DashboardStats>('/admin/dashboard/stats');
    return response.data;
  },

  getUserGrowth: async (days: number = 30) => {
    const response = await api.get<GrowthData[]>(`/admin/dashboard/user-growth?days=${days}`);
    return response.data;
  },

  getPlantAdditions: async (days: number = 30) => {
    const response = await api.get<GrowthData[]>(`/admin/dashboard/plant-additions?days=${days}`);
    return response.data;
  },

  getPopularPlants: async () => {
    const response = await api.get<PopularPlant[]>('/admin/dashboard/popular-plants');
    return response.data;
  },

  getMessageCategories: async () => {
    const response = await api.get<MessageCategory[]>('/admin/dashboard/message-categories');
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
