import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createClientSchema, updateClientSchema } from './clients.schema';
import * as clientsController from './clients.controller';

const router = Router();

router.use(authenticate);

router.get('/', clientsController.list);
router.post('/', validate(createClientSchema), clientsController.create);
router.get('/:id', clientsController.getOne);
router.put('/:id', validate(updateClientSchema), clientsController.update);
router.delete('/:id', clientsController.remove);

export default router;
