import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import * as proximityController from '../controllers/proximity.controller.js';

const router = Router();

/** Students search verified listings within 2 km (proposal requires auth) */
router.get(
  '/search',
  authMiddleware,
  requireRole('student', 'admin'),
  proximityController.search
);

router.get(
  '/properties/:id',
  authMiddleware,
  requireRole('student', 'admin'),
  proximityController.getDetail
);

export default router;
