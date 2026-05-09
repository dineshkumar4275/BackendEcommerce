import express from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentDetails,
} from '../controllers/razorpayController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.get('/payment/:paymentId', protect, getPaymentDetails);

export default router;