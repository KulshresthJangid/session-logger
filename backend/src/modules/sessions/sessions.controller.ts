import { Request, Response, NextFunction } from 'express';
import { listSessionsQuerySchema } from './sessions.schema';
import * as sessionsService from './sessions.service';

export async function start(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await sessionsService.startSession(req.user!.userId, req.body);
    res.status(201).json(session);
  } catch (err) { next(err); }
}

export async function end(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await sessionsService.endSession(req.user!.userId, req.body);
    res.json(session);
  } catch (err) { next(err); }
}

export async function getActive(req: Request, res: Response, next: NextFunction) {
  try {
    const sessions = await sessionsService.getActiveSessions(req.user!.userId);
    res.json(sessions);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listSessionsQuerySchema.parse(req.query);
    const result = await sessionsService.listSessions(req.user!.userId, query);
    res.json(result);
  } catch (err) { next(err); }
}

export async function abandon(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await sessionsService.abandonSession(
      req.user!.userId,
      req.params.id,
    );
    res.json(session);
  } catch (err) { next(err); }
}

export async function logManual(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await sessionsService.logManualSession(req.user!.userId, req.body);
    res.status(201).json(session);
  } catch (err) { next(err); }
}
