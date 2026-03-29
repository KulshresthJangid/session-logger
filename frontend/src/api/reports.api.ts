import apiClient from './client';
import type { DashboardStats, MonthlyReport } from '@/types';

export const reportsApi = {
  dashboard: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>('/reports/dashboard');
    return res.data;
  },

  monthly: async (params?: { month?: string; clientId?: string }): Promise<MonthlyReport> => {
    const res = await apiClient.get<MonthlyReport>('/reports/monthly', { params });
    return res.data;
  },

  exportCsv: async (params?: { month?: string; clientId?: string }): Promise<void> => {
    const res = await apiClient.get('/reports/export', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `sessions-${params?.month ?? 'report'}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
