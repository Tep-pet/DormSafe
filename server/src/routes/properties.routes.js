import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as propertyController from '../controllers/property.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard/stats', requireRole('owner'), propertyController.dashboardStats);
router.get('/mine', requireRole('owner'), propertyController.listMine);
router.post('/', requireRole('owner'), propertyController.create);
router.post(
  '/rooms/:roomId/images',
  requireRole('owner'),
  upload.array('images', 8),
  propertyController.uploadRoomPhotos
);
router.get('/:id', requireRole('owner', 'admin'), propertyController.getOne);
router.patch('/:id', requireRole('owner'), propertyController.update);
router.patch('/rooms/:roomId/availability', requireRole('owner'), propertyController.updateAvailability);

export default router;
