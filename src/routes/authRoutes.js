// // backend/src/routes/authRoutes.js
// import express from 'express';
// import { protect } from '../middleware/authMiddleware.js';
// import {
//   register,
//   login,
//   getProfile,
//   updateProfile,
//   changePassword,
//   forgotPassword,
//   resetPassword,
//   verifyEmail,
//   logout
// } from '../controllers/authController.js';

// // ✅ Import OTP controller functions
// import {
//   sendOTP,
//   verifyOTP,
//   resendOTP
// } from '../controllers/otpController.js';

// const router = express.Router();

// // ============================================
// // ✅ PUBLIC ROUTES
// // ============================================

// // ✅ Authentication routes
// router.post('/register', register);
// router.post('/login', login);
// router.post('/logout', logout);

// // ✅ Password routes
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);
// router.get('/verify-email/:token', verifyEmail);

// // ============================================
// // ✅ OTP ROUTES - ADD THESE
// // ============================================

// // ✅ Send OTP
// router.post('/send-otp', sendOTP);

// // ✅ Verify OTP
// router.post('/verify-otp', verifyOTP);

// // ✅ Resend OTP
// router.post('/resend-otp', resendOTP);

// // ============================================
// // ✅ PROTECTED ROUTES (require authentication)
// // ============================================
// router.get('/profile', protect, getProfile);
// router.put('/profile', protect, updateProfile);
// router.put('/change-password', protect, changePassword);

// export default router;
// src/routes/authRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout
} from '../controllers/authController.js';

// ✅ Import OTP controller
import {
  sendOTP,
  verifyOTP,
  resendOTP
} from '../controllers/otpController.js';

const router = express.Router();

// ============================================
// ✅ PUBLIC ROUTES
// ============================================

// ✅ Authentication
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// ✅ Password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// ============================================
// ✅ OTP ROUTES
// ============================================
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// ============================================
// ✅ PROTECTED ROUTES
// ============================================
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;