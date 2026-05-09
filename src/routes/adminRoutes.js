// import express from 'express';
// import { getStats, getRecentOrders } from '../controllers/adminController.js';
// import { protect, admin } from '../middleware/authMiddleware.js';

// const router = express.Router();

// // All admin routes require authentication and admin role
// router.use(protect, admin);

// router.get('/stats', getStats);
// router.get('/recent-orders', getRecentOrders);

// export default router;
// backend/routes/adminRoutes.js
import express from 'express';
import pool from '../config/database.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Get admin dashboard stats
router.get('/dashboard/stats', protect, isAdmin, async (req, res) => {
  try {
    // Get today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Total earnings from all deliveries (completed orders)
    const totalEarnings = await pool.query(
      `SELECT COALESCE(SUM(delivery_fee), 0) as total_earnings,
              COUNT(*) as total_deliveries
       FROM orders 
       WHERE status = 'delivered'`
    );
    
    // Today's earnings and deliveries
    const todayEarnings = await pool.query(
      `SELECT COALESCE(SUM(delivery_fee), 0) as today_earnings,
              COUNT(*) as today_deliveries
       FROM orders 
       WHERE status = 'delivered' 
       AND DATE(updated_at) = CURRENT_DATE`
    );
    
    // Weekly earnings
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const weekEarnings = await pool.query(
      `SELECT COALESCE(SUM(delivery_fee), 0) as week_earnings,
              COUNT(*) as week_deliveries
       FROM orders 
       WHERE status = 'delivered' 
       AND updated_at >= $1`,
      [weekStart]
    );
    
    // Monthly earnings
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthEarnings = await pool.query(
      `SELECT COALESCE(SUM(delivery_fee), 0) as month_earnings,
              COUNT(*) as month_deliveries
       FROM orders 
       WHERE status = 'delivered' 
       AND updated_at >= $1`,
      [monthStart]
    );
    
    // Get drivers who delivered today
    const driversToday = await pool.query(
      `SELECT 
        d.id,
        d.name,
        d.email,
        d.phone,
        d.vehicle_number,
        COUNT(o.id) as deliveries_count,
        COALESCE(SUM(o.delivery_fee), 0) as earnings_today,
        MAX(o.updated_at) as last_delivery_time
       FROM drivers d
       LEFT JOIN orders o ON d.id = o.driver_id 
         AND o.status = 'delivered' 
         AND DATE(o.updated_at) = CURRENT_DATE
       WHERE o.id IS NOT NULL
       GROUP BY d.id
       ORDER BY deliveries_count DESC`
    );
    
    // Get all drivers with their stats
    const allDrivers = await pool.query(
      `SELECT 
        d.id,
        d.name,
        d.email,
        d.phone,
        d.vehicle_number,
        d.is_available,
        COUNT(o.id) as total_deliveries,
        COALESCE(SUM(o.delivery_fee), 0) as total_earnings,
        COUNT(CASE WHEN DATE(o.updated_at) = CURRENT_DATE THEN 1 END) as today_deliveries,
        COALESCE(SUM(CASE WHEN DATE(o.updated_at) = CURRENT_DATE THEN o.delivery_fee ELSE 0 END), 0) as today_earnings
       FROM drivers d
       LEFT JOIN orders o ON d.id = o.driver_id AND o.status = 'delivered'
       GROUP BY d.id
       ORDER BY total_deliveries DESC`
    );
    
    // Get pending orders count
    const pendingOrders = await pool.query(
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE status = 'pending' AND driver_id IS NULL`
    );
    
    // Get orders in progress
    const ordersInProgress = await pool.query(
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE status IN ('accepted', 'picked_up', 'in_transit')`
    );
    
    res.json({
      success: true,
      data: {
        summary: {
          total_earnings: parseFloat(totalEarnings.rows[0].total_earnings),
          total_deliveries: parseInt(totalEarnings.rows[0].total_deliveries),
          today_earnings: parseFloat(todayEarnings.rows[0].today_earnings),
          today_deliveries: parseInt(todayEarnings.rows[0].today_deliveries),
          week_earnings: parseFloat(weekEarnings.rows[0].week_earnings),
          week_deliveries: parseInt(weekEarnings.rows[0].week_deliveries),
          month_earnings: parseFloat(monthEarnings.rows[0].month_earnings),
          month_deliveries: parseInt(monthEarnings.rows[0].month_deliveries),
          pending_orders: parseInt(pendingOrders.rows[0].count),
          orders_in_progress: parseInt(ordersInProgress.rows[0].count)
        },
        drivers_today: driversToday.rows,
        all_drivers: allDrivers.rows
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get driver performance report
router.get('/drivers/performance', protect, isAdmin, async (req, res) => {
  try {
    const { from, to, driver_id } = req.query;
    
    let query = `
      SELECT 
        d.id,
        d.name,
        d.email,
        d.phone,
        d.vehicle_number,
        COUNT(o.id) as total_deliveries,
        COALESCE(SUM(o.delivery_fee), 0) as total_earnings,
        AVG(o.delivery_fee) as avg_earning_per_delivery,
        MIN(o.created_at) as first_delivery,
        MAX(o.updated_at) as last_delivery
      FROM drivers d
      LEFT JOIN orders o ON d.id = o.driver_id AND o.status = 'delivered'
    `;
    
    const params = [];
    let conditions = [];
    
    if (driver_id) {
      conditions.push(`d.id = $${params.length + 1}`);
      params.push(driver_id);
    }
    
    if (from) {
      conditions.push(`o.updated_at >= $${params.length + 1}`);
      params.push(from);
    }
    
    if (to) {
      conditions.push(`o.updated_at <= $${params.length + 1}`);
      params.push(to);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY d.id ORDER BY total_deliveries DESC';
    
    const result = await pool.query(query, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Driver performance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get daily earnings report
router.get('/earnings/daily', protect, isAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await pool.query(
      `SELECT 
        DATE(updated_at) as date,
        COUNT(*) as deliveries,
        COALESCE(SUM(delivery_fee), 0) as earnings
       FROM orders 
       WHERE status = 'delivered' 
       AND updated_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(updated_at)
       ORDER BY date DESC`
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Daily earnings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;