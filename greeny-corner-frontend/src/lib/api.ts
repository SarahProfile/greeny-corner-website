import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and language to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add language preference from localStorage or default to 'en'
  const language = localStorage.getItem('i18nextLng') || 'en';
  config.headers['Accept-Language'] = language;

  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Just return the error without automatic logout/redirect
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  is_admin?: boolean;
}

export interface Plant {
  id: number;
  name: string;
  scientific_name?: string;
  perenual_id?: number;
  image_url: string;
  api_data: {
    name: string;
    name_en?: string;
    name_ar?: string;
    arabic_name?: string;
    confidence: number;
    common_names: string[];
    description: string;
    scientific_name: string;
    family: string;
    origin: string;
    toxicity: string;
    growth_info: {
      size: string;
      growth_rate: string;
      mature_height: string;
      spread: string;
      growth_habit: string;
    };
    benefits: string[];
    interesting_facts: string[];
    care_info: {
      watering_interval_days: number;
      light: string;
      humidity: string;
      temperature: string;
      care_tips: string;
    };
    perenual_id?: number;
    raw_data?: {
      method: string;
      perenual_enhanced?: boolean;
      confidence?: number;
      scientific_name?: string;
    };
  };
  added_at: string;
  care_schedule?: CareSchedule;
  health_status?: string;
  health_notes?: string;
  last_health_check?: string;
}

export interface CareSchedule {
  id: number;
  plant_id: number;
  watering_interval_days: number;
  next_watering_date: string;
  fertilizing_interval_days?: number;
  next_fertilizing_date?: string;
  tilling_interval_days?: number;
  next_tilling_date?: string;
  last_watered_date?: string;
  last_fertilized_date?: string;
  last_tilled_date?: string;
  watering_notifications_enabled?: boolean;
  fertilizing_notifications_enabled?: boolean;
  tilling_notifications_enabled?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authAPI = {
  register: async (data: { name: string; email: string; password: string; password_confirmation: string }) => {
    const response = await api.post<AuthResponse>('/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },

  getUser: async () => {
    const response = await api.get<User>('/user');
    return response.data;
  },
};

export const plantsAPI = {
  getPlants: async () => {
    // Get current language from localStorage
    const language = (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null) || 'en';
    const response = await api.get<Plant[]>(`/plants?language=${language}`);
    return response.data;
  },

  getPlant: async (id: number) => {
    // Get current language from localStorage
    const language = (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null) || 'en';
    const response = await api.get<Plant>(`/plants/${id}?language=${language}`);
    return response.data;
  },

  addPlant: async (image: File, language?: string) => {
    const formData = new FormData();
    formData.append('image', image);

    // Add language preference from i18n or localStorage
    const currentLanguage = language ||
                           (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null) ||
                           'en';
    formData.append('language', currentLanguage);
    
    const response = await api.post<Plant>('/plants', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deletePlant: async (id: number) => {
    const response = await api.delete(`/plants/${id}`);
    return response.data;
  },

  waterPlant: async (id: number) => {
    const response = await api.put(`/plants/${id}/water`);
    return response.data;
  },

  fertilizePlant: async (id: number) => {
    const response = await api.put(`/plants/${id}/fertilize`);
    return response.data;
  },

  tillPlant: async (id: number) => {
    const response = await api.put(`/plants/${id}/till`);
    return response.data;
  },

  updateSchedule: async (id: number, scheduleData: {
    watering_interval_days?: number;
    fertilizing_interval_days?: number;
    tilling_interval_days?: number;
    watering_notifications_enabled?: boolean;
    fertilizing_notifications_enabled?: boolean;
    tilling_notifications_enabled?: boolean;
  }) => {
    const response = await api.put(`/plants/${id}/schedule`, scheduleData);
    return response.data;
  },

  updatePlantImage: async (id: number, image: File, language?: string) => {
    const formData = new FormData();
    formData.append('image', image);
    if (language) {
      formData.append('language', language);
    }
    
    const response = await api.post(`/plants/${id}/update-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  refreshPlantsLanguage: async (language: string) => {
    const response = await api.post('/plants/refresh-language', { language });
    return response.data;
  },

  getDiseasesAndNutrition: async (id: number) => {
    // Check both possible language keys in localStorage
    const language = (typeof window !== 'undefined'
      ? (localStorage.getItem('i18nextLng') || localStorage.getItem('language'))
      : null) || 'en';
    console.log('[API] Fetching diseases/nutrition with language:', language);
    const response = await api.get(`/plants/${id}/diseases-nutrition?language=${language}`);
    console.log('[API] Received diseases/nutrition data:', response.data);
    return response.data;
  },

  checkPlantHealth: async (id: number) => {
    const language = (typeof window !== 'undefined'
      ? (localStorage.getItem('i18nextLng') || localStorage.getItem('language'))
      : null) || 'en';
    const response = await api.post(`/plants/${id}/check-health`, { language });
    return response.data;
  },

  getDiseaseTreatment: async (disease: string, plantName: string) => {
    const language = (typeof window !== 'undefined'
      ? (localStorage.getItem('i18nextLng') || localStorage.getItem('language'))
      : null) || 'en';
    const response = await api.post('/plants/disease-treatment', { disease, plant_name: plantName, language });
    return response.data;
  },
};

// ─── Plant Encyclopedia (public, no auth) ─────────────────────────────────────

export interface EncyclopediaPlant {
  id: number;
  slug: string;
  name: string;
  scientific_name?: string;
  family?: string;
  genus?: string;
  origin?: string;
  description?: string;
  description_ar?: string;
  common_names?: string[];
  care_info?: {
    watering_interval_days?: number;
    watering?: string;
    light?: string;
    humidity?: string;
    temperature?: string;
    care_tips?: string;
    difficulty?: string;
    soil?: string;
    pruning?: string;
  };
  growth_info?: {
    growth_rate?: string;
    mature_height?: string;
    mature_size?: string;
    spread?: string;
    growth_habit?: string;
    indoor?: boolean;
    cycle?: string;
    type?: string;
  };
  benefits?: string[];
  interesting_facts?: string[];
  toxicity?: string;
  images?: string[];
  image?: string;
  wikipedia_url?: string;
  sources?: string[];
  is_featured?: boolean;
  view_count?: number;
  perenual_id?: number;
  gbif_id?: number;
}

export interface EncyclopediaListResponse {
  data: EncyclopediaPlant[];
  total: number;
  current_page: number;
  last_page: number;
}

const ENC_BASE = `${API_BASE_URL}/encyclopedia`;

export const encyclopediaAPI = {
  getPlants: async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    family?: string;
    featured?: boolean;
  }): Promise<EncyclopediaListResponse> => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();
    const res = await fetch(`${ENC_BASE}/plants${qs ? '?' + qs : ''}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch plants');
    return res.json();
  },

  getPlant: async (slug: string): Promise<EncyclopediaPlant> => {
    const res = await fetch(`${ENC_BASE}/plants/${slug}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Plant not found');
    return res.json();
  },

  search: async (q: string): Promise<EncyclopediaPlant[]> => {
    const res = await fetch(`${ENC_BASE}/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  },

  getFeatured: async (): Promise<EncyclopediaPlant[]> => {
    const res = await fetch(`${ENC_BASE}/featured`, { next: { revalidate: 3600 } } as RequestInit);
    if (!res.ok) return [];
    return res.json();
  },

  getFamilies: async (): Promise<string[]> => {
    const res = await fetch(`${ENC_BASE}/families`, { next: { revalidate: 86400 } } as RequestInit);
    if (!res.ok) return [];
    return res.json();
  },

  getSimilar: async (slug: string): Promise<EncyclopediaPlant[]> => {
    const res = await fetch(`${ENC_BASE}/plants/${slug}/similar`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  },
};

export const helpMessageAPI = {
  submitMessage: async (data: { category: string; message: string }) => {
    const response = await api.post('/help-messages', data);
    return response.data;
  },

  getMessages: async () => {
    const response = await api.get('/help-messages');
    return response.data;
  },
};

export default api;