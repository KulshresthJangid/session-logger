import { z } from 'zod';

const clientBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  billingType: z.enum(['HOURLY', 'FIXED']),
  hourlyRate: z.number().positive().optional().nullable(),
  fixedRate: z.number().positive().optional().nullable(),
  monthlyBudget: z.number().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

export const createClientSchema = clientBaseSchema.refine(
  (data) => {
    if (data.billingType === 'HOURLY') return data.hourlyRate != null;
    if (data.billingType === 'FIXED') return data.fixedRate != null;
    return true;
  },
  { message: 'Provide hourlyRate for HOURLY billing, or fixedRate for FIXED billing' },
);

export const updateClientSchema = clientBaseSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
