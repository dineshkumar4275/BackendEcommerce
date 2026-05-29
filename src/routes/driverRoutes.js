import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

const otpStore = new Map();

// =========================
// GENERATE OTP
// =========================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// =========================
// ROOT
// =========================
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Driver API Working'
  });
});

// =========================
// AVAILABLE ORDERS
// =========================
router.get('/available-orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM orders
      WHERE driver_id IS NULL
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Available orders error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// MY ORDERS
// =========================
router.get('/my-orders', async (req, res) => {
  try {
    const driverId = req.query.driverId;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'driverId required'
      });
    }

    const result = await pool.query(`
      SELECT *
      FROM orders
      WHERE driver_id = $1
      ORDER BY created_at DESC
    `, [driverId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('My orders error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// DRIVER EARNINGS
// =========================
router.get('/earnings', async (req, res) => {
  try {
    const driverId = req.query.driverId;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'driverId required'
      });
    }

    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_amount),0) AS total_earnings,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total_amount ELSE 0 END),0) AS today_earnings,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) AS today_count
      FROM orders
      WHERE driver_id = $1
      AND status = 'delivered'
    `, [driverId]);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Earnings error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// GET ALL DRIVERS
// =========================
router.get('/all', async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT *
      FROM drivers
      ORDER BY id DESC
    `);

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

// =========================
// UPDATE PUSH TOKEN (FOR REAL-TIME NOTIFICATIONS)
// =========================
router.post('/update-push-token', async (req, res) => {
  try {
    const { driver_id, push_token } = req.body;
    
    if (!driver_id || !push_token) {
      return res.status(400).json({
        success: false,
        message: 'driver_id and push_token required'
      });
    }
    
    await pool.query(
      `UPDATE drivers 
       SET push_token = $1, updated_at = NOW() 
       WHERE id = $2 AND (push_token IS DISTINCT FROM $1 OR push_token IS NULL)`,
      [push_token, driver_id]
    );
    
    console.log(`✅ Push token updated for driver ${driver_id}`);
    
    res.json({
      success: true,
      message: 'Push token saved successfully'
    });
    
  } catch (error) {
    console.error('Update push token error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// UPDATE AVAILABILITY (FOR REAL-TIME NOTIFICATIONS)
// =========================
router.post('/update-availability', async (req, res) => {
  try {
    const { driver_id, is_available } = req.body;
    
    await pool.query(
      `UPDATE drivers 
       SET is_available = $1, updated_at = NOW() 
       WHERE id = $2`,
      [is_available, driver_id]
    );
    
    console.log(`📱 Driver ${driver_id} availability: ${is_available ? 'ONLINE' : 'OFFLINE'}`);
    
    res.json({
      success: true,
      message: `Driver is now ${is_available ? 'online' : 'offline'}`
    });
    
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// GET DRIVER NOTIFICATIONS
// =========================
router.get('/:driverId/notifications', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM driver_notifications 
      WHERE driver_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [driverId]);
    
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

// =========================
// SEND OTP
// =========================
router.post('/send-otp', async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const otp = generateOTP();

    otpStore.set(cleanEmail, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    console.log(`OTP for ${cleanEmail}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      devOTP: otp
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// VERIFY OTP
// =========================
router.post('/verify-otp', async (req, res) => {
  try {

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    otpStore.delete(cleanEmail);

    const result = await pool.query(`
      SELECT *
      FROM drivers
      WHERE email = $1
    `, [cleanEmail]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        isNewUser: true
      });
    }

    res.json({
      success: true,
      isNewUser: false,
      driver: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// CREATE DRIVER
// =========================
router.post('/', async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
      vehicle_number,
      vehicle_type
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await pool.query(`
      SELECT id
      FROM drivers
      WHERE email = $1
    `, [cleanEmail]);

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Driver already exists'
      });
    }

    const result = await pool.query(`
      INSERT INTO drivers
      (
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_available
      )
      VALUES ($1,$2,$3,$4,$5, $6)
      RETURNING *
    `, [
      name,
      cleanEmail,
      phone || null,
      vehicle_number || null,
      vehicle_type || 'bike',
      false  // Default offline
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// UPDATE LOCATION
// =========================
router.post('/update-location', async (req, res) => {
  try {

    const {
      driverId,
      latitude,
      longitude
    } = req.body;

    await pool.query(`
      UPDATE drivers
      SET
        current_latitude = $1,
        current_longitude = $2,
        last_location_update = NOW()
      WHERE id = $3
    `, [latitude, longitude, driverId]);

    res.json({
      success: true,
      message: 'Location updated'
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =====================================
// IMPORTANT
// KEEP :id ROUTES ALWAYS AT LAST
// =====================================

// =========================
// GET DRIVER BY ID
// =========================
router.get('/:id', async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(`
      SELECT *
      FROM drivers
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// UPDATE DRIVER
// =========================
router.put('/:id', async (req, res) => {
  try {

    const { id } = req.params;

    const {
      name,
      email,
      phone,
      vehicle_number,
      vehicle_type,
      is_active,
      is_available
    } = req.body;

    const result = await pool.query(`
      UPDATE drivers
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        vehicle_number = COALESCE($4, vehicle_number),
        vehicle_type = COALESCE($5, vehicle_type),
        is_active = COALESCE($6, is_active),
        is_available = COALESCE($7, is_available),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [
      name,
      email,
      phone,
      vehicle_number,
      vehicle_type,
      is_active,
      is_available,
      id
    ]);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// DELETE DRIVER
// =========================
router.delete('/:id', async (req, res) => {
  try {

    const { id } = req.params;

    await pool.query(`
      DELETE FROM drivers
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Driver deleted'
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;