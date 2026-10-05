import { Router } from 'express';
import { ComplaintsController } from '../controllers/complaintsController.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

// Student creates complaints
router.post(
  '/',
  requireAuth,
  requireRole('STUDENT'),
  ComplaintsController.createComplaint
);

// Retrieve complaints list (role-filtered server-side)
router.get(
  '/',
  requireAuth,
  ComplaintsController.getComplaints
);

// Retrieve single complaint details (ownership/department checked server-side)
router.get(
  '/:complaintId',
  requireAuth,
  ComplaintsController.getComplaintById
);

// Staff/Admin claims complaint
router.post(
  '/:complaintId/claim',
  requireAuth,
  requireRole('STAFF', 'ADMIN'),
  ComplaintsController.claimComplaint
);

// Staff/Admin updates status
router.patch(
  '/:complaintId/status',
  requireAuth,
  requireRole('STAFF', 'ADMIN'),
  ComplaintsController.updateStatus
);

// Staff/Admin triggers Jira synchronization
router.post(
  '/:complaintId/jira',
  requireAuth,
  requireRole('STAFF', 'ADMIN'),
  ComplaintsController.syncToJira
);

export default router;
