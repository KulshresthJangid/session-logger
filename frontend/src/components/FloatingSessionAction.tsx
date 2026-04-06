import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { sessionsApi } from '@/api/sessions.api';
import { SessionTimer } from './sessions/SessionTimer';

export function FloatingSessionAction() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: sessionsApi.getActive,
    refetchInterval: 10_000,
  });
  const [expanded, setExpanded] = useState(true);

  if (sessions.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="bg-surface-secondary border border-surface-border rounded-xl shadow-2xl shadow-black/40 min-w-64">
        {/* Header */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-white"
        >
          <div className="flex items-center gap-2">
            <Zap size={14} fill="currentColor" />
            {sessions.length} Active Session{sessions.length > 1 ? 's' : ''}
          </div>
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {/* Session list */}
        {expanded && (
          <div className="border-t border-surface-border divide-y divide-surface-border">
            {sessions.map((session) => (
              <div key={session.id} className="px-4 py-3">
                <p className="text-xs text-muted mb-2 font-medium">{session.client?.name}</p>
                <SessionTimer session={session} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
