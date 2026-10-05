import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/reset-password', AuthController.resetPassword);

export default router;
