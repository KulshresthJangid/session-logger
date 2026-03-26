import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as reportsController from './reports.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', reportsController.dashboard);
router.get('/monthly', reportsController.monthly);
router.get('/export', reportsController.exportCsv);

export default router;
