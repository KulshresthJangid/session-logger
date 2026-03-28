// Shared TypeScript types — mirrors the Prisma schema

export type BillingType = 'HOURLY' | 'FIXED';
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  billingType: BillingType;
  hourlyRate: number | null;
  fixedRate: number | null;
  monthlyBudget: number | null;
  notes: string | null;
  tags: string[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientWithStats extends Client {
  currentMonth: {
    totalSessions: number;
    totalHours: number;
    totalCost: number;
    isOverBudget: boolean;
  };
  activeSession: Session | null;
}

export interface Session {
  id: string;
  clientId: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  durationSecs: number | null;
  cost: number | null;
  notes: string | null;
  status: SessionStatus;
  billingSnapshot: number;
  billingType: BillingType;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string };
}

export interface SessionListResponse {
  sessions: Session[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalClients: number;
  sessionsThisMonth: number;
  revenueThisMonth: number;
  activeSessions: number;
}

export interface MonthlyReportEntry {
  clientId: string;
  clientName: string;
  totalSessions: number;
  totalSecs: number;
  totalHours: number;
  totalDurationFormatted: string;
  totalCost: number;
  monthlyBudget: number | null;
  isOverBudget: boolean;
  sessions: Session[];
}

export interface MonthlyReport {
  month: string;
  report: MonthlyReportEntry[];
  grandTotal: {
    totalSessions: number;
    totalSecs: number;
    totalHours: number;
    totalCost: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}
