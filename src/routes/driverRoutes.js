import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Simple OTP store (in-memory for development)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============ OTP ROUTES ============

// POST /api/drivers/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    console.log('📧 Send OTP request:', req.body);
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const otp = generateOTP();
    otpStore.set(phone, { 
      otp, 
      expiresAt: Date.now() + 10 * 60000 // 10 minutes expiry
    });
    
    console.log(`✅ OTP for ${phone}: ${otp}`);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      devOTP: otp // Remove in production
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/drivers/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('🔐 Verify OTP request:', req.body);
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required'
      });
    }
    
    const record = otpStore.get(phone);
    
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired'
      });
    }
    
    if (record.expiresAt < Date.now()) {
      otpStore.delete(phone);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }
    
    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // OTP verified - delete it
    otpStore.delete(phone);
    
    // Check if driver exists in database
    const driverResult = await pool.query(
      'SELECT id, name, email, phone, vehicle_number, vehicle_type, is_active, rating, total_deliveries FROM drivers WHERE phone = $1',
      [phone]
    );
    
    if (driverResult.rows.length === 0) {
      // New user - needs registration
      return res.json({
        success: true,
        isNewUser: true,
        message: 'OTP verified successfully. Please complete registration.'
      });
    }
    
    // Existing user - login successful
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

// ============ DRIVER CRUD ROUTES ============

// GET /api/drivers/ - List all available endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Driver API is working',
    endpoints: {
      GET: {
        '/': 'List all endpoints',
        '/all': 'Get all drivers',
        '/:id': 'Get driver by ID'
      },
      POST: {
        '/send-otp': 'Send OTP to driver phone',
        '/verify-otp': 'Verify OTP code',
        '/': 'Create new driver',
        '/create': 'Create new driver (alternative)',
        '/update-location': 'Update driver location'
      },
      PUT: {
        '/:id': 'Update driver by ID'
      },
      DELETE: {
        '/:id': 'Delete driver by ID'
      }
    }
  });
});

// GET /api/drivers/all - Get all drivers
router.get('/all', async (req, res) => {
  try {
    console.log('📦 Fetching all drivers...');
    
    const result = await pool.query(`
      SELECT id, name, email, phone, vehicle_number, vehicle_type,
             is_active, rating, total_deliveries, created_at,
             current_latitude, current_longitude, last_location_update
      FROM drivers
      ORDER BY id DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/drivers/ - Create new driver
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating driver:', req.body);
    
    const { name, email, phone, vehicle_number, vehicle_type, is_active } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required fields'
      });
    }
    
    // Check if driver already exists
    const existingDriver = await pool.query(
      'SELECT id FROM drivers WHERE phone = $1',
      [phone]
    );
    
    if (existingDriver.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Driver with this phone number already exists'
      });
    }
    
    // Insert new driver
    const result = await pool.query(
      `INSERT INTO drivers (name, email, phone, vehicle_number, vehicle_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, vehicle_number, vehicle_type, is_active, created_at`,
      [name, email || null, phone, vehicle_number || null, vehicle_type || 'bike', is_active !== false]
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

// POST /api/drivers/create - Alternative create driver endpoint
router.post('/create', async (req, res) => {
  try {
    console.log('📝 Creating driver (alternative):', req.body);
    
    const { name, email, phone, vehicle_number, vehicle_type, is_active } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }
    
    const existingDriver = await pool.query(
      'SELECT id FROM drivers WHERE phone = $1',
      [phone]
    );
    
    if (existingDriver.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Driver with this phone number already exists'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO drivers (name, email, phone, vehicle_number, vehicle_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, vehicle_number, vehicle_type, is_active, created_at`,
      [name, email || null, phone, vehicle_number || null, vehicle_type || 'bike', is_active !== false]
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

// GET /api/drivers/:id - Get driver by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT id, name, email, phone, vehicle_number, vehicle_type, is_active, 
              rating, total_deliveries, created_at, updated_at,
              current_latitude, current_longitude, last_location_update
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

// PUT /api/drivers/:id - Update driver
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, vehicle_number, vehicle_type, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE drivers 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           vehicle_number = COALESCE($4, vehicle_number),
           vehicle_type = COALESCE($5, vehicle_type),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, email, phone, vehicle_number, vehicle_type, is_active, updated_at`,
      [name, email, phone, vehicle_number, vehicle_type, is_active, id]
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

// DELETE /api/drivers/:id - Delete driver
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

// POST /api/drivers/update-location - Update driver's current location
router.post('/update-location', async (req, res) => {
  try {
    const { driverId, latitude, longitude } = req.body;
    
    if (!driverId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID, latitude, and longitude are required'
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

export default router;