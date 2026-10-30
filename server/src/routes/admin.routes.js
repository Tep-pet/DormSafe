import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/dashboard/stats', adminController.dashboardStats);

router.get('/listings/pending', adminController.pendingListings);
router.get('/listings/properties', adminController.allProperties);
router.get('/listings/:id/documents', adminController.listingDocuments);
router.patch('/listings/:id/approve', adminController.approveListing);
router.patch('/listings/:id/reject', adminController.rejectListing);
router.patch('/listings/:id/remove', adminController.removeListing);

router.get('/verifications/pending', adminController.pendingVerifications);
router.get('/verifications/accounts', adminController.accountVerifications);
router.get('/verifications/accounts/:id/documents', adminController.verificationDocuments);
router.patch('/verifications/accounts/:id', adminController.reviewAccountVerification);
router.patch('/verifications/:id', adminController.reviewVerification);

router.get('/users', adminController.listUsers);
router.get('/tenants', adminController.listTenants);
router.delete('/tenants/:id', adminController.removeTenant);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/verification', adminController.reviewUserAccount);

router.post('/listings/bulk', adminController.bulkListings);
router.post('/accounts/bulk', adminController.bulkAccounts);
router.get('/audit-logs', adminController.auditLogs);
router.get('/system-health', adminController.systemHealth);
router.get('/campus-stats', adminController.campusStats);
router.get('/reviews/pending', adminController.pendingReviews);
router.patch('/reviews/:id', adminController.moderateReview);
router.get('/reports/pending', adminController.pendingReports);
router.patch('/reports/:id/dismiss', adminController.dismissReport);

export default router;
