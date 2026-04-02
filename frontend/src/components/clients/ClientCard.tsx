import { useNavigate } from 'react-router-dom';
import { Play, DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SessionTimer } from '@/components/sessions/SessionTimer';
import { useSessionActions } from '@/hooks/useSessionActions';
import { formatCurrency } from '@/lib/utils';
import type { Client, Session } from '@/types';

interface ClientCardProps {
  client: Client;
  activeSession: Session | null;
  activeSessionLoading?: boolean;
}

export function ClientCard({ client, activeSession, activeSessionLoading = false }: ClientCardProps) {
  const navigate = useNavigate();
  const { startMutation } = useSessionActions();

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    startMutation.mutate(client.id);
  };

  const rate =
    client.billingType === 'HOURLY'
      ? `${formatCurrency(client.hourlyRate ?? 0)}/hr`
      : `${formatCurrency(client.fixedRate ?? 0)}/session`;

  return (
    <Card
      className="flex flex-col gap-4 group"
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-white truncate group-hover:text-accent transition-colors">
            {client.name}
          </h3>
          <p className="text-xs text-muted mt-0.5">{rate}</p>
        </div>
        <Badge variant={client.billingType === 'HOURLY' ? 'accent' : 'muted'}>
          {client.billingType === 'HOURLY' ? (
            <><TrendingUp size={10} /> Hourly</>
          ) : (
            <><DollarSign size={10} /> Fixed</>
          )}
        </Badge>
      </div>

      {/* Active session or start button */}
      <div onClick={(e) => e.stopPropagation()}>
        {activeSessionLoading ? (
          // Show a neutral loading bar while we don't yet know if a session is active
          <div className="h-9 rounded-lg bg-surface-tertiary animate-pulse" />
        ) : activeSession ? (
          <SessionTimer session={activeSession} />
        ) : (
          <button
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="flex items-center gap-2 w-full justify-center py-2 rounded-lg bg-success/10 text-success border border-success/20 hover:bg-success hover:text-surface text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
          >
            <Play size={13} fill="currentColor" />
            Start Session
          </button>
        )}
      </div>

      {/* Tags */}
      {client.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {client.tags.map((tag) => (
            <span key={tag} className="text-xs text-muted bg-surface-tertiary px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
