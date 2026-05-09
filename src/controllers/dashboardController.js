const { pool } = require('../config/database');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total products
    const productsResult = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL'
    );
    
    // Get total orders
    const ordersResult = await pool.query(
      'SELECT COUNT(*) as count FROM orders'
    );
    
    // Get total users
    const usersResult = await pool.query(
      'SELECT COUNT(*) as count FROM users'
    );
    
    // Get total revenue
    const revenueResult = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = $1',
      ['delivered']
    );
    
    const stats = {
      totalProducts: parseInt(productsResult.rows[0]?.count || 0),
      totalOrders: parseInt(ordersResult.rows[0]?.count || 0),
      totalUsers: parseInt(usersResult.rows[0]?.count || 0),
      totalRevenue: parseFloat(revenueResult.rows[0]?.total || 0)
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get recent orders for dashboard
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const query = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get chart data for dashboard
exports.getChartData = async (req, res) => {
  try {
    const { range = 'week' } = req.query;
    let interval;
    
    switch(range) {
      case 'week':
        interval = "INTERVAL '7 days'";
        break;
      case 'month':
        interval = "INTERVAL '30 days'";
        break;
      case 'year':
        interval = "INTERVAL '1 year'";
        break;
      default:
        interval = "INTERVAL '7 days'";
    }
    
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE created_at >= CURRENT_DATE - ${interval}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};