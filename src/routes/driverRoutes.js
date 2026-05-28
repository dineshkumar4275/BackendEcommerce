import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// ============ TEST ROUTE ============
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Driver routes are working!'
  });
});

// ============ GET ALL DRIVERS ============
router.get('/', async (req, res) => {
  try {
    console.log('📦 Fetching all drivers...');
    
    const query = `
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
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      message: 'Drivers fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ GET ALL DRIVERS (ALTERNATIVE ENDPOINT) ============
router.get('/all', async (req, res) => {
  try {
    console.log('📦 Fetching all drivers (/all endpoint)...');
    
    const query = `
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
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      message: 'Drivers fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ CREATE DRIVER ============
router.post('/create', async (req, res) => {
  try {
    console.log('📝 Creating new driver...');
    console.log('Request body:', req.body);
    
    const {
      name,
      email,
      phone,
      vehicle_number,
      vehicle_type
    } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required fields'
      });
    }
    
    // Check if driver already exists
    const existingDriver = await pool.query(
      'SELECT id FROM drivers WHERE phone = $1 OR email = $2',
      [phone, email]
    );
    
    if (existingDriver.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Driver with this phone or email already exists'
      });
    }
    
    // Insert new driver
    const result = await pool.query(
      `INSERT INTO drivers (name, email, phone, vehicle_number, vehicle_type, is_active, rating, total_deliveries)
       VALUES ($1, $2, $3, $4, $5, true, 5.0, 0)
       RETURNING *`,
      [name, email || null, phone, vehicle_number || null, vehicle_type || 'bike']
    );
    
    console.log('✅ Driver created:', result.rows[0]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Driver created successfully'
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ GET ACTIVE DRIVERS ============
router.get('/active', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        phone,
        vehicle_number,
        vehicle_type,
        rating,
        current_latitude,
        current_longitude,
        last_location_update
      FROM drivers
      WHERE is_active = true
        AND current_latitude IS NOT NULL
        AND last_location_update > NOW() - INTERVAL '5 minutes'
      ORDER BY last_location_update DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching active drivers:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ GET DRIVER BY ID ============
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
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
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
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
    console.error('Error fetching driver:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ UPDATE DRIVER LOCATION ============
router.post('/update-location', async (req, res) => {
  try {
    const { driverId, latitude, longitude, orderId } = req.body;
    
    console.log('📍 Updating location for driver:', driverId);
    console.log('📍 Location:', { latitude, longitude });
    
    if (!driverId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID, latitude, and longitude are required'
      });
    }
    
    // Check if driver exists
    const driverCheck = await pool.query(
      'SELECT id FROM drivers WHERE id = $1',
      [driverId]
    );
    
    if (driverCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Update driver location
    await pool.query(
      `UPDATE drivers 
       SET current_latitude = $1,
           current_longitude = $2,
           last_location_update = NOW()
       WHERE id = $3`,
      [latitude, longitude, driverId]
    );
    
    // If orderId is provided, emit socket event
    if (orderId) {
      const io = req.app.get('io');
      if (io) {
        io.to(`order_${orderId}`).emit('driver-location-update', {
          driverId,
          latitude,
          longitude,
          timestamp: new Date()
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: { driverId, latitude, longitude }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ GET DRIVER LOCATION ============
router.get('/location/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        id,
        current_latitude as latitude,
        current_longitude as longitude,
        last_location_update as updated_at
       FROM drivers
       WHERE id = $1`,
      [driverId]
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
    console.error('Error getting driver location:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ UPDATE DRIVER STATUS ============
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE drivers 
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [is_active, id]
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
      message: `Driver ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ DELETE DRIVER ============
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
    console.error('Error deleting driver:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
