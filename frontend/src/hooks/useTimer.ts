import { useState, useEffect, useRef } from 'react';

/**
 * Live elapsed timer starting from a given ISO timestamp.
 * Returns formatted time string "HH:MM:SS".
 */
export function useTimer(startTime: string | null | undefined): string {
  const [elapsed, setElapsed] = useState(() => {
    // Compute correct elapsed immediately — avoids 00:00:00 flash on mount
    if (!startTime) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const start = new Date(startTime).getTime();

    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    tick(); // immediate first tick
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':');
}
