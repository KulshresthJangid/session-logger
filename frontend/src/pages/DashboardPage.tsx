import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Clock, DollarSign, Zap } from 'lucide-react';
import { reportsApi } from '@/api/reports.api';
import { sessionsApi } from '@/api/sessions.api';
import { clientsApi } from '@/api/clients.api';
import { ClientCard } from '@/components/clients/ClientCard';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import type { Session } from '@/types';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${accent ? 'bg-accent/10 text-accent' : 'bg-surface-tertiary text-muted'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
    refetchInterval: 30_000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
  });

  const { data: activeSessions, isLoading: activeSessionsLoading } = useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: sessionsApi.getActive,
    refetchInterval: 10_000,
  });

  // Build a stable clientId→Session map from query data (no Zustand sync needed)
  const activeSessionMap = useMemo(() => {
    const map: Record<string, Session> = {};
    activeSessions?.forEach((s) => { map[s.clientId] = s; });
    return map;
  }, [activeSessions]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-muted text-sm mt-0.5">This month's overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={18} />}
          label="Total Clients"
          value={stats?.totalClients ?? '—'}
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Sessions"
          value={stats?.sessionsThisMonth ?? '—'}
          sub="this month"
        />
        <StatCard
          icon={<DollarSign size={18} />}
          label="Revenue"
          value={stats ? formatCurrency(stats.revenueThisMonth) : '—'}
          sub="this month"
          accent
        />
        <StatCard
          icon={<Zap size={18} />}
          label="Active Now"
          value={stats?.activeSessions ?? '—'}
          sub={stats?.activeSessions === 0 ? 'none running' : 'in progress'}
          accent={!!stats?.activeSessions}
        />
      </div>

      {/* Client grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Clients</h2>
          <span className="text-xs text-muted">{clients.length} total</span>
        </div>

        {clients.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-muted text-sm">No clients yet.</p>
            <a href="/clients" className="text-accent text-sm mt-2 inline-block hover:underline">
              Add your first client →
            </a>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} activeSession={activeSessionMap[client.id] ?? null} activeSessionLoading={activeSessionsLoading} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
