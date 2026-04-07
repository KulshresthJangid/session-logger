import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { computeCost, computeDuration } from '../../utils/billing';
import { StartSessionInput, EndSessionInput, ListSessionsQuery, LogManualSessionInput } from './sessions.schema';

export async function startSession(userId: string, input: StartSessionInput) {
  // Verify client belongs to this user
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, userId, deletedAt: null },
  });
  if (!client) throw new AppError(404, 'Client not found');

  // Prevent duplicate active sessions per client
  const existing = await prisma.session.findFirst({
    where: { clientId: input.clientId, userId, status: 'ACTIVE' },
  });
  if (existing) {
    throw new AppError(409, 'A session is already active for this client');
  }

  // Snapshot the billing rate at the time the session starts
  const billingSnapshot =
    client.billingType === 'HOURLY'
      ? parseFloat(client.hourlyRate?.toString() ?? '0')
      : parseFloat(client.fixedRate?.toString() ?? '0');

  return prisma.session.create({
    data: {
      clientId: input.clientId,
      userId,
      billingType: client.billingType,
      billingSnapshot,
    },
    include: { client: { select: { id: true, name: true } } },
  });
}

export async function endSession(userId: string, input: EndSessionInput) {
  const session = await prisma.session.findFirst({
    where: { id: input.sessionId, userId, status: 'ACTIVE' },
  });
  if (!session) throw new AppError(404, 'Active session not found');

  const endTime = new Date();
  const durationSecs = computeDuration(session.startTime, endTime);
  const cost = computeCost(
    session.billingType,
    parseFloat(session.billingSnapshot.toString()),
    durationSecs,
  );

  return prisma.session.update({
    where: { id: session.id },
    data: {
      endTime,
      durationSecs,
      cost,
      notes: input.notes ?? null,
      status: 'COMPLETED',
    },
    include: { client: { select: { id: true, name: true } } },
  });
}

export async function getActiveSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { startTime: 'asc' },
  });
}

export async function listSessions(userId: string, query: ListSessionsQuery) {
  const { clientId, startDate, endDate, status, page, limit } = query;

  const where = {
    userId,
    ...(clientId && { clientId }),
    ...(status && { status }),
    ...(startDate || endDate
      ? {
          startTime: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate + 'T23:59:59.999Z') }),
          },
        }
      : {}),
  };

  const [total, sessions] = await Promise.all([
    prisma.session.count({ where }),
    prisma.session.findMany({
      where,
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { client: { select: { id: true, name: true } } },
    }),
  ]);

  return {
    sessions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function abandonSession(userId: string, sessionId: string) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId, status: 'ACTIVE' },
  });
  if (!session) throw new AppError(404, 'Active session not found');

  return prisma.session.update({
    where: { id: sessionId },
    data: { status: 'ABANDONED', endTime: new Date() },
  });
}

export async function logManualSession(userId: string, input: LogManualSessionInput) {
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, userId, deletedAt: null },
  });
  if (!client) throw new AppError(404, 'Client not found');

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);
  const durationSecs = computeDuration(startTime, endTime);

  const billingSnapshot =
    client.billingType === 'HOURLY'
      ? parseFloat(client.hourlyRate?.toString() ?? '0')
      : parseFloat(client.fixedRate?.toString() ?? '0');

  const cost = computeCost(client.billingType, billingSnapshot, durationSecs);

  return prisma.session.create({
    data: {
      clientId: input.clientId,
      userId,
      startTime,
      endTime,
      durationSecs,
      cost,
      notes: input.notes ?? null,
      status: 'COMPLETED',
      billingType: client.billingType,
      billingSnapshot,
    },
    include: { client: { select: { id: true, name: true } } },
  });
}
