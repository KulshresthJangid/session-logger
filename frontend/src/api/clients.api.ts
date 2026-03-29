import apiClient from './client';
import type { Client, ClientWithStats } from '@/types';

export const clientsApi = {
  list: async (): Promise<Client[]> => {
    const res = await apiClient.get<Client[]>('/clients');
    return res.data;
  },

  get: async (id: string): Promise<ClientWithStats> => {
    const res = await apiClient.get<ClientWithStats>(`/clients/${id}`);
    return res.data;
  },

  create: async (data: {
    name: string;
    billingType: 'HOURLY' | 'FIXED';
    hourlyRate?: number | null;
    fixedRate?: number | null;
    monthlyBudget?: number | null;
    notes?: string | null;
    tags?: string[];
  }): Promise<Client> => {
    const res = await apiClient.post<Client>('/clients', data);
    return res.data;
  },

  update: async (id: string, data: Partial<{
    name: string;
    billingType: 'HOURLY' | 'FIXED';
    hourlyRate: number | null;
    fixedRate: number | null;
    monthlyBudget: number | null;
    notes: string | null;
    tags: string[];
  }>): Promise<Client> => {
    const res = await apiClient.put<Client>(`/clients/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },
};
