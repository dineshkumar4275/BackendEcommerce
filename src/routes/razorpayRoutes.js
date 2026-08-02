// backend/src/routes/razorpayRoutes.js

import express from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  getRazorpayKey,
  razorpayHealth,
  refundPayment
} from '../controllers/razorpayController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js'; // ✅ Fixed import path

const router = express.Router();

// ✅ Public routes (no authentication required)
router.get('/health', razorpayHealth);
router.get('/key', getRazorpayKey);

// ✅ Protected routes (authentication required)
router.post('/create-order', authenticateToken, createOrder);
router.post('/verify-payment', authenticateToken, verifyPayment);
router.get('/payment/:paymentId', authenticateToken, getPaymentDetails);
router.post('/refund', authenticateToken, isAdmin, refundPayment);

export default router;