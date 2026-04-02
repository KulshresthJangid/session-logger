import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '@/api/sessions.api';

/**
 * Returns start/end session mutations. Invalidates React Query cache on success
 * so all components reading [sessions, active] update automatically.
 */
export function useSessionActions() {
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: sessionsApi.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const endMutation = useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: string; notes?: string | null }) =>
      sessionsApi.end(sessionId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return { startMutation, endMutation };
}
