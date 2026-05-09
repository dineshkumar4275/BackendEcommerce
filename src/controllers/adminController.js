import pool from '../config/database.js';

// Get dashboard stats
export const getStats = async (req, res) => {
  try {
    const totalProducts = await pool.query('SELECT COUNT(*) FROM products');
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalOrders = await pool.query('SELECT COUNT(*) FROM orders');
    const totalSales = await pool.query('SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = \'delivered\'');
    
    res.json({
      totalProducts: parseInt(totalProducts.rows[0].count),
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalOrders: parseInt(totalOrders.rows[0].count),
      totalSales: parseFloat(totalSales.rows[0].sum)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recent orders
export const getRecentOrders = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};