const pool = require('../config/database');

class TrackingModel {
    static async createTracking(orderId, status, location, estimatedDelivery, updatedBy) {
        const query = `
            INSERT INTO tracking (order_id, status, location, estimated_delivery, updated_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [orderId, status, location, estimatedDelivery, updatedBy];
        const result = await pool.query(query, values);
        
        // Add to tracking history
        await this.addToHistory(result.rows[0].id, status, location);
        
        // Update order status
        await pool.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, orderId]);
        
        return result.rows[0];
    }

    static async addToHistory(trackingId, status, location, notes = null) {
        const query = `
            INSERT INTO tracking_history (tracking_id, status, location, notes)
            VALUES ($1, $2, $3, $4)
        `;
        await pool.query(query, [trackingId, status, location, notes]);
    }

    static async getTrackingByOrder(orderId) {
        const query = `
            SELECT t.*, u.name as updated_by_name
            FROM tracking t
            LEFT JOIN users u ON t.updated_by = u.id
            WHERE t.order_id = $1
            ORDER BY t.created_at DESC
        `;
        const result = await pool.query(query, [orderId]);
        return result.rows;
    }

    static async getTrackingHistory(trackingId) {
        const query = `
            SELECT * FROM tracking_history
            WHERE tracking_id = $1
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [trackingId]);
        return result.rows;
    }
}

module.exports = TrackingModel;