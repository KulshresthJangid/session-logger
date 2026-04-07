import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { startSessionSchema, endSessionSchema, logManualSessionSchema } from './sessions.schema';
import * as sessionsController from './sessions.controller';

const router = Router();

router.use(authenticate);

router.post('/start', validate(startSessionSchema), sessionsController.start);
router.post('/end', validate(endSessionSchema), sessionsController.end);
router.post('/manual', validate(logManualSessionSchema), sessionsController.logManual);
router.get('/active', sessionsController.getActive);
router.get('/', sessionsController.list);
router.patch('/:id/abandon', sessionsController.abandon);

export default router;
