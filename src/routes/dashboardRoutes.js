import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Initialize default stats object
    const stats = {
      totalProducts: 0,
      lowStock: 0,
      outOfStock: 0,
      totalOrders: 0,
      totalRevenue: 0,
      todayOrders: 0,
      todayRevenue: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      totalCustomers: 0,
      avgOrderValue: 0,
      categories: [],
      recentProducts: []
    };
    
    // Get total products (products table has deleted_at)
    try {
      const productsResult = await pool.query('SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL');
      stats.totalProducts = parseInt(productsResult.rows[0].count);
      
      const lowStockResult = await pool.query('SELECT COUNT(*) as count FROM products WHERE stock < 10 AND stock > 0 AND deleted_at IS NULL');
      stats.lowStock = parseInt(lowStockResult.rows[0].count);
      
      const outOfStockResult = await pool.query('SELECT COUNT(*) as count FROM products WHERE stock = 0 AND deleted_at IS NULL');
      stats.outOfStock = parseInt(outOfStockResult.rows[0].count);
      
      const categoriesResult = await pool.query(`
        SELECT category, COUNT(*) as count 
        FROM products 
        WHERE deleted_at IS NULL AND category IS NOT NULL
        GROUP BY category 
        ORDER BY count DESC 
        LIMIT 5
      `);
      stats.categories = categoriesResult.rows;
      
      const recentResult = await pool.query(`
        SELECT id, name, price, stock, category, created_at 
        FROM products 
        WHERE deleted_at IS NULL 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      stats.recentProducts = recentResult.rows;
    } catch (err) {
      console.log('Products query error:', err.message);
    }
    
    // Get orders data (orders table doesn't have deleted_at)
    try {
      // Check if orders table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'orders'
        )
      `);
      
      if (tableCheck.rows[0].exists) {
        // Check if orders table has specific columns
        const columnsCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'orders'
        `);
        
        const columnNames = columnsCheck.rows.map(r => r.column_name);
        
        // Total orders (without deleted_at)
        const ordersResult = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders');
        stats.totalOrders = parseInt(ordersResult.rows[0].count);
        stats.totalRevenue = parseFloat(ordersResult.rows[0].revenue);
        
        // Today's orders
        const todayResult = await pool.query(`
          SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
          FROM orders 
          WHERE DATE(created_at) = CURRENT_DATE
        `);
        stats.todayOrders = parseInt(todayResult.rows[0].count);
        stats.todayRevenue = parseFloat(todayResult.rows[0].revenue);
        
        // Order status breakdown (if status column exists)
        if (columnNames.includes('status')) {
          const pendingResult = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
          stats.pendingOrders = parseInt(pendingResult.rows[0].count);
          
          const processingResult = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'processing'");
          stats.processingOrders = parseInt(processingResult.rows[0].count);
          
          const shippedResult = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'shipped'");
          stats.shippedOrders = parseInt(shippedResult.rows[0].count);
          
          const deliveredResult = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'");
          stats.deliveredOrders = parseInt(deliveredResult.rows[0].count);
        }
        
        // Average order value
        const avgResult = await pool.query("SELECT COALESCE(AVG(total_amount), 0) as average FROM orders WHERE status != 'cancelled' OR status IS NULL");
        stats.avgOrderValue = parseFloat(avgResult.rows[0].average);
      }
    } catch (err) {
      console.log('Orders query error:', err.message);
    }
    
    // Return successful response
    return res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(200).json({
      success: true,
      data: {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        message: 'Data loading'
      }
    });
  }
});

// Get recent orders
router.get('/recent-orders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Check if orders table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'orders'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: 'Orders table not found'
      });
    }
    
    // Get recent orders (without deleted_at)
    const result = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.status,
        o.created_at,
        COALESCE((
          SELECT COUNT(*) 
          FROM order_items oi 
          WHERE oi.order_id = o.id
        ), 0) as items_count
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT $1
    `, [limit]);
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Recent orders error:', error);
    return res.status(200).json({
      success: true,
      data: [],
      count: 0,
      error: error.message
    });
  }
});

// Get single order details
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderResult = await pool.query(`
      SELECT * FROM orders WHERE id = $1
    `, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Get order items
    const itemsResult = await pool.query(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);
    
    return res.status(200).json({
      success: true,
      data: {
        ...orderResult.rows[0],
        items: itemsResult.rows
      }
    });
    
  } catch (error) {
    console.error('Order details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
});

// Update order status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const result = await pool.query(`
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

export default router;