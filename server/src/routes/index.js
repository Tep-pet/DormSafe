import { Router } from 'express';
import authRoutes from './auth.routes.js';
import proximityRoutes from './proximity.routes.js';
import propertiesRoutes from './properties.routes.js';
import ownersRoutes from './owners.routes.js';
import tenantsRoutes from './tenants.routes.js';
import paymentsRoutes from './payments.routes.js';
import adminRoutes from './admin.routes.js';
import notificationsRoutes from './notifications.routes.js';
import studentsRoutes from './students.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/proximity', proximityRoutes);
router.use('/properties', propertiesRoutes);
router.use('/owners', ownersRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/students', studentsRoutes);

export default router;
