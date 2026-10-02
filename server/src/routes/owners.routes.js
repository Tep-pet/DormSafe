import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as ownerController from '../controllers/owner.controller.js';

const router = Router();

router.use(authMiddleware, requireRole('owner'));

router.post('/verification', upload.single('permit'), ownerController.submitVerification);
router.get('/analytics', ownerController.analytics);
router.get('/occupancy', ownerController.occupancyCalendar);
router.post('/payment-reminders', ownerController.sendPaymentReminders);
router.get('/inquiries', ownerController.listInquiries);
router.post('/inquiries/:id/reply', ownerController.replyToInquiry);
router.get('/maintenance', ownerController.listMaintenance);
router.patch('/maintenance/:id', ownerController.updateMaintenance);

export default router;
