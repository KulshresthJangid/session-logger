import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { CreateClientInput, UpdateClientInput } from './clients.schema';
import { currentMonth, getMonthBounds } from '../../utils/date';

export async function listClients(userId: string) {
  return prisma.client.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getClient(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId, deletedAt: null },
  });
  if (!client) throw new AppError(404, 'Client not found');
  return client;
}

export async function createClient(userId: string, input: CreateClientInput) {
  return prisma.client.create({
    data: {
      userId,
      name: input.name,
      billingType: input.billingType,
      hourlyRate: input.hourlyRate ?? null,
      fixedRate: input.fixedRate ?? null,
      monthlyBudget: input.monthlyBudget ?? null,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
    },
  });
}

export async function updateClient(
  userId: string,
  clientId: string,
  input: UpdateClientInput,
) {
  await getClient(userId, clientId);
  return prisma.client.update({
    where: { id: clientId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.billingType && { billingType: input.billingType }),
      ...(input.hourlyRate !== undefined && { hourlyRate: input.hourlyRate }),
      ...(input.fixedRate !== undefined && { fixedRate: input.fixedRate }),
      ...(input.monthlyBudget !== undefined && { monthlyBudget: input.monthlyBudget }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.tags && { tags: input.tags }),
    },
  });
}

export async function deleteClient(userId: string, clientId: string) {
  await getClient(userId, clientId);
  // Soft delete — preserve session history
  return prisma.client.update({
    where: { id: clientId },
    data: { deletedAt: new Date() },
  });
}

export async function getClientWithStats(userId: string, clientId: string) {
  const client = await getClient(userId, clientId);
  const { start, end } = getMonthBounds(currentMonth());

  const sessions = await prisma.session.findMany({
    where: {
      clientId,
      userId,
      status: 'COMPLETED',
      startTime: { gte: start, lte: end },
    },
    select: { durationSecs: true, cost: true },
  });

  const activeSession = await prisma.session.findFirst({
    where: { clientId, userId, status: 'ACTIVE' },
  });

  const totalSessions = sessions.length;
  const totalSecs = sessions.reduce((sum, s) => sum + (s.durationSecs ?? 0), 0);
  const totalCost = sessions.reduce(
    (sum, s) => sum + parseFloat(s.cost?.toString() ?? '0'),
    0,
  );

  return {
    ...client,
    currentMonth: {
      totalSessions,
      totalHours: parseFloat((totalSecs / 3600).toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      isOverBudget:
        client.monthlyBudget != null
          ? totalCost > parseFloat(client.monthlyBudget.toString())
          : false,
    },
    activeSession,
  };
}
