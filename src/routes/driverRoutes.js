import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Simple OTP store
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// =========================
// GET /api/drivers
// =========================
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Driver API is working',
    endpoints: {
      GET: {
        '/': 'List endpoints',
        '/all': 'Get all drivers',
        '/:id': 'Get driver by ID'
      },
      POST: {
        '/send-otp': 'Send OTP using email',
        '/verify-otp': 'Verify OTP using email',
        '/': 'Create driver',
        '/create': 'Create driver alternative',
        '/update-location': 'Update driver location'
      },
      PUT: {
        '/:id': 'Update driver'
      },
      DELETE: {
        '/:id': 'Delete driver'
      }
    }
  });
});

// =========================
// GET ALL DRIVERS
// =========================
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_active,
        rating,
        total_deliveries,
        current_latitude,
        current_longitude,
        last_location_update,
        created_at
      FROM drivers
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get drivers error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// SEND OTP USING EMAIL
// =========================
router.post('/send-otp', async (req, res) => {
  try {
    console.log('📧 Send OTP request:', req.body);

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const otp = generateOTP();

    otpStore.set(cleanEmail, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    console.log(`✅ OTP for ${cleanEmail}: ${otp}`);

    // TODO:
    // Add nodemailer here if needed

    res.json({
      success: true,
      message: 'OTP sent successfully',
      devOTP: otp
    });

  } catch (error) {
    console.error('Send OTP error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// VERIFY OTP USING EMAIL
// =========================
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('🔐 Verify OTP request:', req.body);

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired'
      });
    }

    if (record.expiresAt < Date.now()) {
      otpStore.delete(cleanEmail);

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

    const driverResult = await pool.query(
      `SELECT 
        id,
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_active,
        rating,
        total_deliveries
       FROM drivers
       WHERE email = $1`,
      [cleanEmail]
    );

    // New driver
    if (driverResult.rows.length === 0) {
      return res.json({
        success: true,
        isNewUser: true,
        message: 'OTP verified successfully. Please register.'
      });
    }

    // Existing driver
    res.json({
      success: true,
      isNewUser: false,
      driver: driverResult.rows[0],
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);

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
    console.log('📝 Create driver:', req.body);

    const {
      name,
      email,
      phone,
      vehicle_number,
      vehicle_type,
      is_active
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingDriver = await pool.query(
      'SELECT id FROM drivers WHERE email = $1',
      [cleanEmail]
    );

    if (existingDriver.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Driver already exists with this email'
      });
    }

    const result = await pool.query(
      `INSERT INTO drivers
      (
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_active,
        created_at`,
      [
        name,
        cleanEmail,
        phone || null,
        vehicle_number || null,
        vehicle_type || 'bike',
        is_active !== false
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Driver created successfully'
    });

  } catch (error) {
    console.error('Create driver error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// CREATE DRIVER ALTERNATIVE
// =========================
router.post('/create', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      vehicle_number,
      vehicle_type,
      is_active
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingDriver = await pool.query(
      'SELECT id FROM drivers WHERE email = $1',
      [cleanEmail]
    );

    if (existingDriver.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Driver already exists'
      });
    }

    const result = await pool.query(
      `INSERT INTO drivers
      (
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        name,
        cleanEmail,
        phone || null,
        vehicle_number || null,
        vehicle_type || 'bike',
        is_active !== false
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create driver error:', error);

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
    const { driverId, latitude, longitude } = req.body;

    if (!driverId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID, latitude and longitude required'
      });
    }

    await pool.query(
      `UPDATE drivers
       SET current_latitude = $1,
           current_longitude = $2,
           last_location_update = NOW()
       WHERE id = $3`,
      [latitude, longitude, driverId]
    );

    res.json({
      success: true,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Update location error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// GET DRIVER BY ID
// =========================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM drivers
       WHERE id = $1`,
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
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get driver error:', error);

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
      is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE drivers
       SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         vehicle_number = COALESCE($4, vehicle_number),
         vehicle_type = COALESCE($5, vehicle_type),
         is_active = COALESCE($6, is_active),
         updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        name,
        email,
        phone,
        vehicle_number,
        vehicle_type,
        is_active,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Driver updated successfully'
    });

  } catch (error) {
    console.error('Update driver error:', error);

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

    const result = await pool.query(
      'DELETE FROM drivers WHERE id = $1 RETURNING id',
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
    console.error('Delete driver error:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;