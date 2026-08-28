import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as authController from '../controllers/auth.controller.js';
import { success } from '../utils/apiResponse.js';

const router = Router();

router.get('/health', (_req, res) => success(res, { status: 'ok' }, 'DormSafe API is running'));

router.get('/me', authMiddleware, (req, res) =>
  success(res, { user: req.user, profile: req.profile }, 'Profile retrieved')
);

router.post(
  '/register',
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'licenseDocument', maxCount: 1 },
  ]),
  authController.register
);

router.get('/verification/status', authMiddleware, authController.getVerificationStatus);

router.post(
  '/verification/resubmit',
  authMiddleware,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'licenseDocument', maxCount: 1 },
  ]),
  authController.resubmitVerification
);

export default router;
