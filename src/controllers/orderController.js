const pool = require('../config/database');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');

// ============================================
// REAL-TIME PUSH NOTIFICATION FUNCTION
// ============================================
const sendRealTimePushNotification = async (expoPushToken, orderData, type = 'new_order') => {
  if (!expoPushToken) return null;
  
  let title, body;
  
  if (type === 'new_order') {
    title = '📦 New Order Available!';
    body = `Order #${orderData.order_number} - ₹${orderData.total_amount}`;
  } else if (type === 'order_accepted') {
    title = '✅ Order Accepted';
    body = `Order #${orderData.order_number} has been accepted`;
  } else if (type === 'status_update') {
    title = '🔄 Order Status Updated';
    body = `Order #${orderData.order_number} is now ${orderData.status}`;
  } else {
    title = '🔔 Order Update';
    body = `Update for order #${orderData.order_number}`;
  }
  
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { 
      type: type,
      orderId: orderData.id,
      orderNumber: orderData.order_number,
      amount: orderData.total_amount,
      status: orderData.status,
      timestamp: new Date().toISOString()
    },
    priority: 'high',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const result = await response.json();
    
    if (result.data && result.data.status === 'ok') {
      console.log(`✅ Real-time notification sent successfully`);
      return { success: true };
    } else {
      console.log(`❌ Notification failed:`, result.errors);
      return { success: false, error: result.errors };
    }
  } catch (error) {
    console.error('❌ Notification error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// GET ALL AVAILABLE DRIVERS WITH PUSH TOKENS
// ============================================
const getAvailableDriversWithTokens = async () => {
  try {
    const result = await pool.query(`
      SELECT id, name, push_token, is_available 
      FROM drivers 
      WHERE is_available = true 
      AND push_token IS NOT NULL 
      AND push_token != ''
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
};

// ============================================
// CREATE ORDER (WITH REAL-TIME NOTIFICATIONS)
// ============================================
const createOrder = async (req, res) => {
    try {
        const { products, total_amount, shipping_address } = req.body;
        const order_number = 'ORD' + Date.now();
        
        const razorpayOrder = await razorpay.orders.create({
            amount: total_amount * 100,
            currency: 'INR',
            receipt: order_number,
        });
        
        const result = await pool.query(
            'INSERT INTO orders (user_id, order_number, total_amount, razorpay_order_id, shipping_address, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, order_number, total_amount, razorpayOrder.id, shipping_address, 'pending']
        );
        
        const newOrder = result.rows[0];
        
        // 🚀🚀🚀 REAL-TIME: Send notifications to all available drivers
        console.log(`📢 New order created: #${newOrder.order_number}`);
        
        const availableDrivers = await getAvailableDriversWithTokens();
        console.log(`📢 Found ${availableDrivers.length} available drivers`);
        
        // Send real-time notification to each driver
        const notificationResults = [];
        for (const driver of availableDrivers) {
            if (driver.push_token) {
                const result = await sendRealTimePushNotification(driver.push_token, newOrder, 'new_order');
                notificationResults.push({ driverId: driver.id, success: result.success });
                console.log(`📱 Notification sent to driver ${driver.id}: ${result.success ? '✅' : '❌'}`);
            }
        }
        
        res.json({
            order: newOrder,
            razorpayOrder,
            notifications_sent: notificationResults.filter(r => r.success).length,
            total_drivers_notified: availableDrivers.length
        });
        
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// VERIFY PAYMENT (WITH REAL-TIME NOTIFICATIONS)
// ============================================
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');
        
        if (expectedSignature === razorpay_signature) {
            const result = await pool.query(
                'UPDATE orders SET payment_id = $1, status = $2 WHERE razorpay_order_id = $3 RETURNING *',
                [razorpay_payment_id, 'confirmed', razorpay_order_id]
            );
            
            const confirmedOrder = result.rows[0];
            
            // 🚀 REAL-TIME: Notify drivers about confirmed order
            const availableDrivers = await getAvailableDriversWithTokens();
            for (const driver of availableDrivers) {
                await sendRealTimePushNotification(driver.push_token, confirmedOrder, 'new_order');
            }
            
            res.json({ success: true, message: 'Payment verified successfully', order: confirmedOrder });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// GET USER ORDERS
// ============================================
const getUserOrders = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// GET ALL ORDERS
// ============================================
const getAllOrders = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// UPDATE ORDER STATUS (WITH REAL-TIME NOTIFICATIONS)
// ============================================
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const updatedOrder = result.rows[0];
        
        // 🚀 REAL-TIME: Notify the assigned driver about status change
        if (updatedOrder.driver_id) {
            const driverResult = await pool.query(
                'SELECT push_token FROM drivers WHERE id = $1 AND push_token IS NOT NULL',
                [updatedOrder.driver_id]
            );
            
            if (driverResult.rows[0]?.push_token) {
                await sendRealTimePushNotification(
                    driverResult.rows[0].push_token, 
                    updatedOrder, 
                    'status_update'
                );
                console.log(`📱 Status update notification sent to driver ${updatedOrder.driver_id}`);
            }
        }
        
        res.json(updatedOrder);
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createOrder, 
    verifyPayment, 
    getUserOrders, 
    getAllOrders, 
    updateOrderStatus,
    sendRealTimePushNotification,
    getAvailableDriversWithTokens
};