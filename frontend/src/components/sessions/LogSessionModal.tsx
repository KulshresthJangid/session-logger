import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { sessionsApi } from '@/api/sessions.api';
import { clientsApi } from '@/api/clients.api';
import { formatDuration } from '@/lib/utils';

interface LogSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function toLocalDatetimeValue(date: Date): string {
  // Returns "YYYY-MM-DDTHH:MM" in local time for datetime-local inputs
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getDefaultStart(): string {
  const d = new Date();
  d.setHours(d.getHours() - 1, 0, 0, 0);
  return toLocalDatetimeValue(d);
}

function getDefaultEnd(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return toLocalDatetimeValue(d);
}

export function LogSessionModal({ isOpen, onClose }: LogSessionModalProps) {
  const queryClient = useQueryClient();

  const [clientId, setClientId] = useState('');
  const [startTime, setStartTime] = useState(getDefaultStart);
  const [endTime, setEndTime] = useState(getDefaultEnd);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
    enabled: isOpen,
  });

  const durationSecs = useMemo(() => {
    if (!startTime || !endTime) return null;
    const diff = Math.floor(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000,
    );
    return diff > 0 ? diff : null;
  }, [startTime, endTime]);

  const mutation = useMutation({
    mutationFn: sessionsApi.logManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Failed to log session');
    },
  });

  const handleClose = () => {
    setClientId('');
    setStartTime(getDefaultStart());
    setEndTime(getDefaultEnd());
    setNotes('');
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    setError('');
    if (!clientId) { setError('Please select a client'); return; }
    if (!startTime) { setError('Start time is required'); return; }
    if (!endTime) { setError('End time is required'); return; }
    if (!durationSecs) { setError('End time must be after start time'); return; }

    mutation.mutate({
      clientId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      notes: notes.trim() || null,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Log past session">
      <div className="space-y-4">
        <Select
          label="Client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          options={[
            { label: 'Select a client…', value: '' },
            ...clients.map((c) => ({ label: c.name, value: c.id })),
          ]}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start time</label>
            <input
              type="datetime-local"
              className="input"
              value={startTime}
              max={endTime || undefined}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label">End time</label>
            <input
              type="datetime-local"
              className="input"
              value={endTime}
              min={startTime || undefined}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* Duration preview */}
        {durationSecs != null ? (
          <div className="bg-surface-tertiary rounded-lg p-3 text-center">
            <p className="text-xs text-muted mb-0.5">Duration</p>
            <p className="font-mono text-xl font-bold">{formatDuration(durationSecs)}</p>
          </div>
        ) : startTime && endTime ? (
          <p className="text-xs text-red-400 text-center">End time must be after start time</p>
        ) : null}

        <Textarea
          label="Notes (optional)"
          placeholder="What did you work on?"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSubmit}
            loading={mutation.isPending}
            disabled={!durationSecs}
          >
            Log session
          </Button>
          <Button variant="ghost" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
