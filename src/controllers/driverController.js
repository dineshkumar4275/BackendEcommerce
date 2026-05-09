import pool from '../config/database.js';

// Update driver location (called from driver app)
export const updateDriverLocation = async (req, res) => {
  try {
    const { driverId, latitude, longitude, orderId } = req.body;
    
    // Update driver location
    await pool.query(
      `UPDATE drivers SET 
        current_latitude = $1, 
        current_longitude = $2, 
        last_location_update = NOW() 
       WHERE id = $3`,
      [latitude, longitude, driverId]
    );
    
    // If driver is on an order, update tracking
    if (orderId) {
      await pool.query(
        `INSERT INTO tracking (order_id, driver_id, status, latitude, longitude, created_at) 
         VALUES ($1, $2, 'in_transit', $3, $4, NOW())`,
        [orderId, driverId, latitude, longitude]
      );
    }
    
    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get order with driver location (for user tracking)
export const getOrderWithDriverLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await pool.query(
      `SELECT o.*, 
        d.name as driver_name, d.phone as driver_phone, d.vehicle_number,
        d.current_latitude, d.current_longitude, d.last_location_update,
        COALESCE(json_agg(json_build_object(
          'status', t.status,
          'location', t.location,
          'time', t.created_at
        )) FILTER (WHERE t.id IS NOT NULL), '[]') as tracking_history
       FROM orders o
       LEFT JOIN drivers d ON o.driver_id = d.id
       LEFT JOIN tracking t ON o.id = t.order_id
       WHERE o.id = $1
       GROUP BY o.id, d.name, d.phone, d.vehicle_number, d.current_latitude, d.current_longitude, d.last_location_update`,
      [orderId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};