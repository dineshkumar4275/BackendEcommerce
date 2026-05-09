const pool = require('../config/database');

class OrderModel {
    static async create(orderData) {
        const {
            user_id, order_number, total_amount, subtotal,
            tax_amount, shipping_charge, shipping_address,
            shipping_city, shipping_state, shipping_zipcode,
            phone_number, razorpay_order_id
        } = orderData;

        const query = `
            INSERT INTO orders (
                user_id, order_number, total_amount, subtotal,
                tax_amount, shipping_charge, shipping_address,
                shipping_city, shipping_state, shipping_zipcode,
                phone_number, razorpay_order_id, status, payment_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const values = [
            user_id, order_number, total_amount, subtotal,
            tax_amount, shipping_charge, shipping_address,
            shipping_city, shipping_state, shipping_zipcode,
            phone_number, razorpay_order_id, 'pending', 'pending'
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async addOrderItems(orderId, items) {
        for (const item of items) {
            const query = `
                INSERT INTO order_items (order_id, product_id, product_name, quantity, price, total)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            await pool.query(query, [orderId, item.product_id, item.name, item.quantity, item.price, item.price * item.quantity]);
        }
    }

    static async findByOrderNumber(orderNumber) {
        const query = `
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.order_number = $1
        `;
        const result = await pool.query(query, [orderNumber]);
        return result.rows[0];
    }

    static async getUserOrders(userId) {
        const query = `
            SELECT o.*, 
                   COUNT(oi.id) as items_count,
                   json_agg(json_build_object('product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price)) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }
}

module.exports = OrderModel;