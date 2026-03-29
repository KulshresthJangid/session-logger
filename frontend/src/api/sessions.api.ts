import apiClient from './client';
import type { Session, SessionListResponse } from '@/types';

export const sessionsApi = {
  start: async (clientId: string): Promise<Session> => {
    const res = await apiClient.post<Session>('/sessions/start', { clientId });
    return res.data;
  },

  end: async (sessionId: string, notes?: string | null): Promise<Session> => {
    const res = await apiClient.post<Session>('/sessions/end', { sessionId, notes });
    return res.data;
  },

  getActive: async (): Promise<Session[]> => {
    const res = await apiClient.get<Session[]>('/sessions/active');
    return res.data;
  },

  list: async (params?: {
    clientId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<SessionListResponse> => {
    const res = await apiClient.get<SessionListResponse>('/sessions', { params });
    return res.data;
  },

  abandon: async (sessionId: string): Promise<Session> => {
    const res = await apiClient.patch<Session>(`/sessions/${sessionId}/abandon`);
    return res.data;
  },
};
