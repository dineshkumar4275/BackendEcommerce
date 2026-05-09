const pool = require('../config/database');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');

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
        
        res.json({
            order: result.rows[0],
            razorpayOrder,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');
        
        if (expectedSignature === razorpay_signature) {
            await pool.query(
                'UPDATE orders SET payment_id = $1, status = $2 WHERE razorpay_order_id = $3',
                [razorpay_payment_id, 'confirmed', razorpay_order_id]
            );
            
            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createOrder, verifyPayment, getUserOrders, getAllOrders, updateOrderStatus };