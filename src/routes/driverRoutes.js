import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// ============ DRIVER LOCATION TRACKING ============

// Update driver location
router.post('/update-location', async (req, res) => {
  try {
    const { driverId, latitude, longitude, accuracy, status } = req.body;
    
    if (!driverId || !latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Driver ID, latitude, and longitude are required' 
      });
    }
    
    const query = `
      INSERT INTO driver_locations (driver_id, latitude, longitude, accuracy, status, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (driver_id) 
      DO UPDATE SET 
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [driverId, latitude, longitude, accuracy || null, status || 'active'];
    const result = await pool.query(query, values);
    
    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get driver location
router.get('/location/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const query = `
      SELECT driver_id, latitude, longitude, accuracy, status, updated_at
      FROM driver_locations
      WHERE driver_id = $1
    `;
    
    const result = await pool.query(query, [driverId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver location not found' 
      });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all active drivers
router.get('/active', async (req, res) => {
  try {
    const query = `
      SELECT dl.driver_id, dl.latitude, dl.longitude, dl.status, 
             dl.updated_at, d.name, d.phone, d.vehicle_number
      FROM driver_locations dl
      JOIN drivers d ON dl.driver_id = d.id
      WHERE dl.status = 'active' 
        AND dl.updated_at > NOW() - INTERVAL '5 minutes'
      ORDER BY dl.updated_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get active drivers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start delivery tracking
router.post('/start-tracking', async (req, res) => {
  try {
    const { driverId, orderId, startLatitude, startLongitude } = req.body;
    
    const query = `
      INSERT INTO delivery_tracking (driver_id, order_id, start_latitude, start_longitude, start_time)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    
    const values = [driverId, orderId, startLatitude, startLongitude];
    const result = await pool.query(query, values);
    
    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Tracking started successfully'
    });
  } catch (error) {
    console.error('Start tracking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update delivery tracking
router.post('/update-tracking', async (req, res) => {
  try {
    const { trackingId, latitude, longitude, distance, status } = req.body;
    
    const query = `
      UPDATE delivery_tracking
      SET current_latitude = $1,
          current_longitude = $2,
          total_distance = total_distance + $3,
          status = $4,
          last_update = NOW()
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [latitude, longitude, distance || 0, status, trackingId];
    const result = await pool.query(query, values);
    
    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Tracking updated successfully'
    });
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// End delivery tracking
router.post('/end-tracking', async (req, res) => {
  try {
    const { trackingId, endLatitude, endLongitude, totalDistance, totalTime } = req.body;
    
    const query = `
      UPDATE delivery_tracking
      SET end_latitude = $1,
          end_longitude = $2,
          total_distance = $3,
          total_time = $4,
          end_time = NOW(),
          status = 'completed'
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [endLatitude, endLongitude, totalDistance, totalTime, trackingId];
    const result = await pool.query(query, values);
    
    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Tracking ended successfully'
    });
  } catch (error) {
    console.error('End tracking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get driver's delivery history
router.get('/history/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { limit = 50 } = req.query;
    
    const query = `
      SELECT dt.*, o.customer_name, o.customer_address, o.total_amount
      FROM delivery_tracking dt
      JOIN orders o ON dt.order_id = o.id
      WHERE dt.driver_id = $1
      ORDER BY dt.start_time DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [driverId, parseInt(limit)]);
    
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create driver table (run this once)
router.post('/setup', async (req, res) => {
  try {
    // Create drivers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(100),
        vehicle_number VARCHAR(50),
        vehicle_type VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        rating DECIMAL(3,2) DEFAULT 5.00,
        total_deliveries INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create driver_locations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS driver_locations (
        driver_id INTEGER PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'offline',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create delivery_tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_tracking (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        start_latitude DECIMAL(10, 8),
        start_longitude DECIMAL(11, 8),
        current_latitude DECIMAL(10, 8),
        current_longitude DECIMAL(11, 8),
        end_latitude DECIMAL(10, 8),
        end_longitude DECIMAL(11, 8),
        total_distance DECIMAL(10, 2) DEFAULT 0,
        total_time INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        start_time TIMESTAMP DEFAULT NOW(),
        end_time TIMESTAMP,
        last_update TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    res.json({ success: true, message: 'Database tables created successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
