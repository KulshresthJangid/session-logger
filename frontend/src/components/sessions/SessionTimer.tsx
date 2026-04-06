import { useState } from 'react';
import { Square } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { useSessionActions } from '@/hooks/useSessionActions';
import { EndSessionModal } from './EndSessionModal';
import type { Session } from '@/types';

interface SessionTimerProps {
  session: Session;
}

export function SessionTimer({ session }: SessionTimerProps) {
  const elapsed = useTimer(session.startTime);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        <span className="timer-display">{elapsed}</span>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white text-xs font-medium transition-all active:scale-95"
        >
          <Square size={11} fill="currentColor" />
          End
        </button>
      </div>

      <EndSessionModal
        isOpen={showModal}
        session={session}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
