import express from 'express';
import { sendOTP, verifyOTP, resendOTP, validateToken, adminLogin } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/validate-token', protect, validateToken);
router.post('/admin-login', adminLogin);

export default router;