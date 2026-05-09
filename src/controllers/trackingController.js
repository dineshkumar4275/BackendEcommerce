const pool = require('../config/database');

const getTrackingByOrder = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tracking WHERE order_id = $1 ORDER BY updated_at DESC',
            [req.params.orderId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateTracking = async (req, res) => {
    try {
        const { status, location, estimated_delivery } = req.body;
        const result = await pool.query(
            'INSERT INTO tracking (order_id, status, location, estimated_delivery) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.params.orderId, status, location, estimated_delivery]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTrackingByOrder, updateTracking };