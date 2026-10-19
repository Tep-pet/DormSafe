import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = Router();

router.use(authMiddleware, requireRole('owner'));

router.get('/', paymentController.list);
router.post('/', paymentController.create);
router.post('/:id/receipt', upload.single('receipt'), paymentController.uploadReceipt);
router.patch('/:id/status', paymentController.updateStatus);

export default router;
