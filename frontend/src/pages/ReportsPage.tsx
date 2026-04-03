import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { reportsApi } from '@/api/reports.api';
import { clientsApi } from '@/api/clients.api';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, currentMonthString } from '@/lib/utils';

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonthString());
  const [clientId, setClientId] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['reports', 'monthly', month, clientId],
    queryFn: () => reportsApi.monthly({ month, clientId: clientId || undefined }),
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportsApi.exportCsv({ month, clientId: clientId || undefined });
    } finally {
      setExporting(false);
    }
  };

  // Build month options: current + last 11 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { label, value: val };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-muted text-sm mt-0.5">Monthly billing summaries</p>
        </div>
        <Button
          variant="ghost"
          icon={<Download size={15} />}
          onClick={handleExport}
          loading={exporting}
        >
          Export CSV
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-44">
          <Select
            label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={monthOptions}
          />
        </div>
        <div className="flex-1 min-w-44">
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={[
              { label: 'All clients', value: '' },
              ...clients.map((c) => ({ label: c.name, value: c.id })),
            ]}
          />
        </div>
      </Card>

      {/* Grand total banner */}
      {report && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <div className="flex justify-center mb-2 text-muted"><Clock size={18} /></div>
            <p className="text-2xl font-bold">{report.grandTotal.totalSessions}</p>
            <p className="text-xs text-muted mt-1">Total Sessions</p>
          </Card>
          <Card className="text-center">
            <div className="flex justify-center mb-2 text-muted"><TrendingUp size={18} /></div>
            <p className="text-2xl font-bold">{report.grandTotal.totalHours}h</p>
            <p className="text-xs text-muted mt-1">Total Hours</p>
          </Card>
          <Card className="text-center">
            <div className="flex justify-center mb-2 text-success"><DollarSign size={18} /></div>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(report.grandTotal.totalCost)}
            </p>
            <p className="text-xs text-muted mt-1">Total Billed</p>
          </Card>
        </div>
      )}

      {/* Per-client breakdown */}
      {isLoading ? (
        <div className="text-muted text-sm">Loading...</div>
      ) : !report || report.report.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-surface-border rounded-xl">
          <p className="text-muted text-sm">No data for this period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {report.report.map((entry) => (
            <Card key={entry.clientId}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">{entry.clientName}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {entry.totalSessions} session{entry.totalSessions !== 1 ? 's' : ''} ·{' '}
                    {entry.totalDurationFormatted}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success text-lg">
                    {formatCurrency(entry.totalCost)}
                  </p>
                  {entry.monthlyBudget != null && (
                    <div className="flex items-center gap-1.5 mt-1 justify-end">
                      <Badge variant={entry.isOverBudget ? 'danger' : 'success'}>
                        {entry.isOverBudget ? 'Over budget' : 'Within budget'}
                      </Badge>
                      <span className="text-xs text-muted">
                        / {formatCurrency(entry.monthlyBudget)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Budget progress bar */}
              {entry.monthlyBudget != null && (
                <div className="mb-4">
                  <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        entry.isOverBudget ? 'bg-danger' : 'bg-success'
                      }`}
                      style={{
                        width: `${Math.min(100, (entry.totalCost / entry.monthlyBudget) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {Math.round((entry.totalCost / entry.monthlyBudget) * 100)}% of budget
                  </p>
                </div>
              )}

              {/* Session mini-table */}
              {entry.sessions.length > 0 && (
                <details className="group">
                  <summary className="text-xs text-muted cursor-pointer hover:text-white transition-colors select-none">
                    View {entry.sessions.length} session{entry.sessions.length !== 1 ? 's' : ''} ↓
                  </summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-surface-border">
                          <th className="text-left py-2 pr-4 text-muted font-medium">Date</th>
                          <th className="text-left py-2 pr-4 text-muted font-medium">Duration</th>
                          <th className="text-left py-2 pr-4 text-muted font-medium">Cost</th>
                          <th className="text-left py-2 text-muted font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border/50">
                        {entry.sessions.map((s) => (
                          <tr key={s.id}>
                            <td className="py-2 pr-4 text-muted">
                              {new Date(s.startTime).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="py-2 pr-4">
                              {s.durationSecs != null
                                ? `${Math.floor(s.durationSecs / 60)}m`
                                : '—'}
                            </td>
                            <td className="py-2 pr-4 text-success">
                              {s.cost != null ? formatCurrency(Number(s.cost)) : '—'}
                            </td>
                            <td className="py-2 text-muted truncate max-w-xs">
                              {s.notes ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
