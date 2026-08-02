// backend/src/controllers/razorpayController.js

import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Initialize Razorpay only if keys are present
let razorpay = null;
let isRazorpayConfigured = false;

try {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (keyId && keySecret && keyId !== 'your_razorpay_key_id' && keySecret !== 'your_razorpay_key_secret') {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    isRazorpayConfigured = true;
    console.log('✅ Razorpay initialized successfully');
  } else {
    console.log('⚠️ Razorpay keys not configured. Payment features will be disabled.');
    console.log('   To enable Razorpay, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }
} catch (error) {
  console.error('❌ Razorpay initialization failed:', error.message);
  isRazorpayConfigured = false;
}

// ✅ Check if Razorpay is available
const checkRazorpay = (req, res, next) => {
  if (!isRazorpayConfigured || !razorpay) {
    return res.status(503).json({
      success: false,
      message: 'Payment service is currently unavailable. Please try again later.',
      error: 'RAZORPAY_NOT_CONFIGURED'
    });
  }
  next();
};

// ============================================
// ✅ CREATE ORDER - Create Razorpay order
// ============================================
export const createOrder = async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!isRazorpayConfigured || !razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently unavailable. Please configure Razorpay keys.',
        error: 'RAZORPAY_NOT_CONFIGURED'
      });
    }

    const { amount, currency = 'INR', receipt } = req.body;
    
    // Validate amount
    const validAmount = Number(amount);
    if (isNaN(validAmount) || validAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Amount must be a positive number.'
      });
    }

    const amountInPaise = Math.round(validAmount * 100);
    
    console.log('Creating Razorpay order:', { amount: validAmount, amountInPaise, currency, receipt });

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    console.log('Order created successfully:', order.id);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.error?.description || error.message || 'Failed to create order',
    });
  }
};

// ============================================
// ✅ VERIFY PAYMENT - Verify Razorpay payment
// ============================================
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!isRazorpayConfigured || !razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently unavailable.',
        error: 'RAZORPAY_NOT_CONFIGURED'
      });
    }

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      console.log('Payment verified successfully');
      res.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      console.log('Invalid payment signature');
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed',
    });
  }
};

// ============================================
// ✅ GET PAYMENT DETAILS - Get payment by ID
// ============================================
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!isRazorpayConfigured || !razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently unavailable.',
        error: 'RAZORPAY_NOT_CONFIGURED'
      });
    }

    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment details',
    });
  }
};

// ============================================
// ✅ GET RAZORPAY KEY - Get public key for frontend
// ============================================
export const getRazorpayKey = (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    
    if (!keyId || !isRazorpayConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured',
        error: 'RAZORPAY_NOT_CONFIGURED'
      });
    }

    res.json({
      success: true,
      data: {
        keyId: keyId,
        isConfigured: true
      }
    });
  } catch (error) {
    console.error('Get Razorpay key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Razorpay key',
      error: error.message
    });
  }
};

// ============================================
// ✅ RAZORPAY HEALTH - Health check
// ============================================
export const razorpayHealth = (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        isConfigured: isRazorpayConfigured,
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        message: isRazorpayConfigured ? 'Razorpay is ready' : 'Razorpay is not configured'
      }
    });
  } catch (error) {
    console.error('Razorpay health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

// ============================================
// ✅ REFUND PAYMENT - Refund a payment
// ============================================
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, notes } = req.body;

    if (!isRazorpayConfigured || !razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently unavailable.',
        error: 'RAZORPAY_NOT_CONFIGURED'
      });
    }

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const refundOptions = {
      payment_id: paymentId,
      amount: amount ? amount * 100 : undefined,
      notes: notes || {},
    };

    const refund = await razorpay.refunds.create(refundOptions);

    res.json({
      success: true,
      message: 'Refund initiated successfully',
      data: refund
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
};

// ============================================
// ✅ GET ALL PAYMENTS - Get all payments (Admin)
// ============================================
export const getAllPayments = async (req, res) => {
  try {
    if (!isRazorpayConfigured || !razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently unavailable.',
        error: 'RAZORPAY_NOT_CONFIGURED'
      });
    }

    const { count = 10, skip = 0 } = req.query;
    
    const payments = await razorpay.payments.all({
      count: parseInt(count),
      skip: parseInt(skip)
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};