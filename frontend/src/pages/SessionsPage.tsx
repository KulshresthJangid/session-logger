import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter } from 'lucide-react';
import { sessionsApi } from '@/api/sessions.api';
import { clientsApi } from '@/api/clients.api';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatTime, formatDuration } from '@/lib/utils';

export default function SessionsPage() {
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', { clientId, startDate, endDate, status, page }],
    queryFn: () => sessionsApi.list({
      clientId: clientId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status || undefined,
      page,
      limit: 50,
    }),
  });

  const sessions = data?.sessions ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Session Log</h1>
        <p className="text-muted text-sm mt-0.5">
          {pagination?.total ?? 0} total sessions
        </p>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-muted mb-0.5">
          <Filter size={14} />
          <span className="text-xs uppercase tracking-wide font-medium">Filters</span>
        </div>
        <div className="flex-1 min-w-36">
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setPage(1); }}
            options={[
              { label: 'All clients', value: '' },
              ...clients.map((c) => ({ label: c.name, value: c.id })),
            ]}
          />
        </div>
        <div className="flex-1 min-w-36">
          <label className="label">From</label>
          <input
            type="date"
            className="input"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex-1 min-w-36">
          <label className="label">To</label>
          <input
            type="date"
            className="input"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex-1 min-w-36">
          <Select
            label="Status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[
              { label: 'All', value: '' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Abandoned', value: 'ABANDONED' },
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="text-muted text-sm">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-surface-border rounded-xl">
          <p className="text-muted text-sm">No sessions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs text-muted uppercase tracking-wide font-medium">Date</th>
                <th className="text-left px-4 py-3 text-xs text-muted uppercase tracking-wide font-medium">Client</th>
                <th className="text-left px-4 py-3 text-xs text-muted uppercase tracking-wide font-medium">Start</th>
                <th className="text-left px-4 py-3 text-xs text-muted uppercase tracking-wide font-medium">End</th>
                <th className="text-left px-4 py-3 text-xs text-muted uppercase tracking-wide font-medium">Duration</th>
                <th className="text-left px-4 py-3 text-xs text-muted uppercase tracking-wide font-medium">Cost</th>
                <th className="text-left px-4 py-3 text-xs text-muted uppercase tracking-wide font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-muted uppercase tracking-wide font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-muted">{formatDate(session.startTime)}</td>
                  <td className="px-4 py-3 font-medium">{session.client?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{formatTime(session.startTime)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {session.endTime ? formatTime(session.endTime) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {session.durationSecs != null
                      ? formatDuration(session.durationSecs)
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    {session.cost != null
                      ? formatCurrency(Number(session.cost))
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {session.status === 'ACTIVE' && <Badge variant="success">Active</Badge>}
                    {session.status === 'COMPLETED' && <Badge variant="accent">Done</Badge>}
                    {session.status === 'ABANDONED' && <Badge variant="warning">Abandoned</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted max-w-xs truncate">
                    {session.notes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="btn-ghost disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
