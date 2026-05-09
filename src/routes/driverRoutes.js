// // routes/driverRoutes.js - COMPLETE WORKING VERSION
// import express from 'express';
// import jwt from 'jsonwebtoken';
// import pool from '../config/database.js';
// import { sendOTPEmail } from '../services/emailService.js';
// import { saveOTP, verifyOTP } from '../utils/otpStore.js';

// const router = express.Router();

// // ==================== PROTECT MIDDLEWARE ====================
// const protect = async (req, res, next) => {
//   let token;
  
//   console.log('🔐 ===== AUTH MIDDLEWARE =====');
  
//   // Get token from headers
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     token = req.headers.authorization.split(' ')[1];
//     if (token && token.startsWith('"') && token.endsWith('"')) {
//       token = token.slice(1, -1);
//     }
//     console.log('📝 Token found:', token.substring(0, 30) + '...');
//   }
  
//   if (!token) {
//     console.log('❌ No token provided');
//     return res.status(401).json({ success: false, message: 'No token provided' });
//   }
  
//   try {
//     const secret = process.env.JWT_SECRET || 'my_super_secret_key_12345678';
//     const decoded = jwt.verify(token, secret);
//     console.log('✅ Token verified - ID:', decoded.id, 'Role:', decoded.role);
    
//     // Check if driver exists
//     const driver = await pool.query(
//       'SELECT id, name, email, phone, is_available, vehicle_number, vehicle_type FROM drivers WHERE id = $1',
//       [decoded.id]
//     );
    
//     if (driver.rows.length === 0) {
//       console.log('❌ Driver not found for ID:', decoded.id);
//       return res.status(401).json({ success: false, message: 'Driver not found' });
//     }
    
//     req.user = driver.rows[0];
//     console.log('✅ Driver authenticated:', req.user.name, 'ID:', req.user.id);
//     next();
//   } catch (error) {
//     console.error('❌ JWT Error:', error.message);
//     return res.status(401).json({ success: false, message: 'Invalid token' });
//   }
// };
// // routes/driverRoutes.js - Add these if missing
// router.get('/all', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT id, name, email, phone, vehicle_number, is_available FROM drivers');
//     res.json({ success: true, data: result.rows });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// router.get('/active', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT id, name, phone, vehicle_number FROM drivers WHERE is_available = true');
//     res.json({ success: true, data: result.rows });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// router.get('/inactive', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT id, name, phone, vehicle_number FROM drivers WHERE is_available = false');
//     res.json({ success: true, data: result.rows });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// router.get('/summary', async (req, res) => {
//   try {
//     const result = await pool.query(
//       `SELECT 
//         COUNT(*) as total,
//         COUNT(CASE WHEN is_available = true THEN 1 END) as active,
//         COUNT(CASE WHEN is_available = false THEN 1 END) as inactive
//        FROM drivers`
//     );
//     res.json({ success: true, data: result.rows[0] });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });
// // ==================== OTP ROUTES ====================

// // Send OTP
// // backend/routes/driverRoutes.js - Update send-otp endpoint

// router.post('/send-otp', async (req, res) => {
//   try {
//     const { email } = req.body;
    
//     console.log('📧 Send OTP request for:', email);
    
//     if (!email) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Email is required' 
//       });
//     }
    
//     // Check if driver exists
//     const driverResult = await pool.query(
//       'SELECT id, name, email FROM drivers WHERE email = $1',
//       [email]
//     );
    
//     if (driverResult.rows.length === 0) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Driver not found' 
//       });
//     }
    
//     const driver = driverResult.rows[0];
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
//     saveOTP(email, otp);
    
//     // Send email
//     const emailSent = await sendOTPEmail(email, otp, driver.name);
    
//     if (emailSent) {
//       // ✅ REMOVE devOTP from response
//       res.json({ 
//         success: true, 
//         message: 'OTP sent successfully to your email'
//       });
//     } else {
//       res.status(500).json({ 
//         success: false, 
//         message: 'Failed to send OTP email. Please try again.' 
//       });
//     }
    
//   } catch (error) {
//     console.error('Send OTP error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });

// // Verify OTP and Login
// router.post('/verify-otp', async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     console.log('🔐 Verify OTP for:', email);
    
//     if (!email || !otp) {
//       return res.status(400).json({ success: false, message: 'Email and OTP are required' });
//     }
    
//     const verification = verifyOTP(email, otp);
//     if (!verification.valid) {
//       return res.status(401).json({ success: false, message: verification.message });
//     }
    
//     const driverResult = await pool.query(
//       'SELECT id, name, email, phone, vehicle_number, vehicle_type, is_available FROM drivers WHERE email = $1',
//       [email]
//     );
    
//     if (driverResult.rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'Driver not found' });
//     }
    
//     const driver = driverResult.rows[0];
//     console.log('✅ Driver found:', driver.name, 'ID:', driver.id);
    
//     // Generate token with driver ID
//     const token = jwt.sign(
//       { id: driver.id, role: 'driver' },
//       process.env.JWT_SECRET || 'my_super_secret_key_12345678',
//       { expiresIn: '30d' }
//     );
    
//     res.json({
//       success: true,
//       token,
//       user: {
//         id: driver.id,
//         name: driver.name,
//         email: driver.email,
//         phone: driver.phone,
//         role: 'driver',
//         vehicle_number: driver.vehicle_number,
//         vehicle_type: driver.vehicle_type,
//         is_available: driver.is_available
//       }
//     });
//   } catch (error) {
//     console.error('Verify OTP error:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });

// // ==================== EARNINGS ROUTE ====================
// router.get('/earnings', protect, async (req, res) => {
//   try {
//     const driverId = req.user.id;
//     console.log('💰 Earnings request for driver ID:', driverId);
//     console.log('💰 Driver name:', req.user.name);
    
//     // Get today's date boundaries
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const weekStart = new Date(today);
//     weekStart.setDate(today.getDate() - today.getDay());
    
//     const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
//     // Get total earnings
//     const totalRes = await pool.query(
//       `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
//        FROM orders 
//        WHERE driver_id = $1 AND status = 'delivered'`,
//       [driverId]
//     );
    
//     // Get today's earnings
//     const todayRes = await pool.query(
//       `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
//        FROM orders 
//        WHERE driver_id = $1 AND status = 'delivered' 
//        AND DATE(updated_at) = CURRENT_DATE`,
//       [driverId]
//     );
    
//     // Get weekly earnings
//     const weekRes = await pool.query(
//       `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
//        FROM orders 
//        WHERE driver_id = $1 AND status = 'delivered' 
//        AND updated_at >= $2`,
//       [driverId, weekStart]
//     );
    
//     // Get monthly earnings
//     const monthRes = await pool.query(
//       `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
//        FROM orders 
//        WHERE driver_id = $1 AND status = 'delivered' 
//        AND updated_at >= $2`,
//       [driverId, monthStart]
//     );
    
//     const earningsData = {
//       total: parseFloat(totalRes.rows[0].total),
//       total_deliveries: parseInt(totalRes.rows[0].count),
//       today: parseFloat(todayRes.rows[0].total),
//       today_count: parseInt(todayRes.rows[0].count),
//       week: parseFloat(weekRes.rows[0].total),
//       week_count: parseInt(weekRes.rows[0].count),
//       month: parseFloat(monthRes.rows[0].total),
//       month_count: parseInt(monthRes.rows[0].count)
//     };
    
//     console.log('💰 Earnings data:', earningsData);
    
//     res.json({ success: true, data: earningsData });
//   } catch (error) {
//     console.error('Earnings error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // ==================== OTHER ROUTES ====================
// router.get('/available-orders', protect, async (req, res) => {
//   try {
//     console.log('📋 Available orders for driver:', req.user.id);
    
//     const result = await pool.query(
//       `SELECT id, order_number, total_amount, status, shipping_address, created_at 
//        FROM orders 
//        WHERE status = 'pending' AND driver_id IS NULL
//        ORDER BY created_at ASC`
//     );
    
//     res.json({ success: true, data: result.rows });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });
// // ✅ Set driver availability (ONLINE/OFFLINE) - POST method
// router.post('/availability', protect, async (req, res) => {
//   try {
//     const driverId = req.user.id;
//     const { isAvailable } = req.body;
    
//     console.log(`🔄 Updating driver ${driverId} availability to: ${isAvailable}`);
    
//     const result = await pool.query(
//       'UPDATE drivers SET is_available = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_available',
//       [isAvailable, driverId]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'Driver not found' });
//     }
    
//     res.json({ 
//       success: true, 
//       message: isAvailable ? 'You are now online' : 'You are now offline',
//       data: result.rows[0]
//     });
//   } catch (error) {
//     console.error('Error updating availability:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });
// // backend/routes/driverRoutes.js - Update my-orders endpoint

// // Get my orders (assigned to this driver)
// router.get('/my-orders', protect, async (req, res) => {
//   try {
//     const driverId = req.user.id;
//     console.log('📋 Fetching my orders for driver:', driverId);
    
//     // Get ALL orders assigned to this driver, regardless of status
//     const result = await pool.query(
//       `SELECT 
//         o.id, 
//         o.order_number, 
//         o.total_amount, 
//         o.status, 
//         o.shipping_address, 
//         o.created_at,
//         o.payment_method,
//         o.payment_status,
//         COALESCE(u.name, 'Guest User') as customer_name
//        FROM orders o
//        LEFT JOIN users u ON o.user_id = u.id
//        WHERE o.driver_id = $1
//        ORDER BY o.created_at DESC`,
//       [driverId]
//     );
    
//     console.log(`✅ Found ${result.rows.length} orders for driver ${driverId}`);
    
//     const orders = result.rows.map(order => ({
//       ...order,
//       shipping_address: typeof order.shipping_address === 'string' ? 
//         JSON.parse(order.shipping_address) : order.shipping_address,
//       total_amount: parseFloat(order.total_amount)
//     }));
    
//     res.json({ success: true, data: orders });
//   } catch (error) {
//     console.error('Error fetching my orders:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // backend/routes/driverRoutes.js - Add this endpoint

// // ✅ Update order status
// router.put('/order/:orderId/status', protect, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status } = req.body;
//     const driverId = req.user.id;
    
//     console.log(`📦 Updating order ${orderId} status to: ${status} for driver: ${driverId}`);
    
//     // Check if order belongs to this driver
//     const orderCheck = await pool.query(
//       'SELECT id, status FROM orders WHERE id = $1 AND driver_id = $2',
//       [orderId, driverId]
//     );
    
//     if (orderCheck.rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
//     }
    
//     // Update order status
//     const result = await pool.query(
//       `UPDATE orders 
//        SET status = $1, updated_at = NOW() 
//        WHERE id = $2 AND driver_id = $3
//        RETURNING *`,
//       [status, orderId, driverId]
//     );
    
//     // Add tracking record
//     await pool.query(
//       `INSERT INTO tracking (order_id, driver_id, status, location, created_at) 
//        VALUES ($1, $2, $3, $4, NOW())`,
//       [orderId, driverId, status, status]
//     );
    
//     res.json({ 
//       success: true, 
//       message: `Order status updated to ${status}`,
//       data: result.rows[0]
//     });
//   } catch (error) {
//     console.error('Error updating order status:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });
// // routes/driverRoutes.js - Update the order details route
// router.get('/order/:orderId', protect, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const driverId = req.user.id;
    
//     console.log('📦 Fetching order details - Order ID:', orderId, 'Driver ID:', driverId);
    
//     // First check if order exists and belongs to this driver
//     const orderCheck = await pool.query(
//       `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
//        FROM orders o
//        LEFT JOIN users u ON o.user_id = u.id
//        WHERE o.id = $1 AND o.driver_id = $2`,
//       [orderId, driverId]
//     );
    
//     if (orderCheck.rows.length === 0) {
//       // Check if order exists but assigned to different driver
//       const anyOrder = await pool.query(
//         'SELECT id, driver_id FROM orders WHERE id = $1',
//         [orderId]
//       );
      
//       if (anyOrder.rows.length === 0) {
//         return res.status(404).json({ success: false, message: 'Order not found' });
//       } else if (anyOrder.rows[0].driver_id !== driverId) {
//         return res.status(403).json({ success: false, message: 'This order is not assigned to you' });
//       }
      
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }
    
//     const order = orderCheck.rows[0];
    
//     // Parse JSON fields
//     order.products = typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []);
//     order.shipping_address = typeof order.shipping_address === 'string' ? 
//       JSON.parse(order.shipping_address) : (order.shipping_address || {});
    
//     res.json({ success: true, data: order });
//   } catch (error) {
//     console.error('Error fetching order details:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });
// // Admin routes
// router.get('/all', async (req, res) => {
//   try {
//     const result = await pool.query(
//       'SELECT id, name, email, phone, vehicle_number, vehicle_type, is_available FROM drivers ORDER BY id'
//     );
//     res.json({ success: true, data: result.rows });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// export default router;

// backend/routes/driverRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendOTPEmail } from '../services/emailService.js';
import { saveOTP, verifyOTP } from '../utils/otpStore.js';

const router = express.Router();

// ==================== OTP ROUTES ====================
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const driverResult = await pool.query('SELECT id, name, email FROM drivers WHERE email = $1', [email]);
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    const driver = driverResult.rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    saveOTP(email, otp);
    await sendOTPEmail(email, otp, driver.name);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const verification = verifyOTP(email, otp);
    if (!verification.valid) {
      return res.status(401).json({ success: false, message: verification.message });
    }
    const driverResult = await pool.query(
      'SELECT id, name, email, phone, vehicle_number, vehicle_type, is_available FROM drivers WHERE email = $1',
      [email]
    );
    const driver = driverResult.rows[0];
    const token = jwt.sign(
      { id: driver.id, role: 'driver' },
      process.env.JWT_SECRET || 'my_super_secret_key_12345678',
      { expiresIn: '30d' }
    );
    res.json({ success: true, token, user: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// backend/routes/driverRoutes.js - Add this endpoint

// ✅ Get all drivers (for admin panel)
router.get('/all', async (req, res) => {
  try {
    console.log('📋 Fetching all drivers');
    
    const result = await pool.query(
      `SELECT id, name, email, phone, vehicle_number, vehicle_type, is_available, created_at 
       FROM drivers 
       ORDER BY id DESC`
    );
    
    res.json({ 
      success: true, 
      data: result.rows, 
      total: result.rows.length 
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ==================== DRIVER APP ROUTES ====================

// Get available orders
router.get('/available-orders', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, order_number, total_amount, status, shipping_address, created_at 
       FROM orders 
       WHERE status = 'pending' AND driver_id IS NULL
       ORDER BY created_at ASC`
    );
    const orders = result.rows.map(order => ({
      ...order,
      shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address
    }));
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const driverId = req.user.id;
    const result = await pool.query(
      `SELECT o.*, COALESCE(u.name, 'Guest User') as customer_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.driver_id = $1
       ORDER BY o.created_at DESC`,
      [driverId]
    );
    const orders = result.rows.map(order => ({
      ...order,
      shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address,
      products: typeof order.products === 'string' ? JSON.parse(order.products) : order.products
    }));
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Accept order
// backend/routes/driverRoutes.js - Accept order with delivery fee

router.put('/accept-order/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.id;
    
    // You can set delivery fee based on distance or fixed amount
    // Example: Fixed delivery fee of ₹40 per order
    const deliveryFee = 40;
    
    const result = await pool.query(
      `UPDATE orders 
       SET driver_id = $1, 
           status = 'accepted', 
           delivery_fee = $2,
           updated_at = NOW() 
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [driverId, deliveryFee, orderId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found or already accepted' });
    }
    
    res.json({ success: true, message: 'Order accepted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get order details
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.id;
    const result = await pool.query(
      `SELECT o.*, COALESCE(u.name, 'Guest User') as customer_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1 AND o.driver_id = $2`,
      [orderId, driverId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = result.rows[0];
    order.products = typeof order.products === 'string' ? JSON.parse(order.products) : (order.products || []);
    order.shipping_address = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {});
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ UPDATE ORDER STATUS - ADD THIS ENDPOINT
router.put('/order/:orderId/status', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const driverId = req.user.id;
    
    console.log(`📦 Updating order ${orderId} status to: ${status}`);
    
    const result = await pool.query(
      `UPDATE orders 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND driver_id = $3
       RETURNING *`,
      [status, orderId, driverId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, message: `Order ${status}` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Set availability
router.post('/availability', protect, async (req, res) => {
  try {
    const driverId = req.user.id;
    const { isAvailable } = req.body;
    await pool.query('UPDATE drivers SET is_available = $1 WHERE id = $2', [isAvailable, driverId]);
    res.json({ success: true, message: isAvailable ? 'Online' : 'Offline' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get earnings
// backend/routes/driverRoutes.js - Updated earnings endpoint

// Get driver earnings (based on delivery fee, not order total)
router.get('/earnings', protect, async (req, res) => {
  try {
    const driverId = req.user.id;
    
    // Get current date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // ✅ Calculate earnings based on delivery_fee, not total_amount
    const totalResult = await pool.query(
      `SELECT 
        COALESCE(SUM(delivery_fee), 0) as total,
        COUNT(*) as count
       FROM orders 
       WHERE driver_id = $1 AND status = 'delivered'`,
      [driverId]
    );
    
    const todayResult = await pool.query(
      `SELECT 
        COALESCE(SUM(delivery_fee), 0) as total,
        COUNT(*) as count
       FROM orders 
       WHERE driver_id = $1 
       AND status = 'delivered' 
       AND DATE(updated_at) = CURRENT_DATE`,
      [driverId]
    );
    
    const weekResult = await pool.query(
      `SELECT 
        COALESCE(SUM(delivery_fee), 0) as total,
        COUNT(*) as count
       FROM orders 
       WHERE driver_id = $1 
       AND status = 'delivered' 
       AND updated_at >= $2`,
      [driverId, weekStart]
    );
    
    const monthResult = await pool.query(
      `SELECT 
        COALESCE(SUM(delivery_fee), 0) as total,
        COUNT(*) as count
       FROM orders 
       WHERE driver_id = $1 
       AND status = 'delivered' 
       AND updated_at >= $2`,
      [driverId, monthStart]
    );
    
    res.json({
      success: true,
      data: {
        total: parseFloat(totalResult.rows[0].total),
        total_deliveries: parseInt(totalResult.rows[0].count),
        today: parseFloat(todayResult.rows[0].total),
        today_count: parseInt(todayResult.rows[0].count),
        week: parseFloat(weekResult.rows[0].total),
        week_count: parseInt(weekResult.rows[0].count),
        month: parseFloat(monthResult.rows[0].total),
        month_count: parseInt(monthResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Earnings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;