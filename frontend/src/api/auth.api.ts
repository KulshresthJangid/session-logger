import apiClient from './client';
import type { AuthResponse } from '@/types';

export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get<{ userId: string; email: string }>('/auth/me');
    return res.data;
  },
};
