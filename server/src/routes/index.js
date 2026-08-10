import { Router } from 'express';
import authRoutes from './auth.routes.js';
import proximityRoutes from './proximity.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/proximity', proximityRoutes);

export default router;
