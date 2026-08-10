import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { success } from '../utils/apiResponse.js';

const router = Router();

router.get('/health', (_req, res) => success(res, { status: 'ok' }, 'DormSafe API is running'));

router.get('/me', authMiddleware, (req, res) =>
  success(res, { user: req.user, profile: req.profile }, 'Profile retrieved')
);

export default router;
