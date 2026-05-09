import express from 'express';
import pool from '../config/database.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ CREATE tracking record (POST) - This was missing
router.post('/', protect, async (req, res) => {
  try {
    const { order_id, status, location, latitude, longitude } = req.body;
    
    console.log('📝 Creating tracking record:', { order_id, status, location });
    
    // Check if order exists
    const orderCheck = await pool.query('SELECT id FROM orders WHERE id = $1', [order_id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const result = await pool.query(
      `INSERT INTO tracking (order_id, status, location, latitude, longitude, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [order_id, status, location || status, latitude || null, longitude || null]
    );
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order_id}`).emit('tracking-update', {
        order_id,
        status,
        location: location || status,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating tracking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get tracking for a specific order
router.get('/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`📍 Tracking request for order: ${orderId} by user: ${userId} (${userRole})`);
    
    // Determine if orderId is numeric or string
    const isNumeric = /^\d+$/.test(orderId);
    let orderResult;
    
    try {
      if (userRole === 'admin') {
        if (isNumeric) {
          orderResult = await pool.query(
            'SELECT id, order_number, total_amount, status, driver_id, shipping_address, created_at FROM orders WHERE id = $1',
            [parseInt(orderId)]
          );
        } else {
          orderResult = await pool.query(
            'SELECT id, order_number, total_amount, status, driver_id, shipping_address, created_at FROM orders WHERE order_number = $1',
            [orderId]
          );
        }
      } else {
        if (isNumeric) {
          orderResult = await pool.query(
            'SELECT id, order_number, total_amount, status, driver_id, shipping_address, created_at FROM orders WHERE id = $1 AND user_id = $2',
            [parseInt(orderId), userId]
          );
        } else {
          orderResult = await pool.query(
            'SELECT id, order_number, total_amount, status, driver_id, shipping_address, created_at FROM orders WHERE order_number = $1 AND user_id = $2',
            [orderId, userId]
          );
        }
      }
    } catch (queryError) {
      console.error('Query error:', queryError);
      return res.status(500).json({ 
        success: false, 
        message: 'Database query failed',
        error: queryError.message
      });
    }
    
    if (!orderResult || orderResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found'
      });
    }
    
    const order = orderResult.rows[0];
    
    // Parse shipping address if it's JSON string
    if (order.shipping_address && typeof order.shipping_address === 'string') {
      try {
        order.shipping_address = JSON.parse(order.shipping_address);
      } catch (e) {
        order.shipping_address = { address: order.shipping_address };
      }
    }
    
    // Get driver name if driver assigned
    let driverName = null;
    if (order.driver_id) {
      try {
        const driverResult = await pool.query(
          'SELECT name FROM drivers WHERE id = $1',
          [order.driver_id]
        );
        if (driverResult.rows.length > 0) {
          driverName = driverResult.rows[0].name;
        }
      } catch (driverError) {
        console.error('Error fetching driver:', driverError);
      }
    }
    
    // Get tracking history
    let trackingRows = [];
    try {
      const trackingResult = await pool.query(
        `SELECT id, status, location, latitude, longitude, created_at 
         FROM tracking 
         WHERE order_id = $1 
         ORDER BY created_at DESC
         LIMIT 20`,
        [order.id]
      );
      trackingRows = trackingResult.rows;
    } catch (trackingError) {
      console.error('Error fetching tracking:', trackingError);
      trackingRows = [];
    }
    
    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          order_number: order.order_number,
          total_amount: parseFloat(order.total_amount),
          status: order.status,
          driver_name: driverName,
          driver_id: order.driver_id,
          shipping_address: order.shipping_address,
          created_at: order.created_at
        },
        tracking: trackingRows
      }
    });
    
  } catch (error) {
    console.error('Error in tracking route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update order status
router.put('/status/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, location } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`📦 Updating order ${orderId} status to: ${status}`);
    
    const isNumeric = /^\d+$/.test(orderId);
    let orderResult;
    
    if (userRole === 'admin') {
      if (isNumeric) {
        orderResult = await pool.query(
          'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, order_number, status',
          [status, parseInt(orderId)]
        );
      } else {
        orderResult = await pool.query(
          'UPDATE orders SET status = $1, updated_at = NOW() WHERE order_number = $2 RETURNING id, order_number, status',
          [status, orderId]
        );
      }
    } else {
      if (isNumeric) {
        orderResult = await pool.query(
          'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND driver_id = $3 RETURNING id, order_number, status',
          [status, parseInt(orderId), userId]
        );
      } else {
        orderResult = await pool.query(
          'UPDATE orders SET status = $1, updated_at = NOW() WHERE order_number = $2 AND driver_id = $3 RETURNING id, order_number, status',
          [status, orderId, userId]
        );
      }
    }
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or unauthorized' 
      });
    }
    
    const order = orderResult.rows[0];
    const actualOrderId = order.id;
    
    // Add tracking record
    await pool.query(
      `INSERT INTO tracking (order_id, driver_id, status, location, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [actualOrderId, userId, status, location || getStatusMessage(status)]
    );
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${actualOrderId}`).emit('order-status-update', {
        orderId: actualOrderId,
        status: status,
        location: location || getStatusMessage(status),
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: order,
      message: `Order status updated to ${status}`
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// Update driver location (Real-time)
router.post('/driver/location', protect, async (req, res) => {
  try {
    const { latitude, longitude, orderId } = req.body;
    const driverId = req.user.id;
    
    console.log(`📍 Driver ${driverId} location: ${latitude}, ${longitude}`);
    
    // Update driver location
    await pool.query(
      `UPDATE drivers 
       SET current_latitude = $1, current_longitude = $2, last_location_update = NOW() 
       WHERE id = $3`,
      [latitude, longitude, driverId]
    );
    
    // If driver is assigned to an order, update tracking
    if (orderId) {
      await pool.query(
        `INSERT INTO tracking (order_id, driver_id, status, latitude, longitude, created_at) 
         VALUES ($1, $2, (SELECT status FROM orders WHERE id = $1), $3, $4, NOW())`,
        [orderId, driverId, latitude, longitude]
      );
      
      // Emit real-time location to customer
      const io = req.app.get('io');
      if (io) {
        io.to(`order_${orderId}`).emit('driver-location', {
          driverId: driverId,
          latitude: latitude,
          longitude: longitude,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update location',
      error: error.message
    });
  }
});

// Helper function
function getStatusMessage(status) {
  const messages = {
    'pending': 'Order placed successfully',
    'confirmed': 'Your order has been confirmed',
    'processing': 'Order is being processed',
    'accepted': 'Restaurant has accepted your order',
    'picked_up': 'Driver has picked up your order',
    'in_transit': 'Your order is on the way',
    'out_for_delivery': 'Driver is out for delivery',
    'delivered': 'Order delivered successfully',
    'cancelled': 'Order has been cancelled'
  };
  return messages[status] || 'Order is being processed';
}

export default router;