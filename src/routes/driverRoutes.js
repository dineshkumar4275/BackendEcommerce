import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// ============ POST /api/drivers - Create driver (Alternative to /create) ============
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/drivers - Creating driver');
    console.log('Request body:', req.body);
    
    const { name, email, phone, vehicle_number, vehicle_type, is_available } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required fields'
      });
    }
    
    // Check if driver exists
    const existingDriver = await pool.query(
      'SELECT id FROM drivers WHERE phone = $1',
      [phone]
    );
    
    if (existingDriver.rows.length > 0) {
      return res.status(400).json({
        success: false,
<<<<<<< HEAD
        message: 'Driver with this phone already exists'
=======
        message: 'Driver not found'
>>>>>>> a429dcfe3acf92dbf9b34a02bda7f05cf9148bf4
      });
    }
    
    // Insert driver
    const result = await pool.query(
      `INSERT INTO drivers (name, email, phone, vehicle_number, vehicle_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email || null, phone, vehicle_number || null, vehicle_type || 'bike', is_available !== false]
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

// ============ GET /api/drivers - List all routes ============
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Driver API is working',
    endpoints: {
      GET: {
        '/': 'List all driver endpoints',
        '/all': 'Get all drivers',
        '/active': 'Get active drivers',
        '/:id': 'Get driver by ID'
      },
      POST: {
        '/': 'Create new driver',
        '/create': 'Create new driver (alternative)',
        '/update-location': 'Update driver location'
      }
    }
  });
});

// ============ GET /api/drivers/all - Get all drivers ============
router.get('/all', async (req, res) => {
  try {
    console.log('📦 Fetching all drivers...');
    
    const result = await pool.query(`
      SELECT id, name, email, phone, vehicle_number, vehicle_type,
             is_active, rating, total_deliveries, created_at
      FROM drivers
      ORDER BY id DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ POST /api/drivers/create - Create driver ============
router.post('/create', async (req, res) => {
  try {
    console.log('📝 POST /api/drivers/create - Creating driver');
    console.log('Request body:', req.body);
    
    const { name, email, phone, vehicle_number, vehicle_type, is_available } = req.body;
    
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
        message: 'Driver with this phone already exists'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO drivers (name, email, phone, vehicle_number, vehicle_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email || null, phone, vehicle_number || null, vehicle_type || 'bike', is_available !== false]
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

// ============ GET /api/drivers/:id - Get driver by ID ============
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM drivers WHERE id = $1',
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ PUT /api/drivers/:id - Update driver ============
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
       RETURNING *`,
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ DELETE /api/drivers/:id - Delete driver ============
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

// ============ POST /api/drivers/update-location ============
router.post('/update-location', async (req, res) => {
  try {
    const { driverId, latitude, longitude } = req.body;
    
    await pool.query(
      `UPDATE drivers 
       SET current_latitude = $1, current_longitude = $2, last_location_update = NOW()
       WHERE id = $3`,
      [latitude, longitude, driverId]
    );
    
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

export default router;