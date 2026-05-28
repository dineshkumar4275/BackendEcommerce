import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendOTPEmail } from '../services/emailService.js';
import { saveOTP, verifyOTP } from '../utils/otpStore.js';

const router = express.Router();

/* ================================
   ADD DRIVER
================================ */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      vehicle_number,
      vehicle_type
    } = req.body;

    if (!name || !email || !phone || !vehicle_number || !vehicle_type) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const check = await pool.query(
      'SELECT * FROM drivers WHERE email = $1',
      [email]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Driver already exists'
      });
    }

    const result = await pool.query(
      `INSERT INTO drivers
      (name, email, phone, vehicle_number, vehicle_type, is_available, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *`,
      [name, email, phone, vehicle_number, vehicle_type, false]
    );

    res.json({
      success: true,
      message: 'Driver added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ================================
   GET ALL DRIVERS
================================ */
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM drivers ORDER BY id DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ================================
   UPDATE DRIVER (FIXED ERROR)
   ✅ THIS FIXES /api/drivers/2 NOT FOUND ISSUE
================================ */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      phone,
      vehicle_number,
      vehicle_type,
      is_available
    } = req.body;

    const check = await pool.query(
      'SELECT * FROM drivers WHERE id = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    const result = await pool.query(
      `UPDATE drivers
       SET name=$1,
           email=$2,
           phone=$3,
           vehicle_number=$4,
           vehicle_type=$5,
           is_available=$6
       WHERE id=$7
       RETURNING *`,
      [
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_available,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Driver updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ================================
   DELETE DRIVER
================================ */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM drivers WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ================================
   OTP SEND
================================ */
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const driver = await pool.query(
      'SELECT id, name, email FROM drivers WHERE email=$1',
      [email]
    );

    if (driver.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    saveOTP(email, otp);
    await sendOTPEmail(email, otp, driver.rows[0].name);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ================================
   VERIFY OTP
================================ */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const verify = verifyOTP(email, otp);

    if (!verify.valid) {
      return res.status(401).json({
        success: false,
        message: verify.message
      });
    }

    const driver = await pool.query(
      'SELECT * FROM drivers WHERE email=$1',
      [email]
    );

    const token = jwt.sign(
      { id: driver.rows[0].id, role: 'driver' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: driver.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ================================
   EXPORT
================================ */
export default router;
