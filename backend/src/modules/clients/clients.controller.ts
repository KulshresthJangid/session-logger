import { Request, Response, NextFunction } from 'express';
import * as clientsService from './clients.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const clients = await clientsService.listClients(req.user!.userId);
    res.json(clients);
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await clientsService.getClientWithStats(req.user!.userId, req.params.id);
    res.json(client);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await clientsService.createClient(req.user!.userId, req.body);
    res.status(201).json(client);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await clientsService.updateClient(req.user!.userId, req.params.id, req.body);
    res.json(client);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await clientsService.deleteClient(req.user!.userId, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}
