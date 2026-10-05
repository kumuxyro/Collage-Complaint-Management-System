import { Router } from 'express';
import { JiraController } from '../controllers/jiraController.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

const router = Router();

// Public / Safe Health check for Jira configuration status
router.get('/health', JiraController.getHealth);

// Test Jira connection and project access (Staff/Admin only)
router.post(
  '/test-connection',
  requireAuth,
  requireRole('STAFF', 'ADMIN'),
  JiraController.testConnection
);

export default router;
