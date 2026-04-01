import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTimer } from '@/hooks/useTimer';
import { useSessionActions } from '@/hooks/useSessionActions';
import type { Session } from '@/types';

interface EndSessionModalProps {
  isOpen: boolean;
  session: Session;
  onClose: () => void;
}

export function EndSessionModal({ isOpen, session, onClose }: EndSessionModalProps) {
  const [notes, setNotes] = useState('');
  const elapsed = useTimer(isOpen ? session.startTime : null);
  const { endMutation } = useSessionActions();

  const handleEnd = async () => {
    await endMutation.mutateAsync({ sessionId: session.id, notes: notes || null });
    setNotes('');
    onClose();
  };

  const handleSkip = async () => {
    await endMutation.mutateAsync({ sessionId: session.id, notes: null });
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`End session — ${session.client?.name ?? 'Client'}`}
    >
      <div className="space-y-4">
        {/* Timer summary */}
        <div className="bg-surface-tertiary rounded-lg p-4 text-center">
          <p className="text-xs text-muted mb-1">Duration</p>
          <p className="font-mono text-3xl font-bold text-success">{elapsed}</p>
        </div>

        <Textarea
          label="Session notes (optional)"
          placeholder="What did you work on?"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          autoFocus
        />

        <div className="flex gap-2">
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleEnd}
            loading={endMutation.isPending}
          >
            End with notes
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={endMutation.isPending}
          >
            Skip notes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
