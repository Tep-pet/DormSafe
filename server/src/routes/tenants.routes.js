import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import * as tenantController from '../controllers/tenant.controller.js';

const router = Router();

router.use(authMiddleware, requireRole('owner'));

router.get('/', tenantController.list);
router.post('/', tenantController.create);
router.delete('/:id', tenantController.remove);

export default router;
