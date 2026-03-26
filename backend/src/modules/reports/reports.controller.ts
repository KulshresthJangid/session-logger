import { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service';
import { currentMonth } from '../../utils/date';

export async function monthly(req: Request, res: Response, next: NextFunction) {
  try {
    const month = (req.query.month as string) ?? currentMonth();
    const clientId = req.query.clientId as string | undefined;
    const report = await reportsService.getMonthlyReport(req.user!.userId, month, clientId);
    res.json(report);
  } catch (err) { next(err); }
}

export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await reportsService.getDashboardStats(req.user!.userId);
    res.json(stats);
  } catch (err) { next(err); }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const month = (req.query.month as string) ?? currentMonth();
    const clientId = req.query.clientId as string | undefined;
    const csv = await reportsService.exportSessionsCsv(req.user!.userId, month, clientId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sessions-${month}.csv"`,
    );
    res.send(csv);
  } catch (err) { next(err); }
}
