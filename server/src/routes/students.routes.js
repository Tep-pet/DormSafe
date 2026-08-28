import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import * as studentController from '../controllers/student.controller.js';

const router = Router();

router.use(authMiddleware, requireRole('student'));

router.get('/stays', studentController.myStays);
router.patch('/stays/:id/move-out', studentController.updateMoveOut);
router.post('/stays/:id/confirm-move-out', studentController.confirmMoveOut);
router.post('/stays/:id/dispute-move-out', studentController.disputeMoveOut);
router.get('/stays/:id/lease-summary', studentController.leaseSummary);
router.post('/stays/:id/rerent', studentController.rerent);

router.get('/payments', studentController.myPayments);

router.get('/reservations', studentController.myReservations);
router.post('/reservations', studentController.createReservation);
router.patch('/reservations/:id', studentController.updateReservation);

router.get('/favorites', studentController.listFavorites);
router.post('/favorites/:propertyId', studentController.toggleFavorite);

router.post('/reviews', studentController.createReview);
router.post('/reports', studentController.reportListing);

router.get('/maintenance', studentController.listMaintenance);
router.post('/maintenance', studentController.createMaintenance);

export default router;
