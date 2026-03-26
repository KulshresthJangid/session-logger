import { z } from 'zod';

export const startSessionSchema = z.object({
  clientId: z.string().min(1, 'clientId is required'),
});

export const endSessionSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  notes: z.string().max(2000).optional().nullable(),
});

export const listSessionsQuerySchema = z.object({
  clientId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ABANDONED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type EndSessionInput = z.infer<typeof endSessionSchema>;
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;
