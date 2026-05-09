import express from 'express';
import pool from '../config/database.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Create new order (Public - for checkout, no auth required)
// In orderRoutes.js - POST endpoint (public, no auth required)
// backend/routes/orderRoutes.js - Update the POST endpoint
router.post('/', async (req, res) => {
  try {
    const {
      order_number,
      total_amount,
      shipping_address,
      products,
      status,
      payment_method,
      payment_status,
      user_id
    } = req.body;
    
    console.log('📝 Creating order:', { order_number, total_amount });
    
    // ✅ Ensure status is 'pending' and driver_id is NULL for new orders
    const result = await pool.query(
      `INSERT INTO orders (
        order_number, total_amount, shipping_address, products, 
        status, payment_method, payment_status, user_id, driver_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [
        order_number,
        total_amount,
        JSON.stringify(shipping_address),
        JSON.stringify(products),
        'pending',  // ✅ Always 'pending' for new orders
        payment_method || 'cod',
        payment_status || 'pending',
        user_id || null,
        null  // ✅ driver_id is NULL initially
      ]
    );
    
    console.log('✅ Order saved:', result.rows[0].order_number, 'Status:', result.rows[0].status);
    
    // Emit socket event for real-time notification to drivers
    const io = req.app.get('io');
    if (io) {
      io.emit('new-order-available', { 
        order: result.rows[0],
        message: 'New order available for delivery'
      });
    }
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ✅ Get orders by driver_id
router.get('/', async (req, res) => {
  try {
    const { driver_id } = req.query;
    let query;
    let params;
    
    if (driver_id) {
      query = `SELECT o.*, u.name as customer_name 
               FROM orders o 
               LEFT JOIN users u ON o.user_id = u.id 
               WHERE o.driver_id = $1 
               ORDER BY o.created_at DESC`;
      params = [driver_id];
    } else {
      query = `SELECT o.*, u.name as customer_name 
               FROM orders o 
               LEFT JOIN users u ON o.user_id = u.id 
               ORDER BY o.created_at DESC`;
      params = [];
    }
    
    const result = await pool.query(query, params);
    
    const orders = result.rows.map(order => ({
      ...order,
      products: typeof order.products === 'string' ? JSON.parse(order.products) : order.products,
      shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address
    }));
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ✅ Get recent orders (for dashboard)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await pool.query(
      `SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at, 
              u.name as customer_name, u.email as customer_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    const orders = result.rows.map(order => ({
      ...order,
      products: typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []),
      shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {})
    }));
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ✅ Get all orders (Admin only)
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    
    const orders = result.rows.map(order => ({
      ...order,
      products: typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []),
      shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {})
    }));
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get user's own orders (Customer)
router.get('/myorders', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Fetching orders for user:', userId);
    
    const result = await pool.query(
      `SELECT id, order_number, total_amount, status, shipping_address, products, created_at, payment_method
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    const orders = result.rows.map(order => ({
      ...order,
      products: typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []),
      shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {})
    }));
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get single order by ID (Admin or Owner)
router.get('/:identifier', protect, async (req, res) => {
  try {
    const { identifier } = req.params;
    const userId = req.user.id;
    const isAdminUser = req.user.role === 'admin';
    
    console.log('Fetching order:', identifier, 'for user:', userId);
    
    let result;
    
    // Try by order_number first
    if (isAdminUser) {
      result = await pool.query(
        'SELECT * FROM orders WHERE order_number = $1',
        [identifier]
      );
      
      if (result.rows.length === 0 && !isNaN(parseInt(identifier))) {
        result = await pool.query(
          'SELECT * FROM orders WHERE id = $1',
          [parseInt(identifier)]
        );
      }
    } else {
      result = await pool.query(
        'SELECT * FROM orders WHERE order_number = $1 AND user_id = $2',
        [identifier, userId]
      );
      
      if (result.rows.length === 0 && !isNaN(parseInt(identifier))) {
        result = await pool.query(
          'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
          [parseInt(identifier), userId]
        );
      }
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found',
        data: null 
      });
    }
    
    const order = result.rows[0];
    order.products = typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []);
    order.shipping_address = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {});
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Update order status (Admin or Assigned Driver)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, driver_id } = req.body;
    const userId = req.user.id;
    const isAdminUser = req.user.role === 'admin';
    
    // Check authorization
    let order;
    if (isAdminUser) {
      order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    } else {
      order = await pool.query('SELECT * FROM orders WHERE id = $1 AND driver_id = $2', [id, userId]);
    }
    
    if (order.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }
    
    let updateQuery = 'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2';
    let params = [status, id];
    
    if (driver_id && isAdminUser) {
      // Get driver name
      const driverResult = await pool.query('SELECT name FROM drivers WHERE id = $1', [driver_id]);
      const driverName = driverResult.rows[0]?.name || null;
      updateQuery = 'UPDATE orders SET status = $1, driver_id = $2, driver_name = $3, updated_at = NOW() WHERE id = $4';
      params = [status, driver_id, driverName, id];
    }
    
    const result = await pool.query(updateQuery, params);
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit(`order-status-update-${id}`, { orderId: id, status });
    }
    
    res.json({ success: true, data: result.rows[0], message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// routes/orderRoutes.js - Fix the assign driver endpoint
router.post('/assign', protect, isAdmin, async (req, res) => {
  try {
    const { orderId, driverId } = req.body;
    
    console.log('📝 Assigning driver:', { orderId, driverId });
    
    // Check if order exists
    const orderCheck = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Check if driver exists
    const driverResult = await pool.query(
      'SELECT id, name, is_available FROM drivers WHERE id = $1', 
      [driverId]
    );
    
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    const driver = driverResult.rows[0];
    
    // Allow assigning even if driver is not available (force assign)
    // Or show warning but still allow
    if (!driver.is_available) {
      console.log(`⚠️ Driver ${driver.name} is offline, but assigning anyway`);
      // Option 1: Still assign but warn
      // Option 2: Reject with message
      // Choose one:
      
      // Option 1: Still assign (comment out the return below)
      // Option 2: Reject with message (uncomment below)
      /*
      return res.status(400).json({ 
        success: false, 
        message: 'Driver is offline. Please make driver online first or select another driver.' 
      });
      */
    }
    
    // Update order with driver (force assign even if offline)
    const result = await pool.query(
      `UPDATE orders 
       SET driver_id = $1, driver_name = $2, status = 'accepted', updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [driverId, driver.name, orderId]
    );
    
    // Optionally update driver to available after assignment
    await pool.query('UPDATE drivers SET is_available = true WHERE id = $1', [driverId]);
    
    res.json({ 
      success: true, 
      data: result.rows[0], 
      message: `Driver ${driver.name} assigned successfully` 
    });
    
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// routes/orderRoutes.js - Add this endpoint for user orders

// ✅ Get user orders for customer app
router.get('/my-orders', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📋 Fetching orders for user:', userId);
    
    const result = await pool.query(
      `SELECT id, order_number, total_amount, status, shipping_address, products, 
              created_at, payment_method, driver_name
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    const orders = result.rows.map(order => ({
      id: order.id,
      order_number: order.order_number,
      total_amount: parseFloat(order.total_amount),
      status: order.status,
      shipping_address: typeof order.shipping_address === 'string' ? 
        JSON.parse(order.shipping_address) : order.shipping_address,
      products: typeof order.products === 'string' ? 
        JSON.parse(order.products) : (order.products || []),
      created_at: order.created_at,
      payment_method: order.payment_method,
      driver_name: order.driver_name
    }));
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get single order by ID for user
router.get('/order/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
              d.name as driver_name, d.phone as driver_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN drivers d ON o.driver_id = d.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const order = result.rows[0];
    order.products = typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []);
    order.shipping_address = typeof order.shipping_address === 'string' ? 
      JSON.parse(order.shipping_address) : (order.shipping_address || {});
    
    // Get tracking history
    const tracking = await pool.query(
      `SELECT status, location, created_at 
       FROM tracking 
       WHERE order_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );
    
    res.json({ 
      success: true, 
      data: { order, tracking: tracking.rows } 
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Track order by order number (public - for order tracking)
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const result = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
              u.name as customer_name, d.name as driver_name, d.phone as driver_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN drivers d ON o.driver_id = d.id
       WHERE o.order_number = $1`,
      [orderNumber]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const tracking = await pool.query(
      `SELECT status, location, created_at 
       FROM tracking 
       WHERE order_id = $1 
       ORDER BY created_at ASC`,
      [result.rows[0].id]
    );
    
    res.json({ 
      success: true, 
      data: { order: result.rows[0], tracking: tracking.rows } 
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ✅ Get driver's assigned orders
router.get('/driver/orders', protect, async (req, res) => {
  try {
    const driverId = req.user.id;
    
    const result = await pool.query(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone 
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.driver_id = $1
       ORDER BY o.created_at DESC`,
      [driverId]
    );
    
    const orders = result.rows.map(order => ({
      ...order,
      products: typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []),
      shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {})
    }));
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching driver orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Delete order (Admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if order exists
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (order.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Delete order
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;