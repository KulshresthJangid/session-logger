import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getMonthBounds, currentMonth } from '../../utils/date';
import { formatDuration } from '../../utils/billing';

export async function getMonthlyReport(
  userId: string,
  month: string,
  clientId?: string,
) {
  const { start, end } = getMonthBounds(month);

  const where = {
    userId,
    status: 'COMPLETED' as const,
    startTime: { gte: start, lte: end },
    ...(clientId ? { clientId } : {}),
    client: { deletedAt: null },
  };

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { startTime: 'asc' },
    include: { client: { select: { id: true, name: true, monthlyBudget: true } } },
  });

  // Aggregate by client
  const clientMap = new Map<
    string,
    {
      clientId: string;
      clientName: string;
      monthlyBudget: number | null;
      sessions: typeof sessions;
    }
  >();

  for (const s of sessions) {
    if (!clientMap.has(s.clientId)) {
      clientMap.set(s.clientId, {
        clientId: s.clientId,
        clientName: s.client.name,
        monthlyBudget: s.client.monthlyBudget
          ? parseFloat(s.client.monthlyBudget.toString())
          : null,
        sessions: [],
      });
    }
    clientMap.get(s.clientId)!.sessions.push(s);
  }

  const report = Array.from(clientMap.values()).map((entry) => {
    const totalSecs = entry.sessions.reduce((sum: any, s: any) => sum + (s.durationSecs ?? 0), 0);
    const totalCost = entry.sessions.reduce(
      (sum: any, s: any) => sum + parseFloat(s.cost?.toString() ?? '0'),
      0,
    );
    return {
      clientId: entry.clientId,
      clientName: entry.clientName,
      totalSessions: entry.sessions.length,
      totalSecs,
      totalHours: parseFloat((totalSecs / 3600).toFixed(2)),
      totalDurationFormatted: formatDuration(totalSecs),
      totalCost: parseFloat(totalCost.toFixed(2)),
      monthlyBudget: entry.monthlyBudget,
      isOverBudget:
        entry.monthlyBudget != null ? totalCost > entry.monthlyBudget : false,
      sessions: entry.sessions,
    };
  });

  const grandTotal = {
    totalSessions: sessions.length,
    totalSecs: report.reduce((s, r) => s + r.totalSecs, 0),
    totalHours: parseFloat(
      (report.reduce((s, r) => s + r.totalSecs, 0) / 3600).toFixed(2),
    ),
    totalCost: parseFloat(report.reduce((s, r) => s + r.totalCost, 0).toFixed(2)),
  };

  return { month, report, grandTotal };
}

export async function getDashboardStats(userId: string) {
  const month = currentMonth();
  const { start, end } = getMonthBounds(month);

  const [totalClients, monthSessions, activeSessions] = await Promise.all([
    prisma.client.count({ where: { userId, deletedAt: null } }),
    prisma.session.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        startTime: { gte: start, lte: end },
      },
      select: { cost: true },
    }),
    prisma.session.count({ where: { userId, status: 'ACTIVE' } }),
  ]);

  const totalRevenue = monthSessions.reduce(
    (sum: any, s: any) => sum + parseFloat(s.cost?.toString() ?? '0'),
    0,
  );

  return {
    totalClients,
    sessionsThisMonth: monthSessions.length,
    revenueThisMonth: parseFloat(totalRevenue.toFixed(2)),
    activeSessions,
  };
}

export async function exportSessionsCsv(
  userId: string,
  month: string,
  clientId?: string,
): Promise<string> {
  const { report } = await getMonthlyReport(userId, month, clientId);

  const rows: string[] = [
    'Date,Client,Start Time,End Time,Duration,Cost,Notes',
  ];

  for (const entry of report) {
    for (const s of entry.sessions) {
      const date = s.startTime.toISOString().split('T')[0];
      const start = s.startTime.toISOString();
      const end = s.endTime?.toISOString() ?? '';
      const duration = formatDuration(s.durationSecs ?? 0);
      const cost = s.cost?.toString() ?? '0';
      const notes = (s.notes ?? '').replace(/,/g, ';').replace(/\n/g, ' ');
      rows.push(`${date},"${entry.clientName}",${start},${end},${duration},${cost},"${notes}"`);
    }
  }

  return rows.join('\n');
}
