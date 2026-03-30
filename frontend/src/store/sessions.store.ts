import { create } from 'zustand';
import type { Session } from '@/types';

interface SessionsState {
  // Track which clients have active sessions (clientId → Session)
  activeSessions: Record<string, Session>;
  setActiveSession: (clientId: string, session: Session) => void;
  removeActiveSession: (clientId: string) => void;
  setAllActiveSessions: (sessions: Session[]) => void;
}

export const useSessionsStore = create<SessionsState>((set) => ({
  activeSessions: {},

  setActiveSession: (clientId, session) =>
    set((state) => ({
      activeSessions: { ...state.activeSessions, [clientId]: session },
    })),

  removeActiveSession: (clientId) =>
    set((state) => {
      const next = { ...state.activeSessions };
      delete next[clientId];
      return { activeSessions: next };
    }),

  setAllActiveSessions: (sessions) =>
    set(() => {
      const map: Record<string, Session> = {};
      sessions.forEach((s) => { map[s.clientId] = s; });
      return { activeSessions: map };
    }),
}));
