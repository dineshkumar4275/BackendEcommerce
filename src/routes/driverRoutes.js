// backend/routes/driverRoutes.js

import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendOTPEmail } from '../services/emailService.js';
import { saveOTP, verifyOTP } from '../utils/otpStore.js';

const router = express.Router();

/* =========================================================
   ADD DRIVER
========================================================= */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      vehicle_number,
      vehicle_type
    } = req.body;

    // Validation
    if (
      !name ||
      !email ||
      !phone ||
      !vehicle_number ||
      !vehicle_type
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check existing driver
    const existingDriver = await pool.query(
      'SELECT * FROM drivers WHERE email = $1',
      [email]
    );

    if (existingDriver.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Driver already exists'
      });
    }

    // Insert driver
    const result = await pool.query(
      `
      INSERT INTO drivers
      (
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_available,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
      `,
      [
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        false
      ]
    );

    res.json({
      success: true,
      message: 'Driver added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Add Driver Error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================================================
   SEND OTP
========================================================= */
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const driverResult = await pool.query(
      'SELECT id, name, email FROM drivers WHERE email = $1',
      [email]
    );

    if (driverResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    const driver = driverResult.rows[0];

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    saveOTP(email, otp);

    await sendOTPEmail(email, otp, driver.name);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/* =========================================================
   VERIFY OTP
========================================================= */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const verification = verifyOTP(email, otp);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: verification.message
      });
    }

    const driverResult = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_available
      FROM drivers
      WHERE email = $1
      `,
      [email]
    );

    const driver = driverResult.rows[0];

    const token = jwt.sign(
      {
        id: driver.id,
        role: 'driver'
      },
      process.env.JWT_SECRET ||
      'my_super_secret_key_12345678',
      {
        expiresIn: '30d'
      }
    );

    res.json({
      success: true,
      token,
      user: driver
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/* =========================================================
   GET ALL DRIVERS
========================================================= */
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_available,
        created_at
      FROM drivers
      ORDER BY id DESC
      `
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================================================
   AVAILABLE ORDERS
========================================================= */
router.get('/available-orders', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        order_number,
        total_amount,
        status,
        shipping_address,
        created_at
      FROM orders
      WHERE status = 'pending'
      AND driver_id IS NULL
      ORDER BY created_at ASC
      `
    );

    const orders = result.rows.map(order => ({
      ...order,
      shipping_address:
        typeof order.shipping_address === 'string'
          ? JSON.parse(order.shipping_address)
          : order.shipping_address
    }));

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================================================
   MY ORDERS
========================================================= */
router.get('/my-orders', protect, async (req, res) => {
  try {
    const driverId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        o.*,
        COALESCE(u.name, 'Guest User') as customer_name
      FROM orders o
      LEFT JOIN users u
      ON o.user_id = u.id
      WHERE o.driver_id = $1
      ORDER BY o.created_at DESC
      `,
      [driverId]
    );

    const orders = result.rows.map(order => ({
      ...order,
      shipping_address:
        typeof order.shipping_address === 'string'
          ? JSON.parse(order.shipping_address)
          : order.shipping_address,

      products:
        typeof order.products === 'string'
          ? JSON.parse(order.products)
          : order.products
    }));

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================================================
   ACCEPT ORDER
========================================================= */
router.put('/accept-order/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    const driverId = req.user.id;

    const deliveryFee = 40;

    const result = await pool.query(
      `
      UPDATE orders
      SET
        driver_id = $1,
        status = 'accepted',
        delivery_fee = $2,
        updated_at = NOW()
      WHERE id = $3
      AND status = 'pending'
      RETURNING *
      `,
      [
        driverId,
        deliveryFee,
        orderId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already accepted'
      });
    }

    res.json({
      success: true,
      message: 'Order accepted successfully'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================================================
   GET ORDER DETAILS
========================================================= */
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    const driverId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        o.*,
        COALESCE(u.name, 'Guest User') as customer_name
      FROM orders o
      LEFT JOIN users u
      ON o.user_id = u.id
      WHERE o.id = $1
      AND o.driver_id = $2
      `,
      [orderId, driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = result.rows[0];

    order.products =
      typeof order.products === 'string'
        ? JSON.parse(order.products)
        : (order.products || []);

    order.shipping_address =
      typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : (order.shipping_address || {});

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */
router.put('/order/:orderId/status', protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    const { status } = req.body;

    const driverId = req.user.id;

    const result = await pool.query(
      `
      UPDATE orders
      SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      AND driver_id = $3
      RETURNING *
      `,
      [
        status,
        orderId,
        driverId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: `Order ${status}`
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================================================
   DRIVER AVAILABILITY
========================================================= */
router.post('/availability', protect, async (req, res) => {
  try {
    const driverId = req.user.id;

    const { isAvailable } = req.body;

    await pool.query(
      `
      UPDATE drivers
      SET is_available = $1
      WHERE id = $2
      `,
      [
        isAvailable,
        driverId
      ]
    );

    res.json({
      success: true,
      message: isAvailable
        ? 'Online'
        : 'Offline'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================================================
   DRIVER EARNINGS
========================================================= */
router.get('/earnings', protect, async (req, res) => {
  try {
    const driverId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const monthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const totalResult = await pool.query(
      `
      SELECT
        COALESCE(SUM(delivery_fee), 0) as total,
        COUNT(*) as count
      FROM orders
      WHERE driver_id = $1
      AND status = 'delivered'
      `,
      [driverId]
    );

    const todayResult = await pool.query(
      `
      SELECT
        COALESCE(SUM(delivery_fee), 0) as total,
        COUNT(*) as count
      FROM orders
      WHERE driver_id = $1
      AND status = 'delivered'
      AND DATE(updated_at) = CURRENT_DATE
      `,
      [driverId]
    );

    const weekResult = await pool.query(
      `
      SELECT
        COALESCE(SUM(delivery_fee), 0) as total,
        COUNT(*) as count
      FROM orders
      WHERE driver_id = $1
      AND status = 'delivered'
      AND updated_at >= $2
      `,
      [
        driverId,
        weekStart
      ]
    );

    const monthResult = await pool.query(
      `
      SELECT
        COALESCE(SUM(delivery_fee), 0) as total,
        COUNT(*) as count
      FROM orders
      WHERE driver_id = $1
      AND status = 'delivered'
      AND updated_at >= $2
      `,
      [
        driverId,
        monthStart
      ]
    );

    res.json({
      success: true,
      data: {
        total: parseFloat(totalResult.rows[0].total),
        total_deliveries: parseInt(totalResult.rows[0].count),

        today: parseFloat(todayResult.rows[0].total),
        today_count: parseInt(todayResult.rows[0].count),

        week: parseFloat(weekResult.rows[0].total),
        week_count: parseInt(weekResult.rows[0].count),

        month: parseFloat(monthResult.rows[0].total),
        month_count: parseInt(monthResult.rows[0].count)
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
