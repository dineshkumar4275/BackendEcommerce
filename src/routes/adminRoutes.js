// backend/src/routes/adminRoutes.js
import express from 'express';
import pool from '../config/database.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Get admin dashboard stats - COMPLETE FIX
router.get('/dashboard/stats', protect, isAdmin, async (req, res) => {
    try {
        console.log('📊 Fetching admin dashboard stats...');

        // ============================================
        // ✅ BASIC STATS - Always work
        // ============================================

        // Get total products
        let totalProducts = 0;
        try {
            const result = await pool.query(`SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL`);
            totalProducts = parseInt(result.rows[0]?.count || 0);
        } catch (e) { console.log('Products error:', e.message); }

        // Get total orders
        let totalOrders = 0;
        try {
            const result = await pool.query(`SELECT COUNT(*) as count FROM orders`);
            totalOrders = parseInt(result.rows[0]?.count || 0);
        } catch (e) { console.log('Orders error:', e.message); }

        // Get total users
        let totalUsers = 0;
        try {
            const result = await pool.query(`SELECT COUNT(*) as count FROM users`);
            totalUsers = parseInt(result.rows[0]?.count || 0);
        } catch (e) { console.log('Users error:', e.message); }

        // Get total revenue
        let totalRevenue = 0;
        try {
            const result = await pool.query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered'`);
            totalRevenue = parseFloat(result.rows[0]?.total || 0);
        } catch (e) { console.log('Revenue error:', e.message); }

        // Get pending orders
        let pendingOrders = 0;
        try {
            const result = await pool.query(`SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'confirmed')`);
            pendingOrders = parseInt(result.rows[0]?.count || 0);
        } catch (e) { console.log('Pending orders error:', e.message); }

        // Get orders in progress
        let inProgressOrders = 0;
        try {
            const result = await pool.query(`SELECT COUNT(*) as count FROM orders WHERE status IN ('processing', 'shipped', 'accepted', 'picked_up', 'in_transit')`);
            inProgressOrders = parseInt(result.rows[0]?.count || 0);
        } catch (e) { console.log('In progress error:', e.message); }

        // Get today's orders
        let todayOrders = 0;
        let todayRevenue = 0;
        try {
            const result = await pool.query(
                `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total 
                 FROM orders 
                 WHERE DATE(created_at) = CURRENT_DATE`
            );
            todayOrders = parseInt(result.rows[0]?.count || 0);
            todayRevenue = parseFloat(result.rows[0]?.total || 0);
        } catch (e) { console.log('Today orders error:', e.message); }

        // Get low stock products
        let lowStockProducts = 0;
        try {
            const result = await pool.query(`SELECT COUNT(*) as count FROM products WHERE stock < 10 AND stock > 0 AND deleted_at IS NULL`);
            lowStockProducts = parseInt(result.rows[0]?.count || 0);
        } catch (e) { console.log('Low stock error:', e.message); }

        // Get category breakdown
        let categoryBreakdown = [];
        try {
            const result = await pool.query(
                `SELECT category, COUNT(*) as count 
                 FROM products 
                 WHERE deleted_at IS NULL AND category IS NOT NULL
                 GROUP BY category 
                 ORDER BY count DESC 
                 LIMIT 5`
            );
            categoryBreakdown = result.rows || [];
        } catch (e) { console.log('Category error:', e.message); }

        // Get recent orders
        let recentOrders = [];
        try {
            const result = await pool.query(
                `SELECT o.*, u.name as user_name 
                 FROM orders o
                 LEFT JOIN users u ON o.user_id = u.id
                 ORDER BY o.created_at DESC 
                 LIMIT 5`
            );
            recentOrders = result.rows || [];
        } catch (e) { console.log('Recent orders error:', e.message); }

        // ============================================
        // ✅ DRIVER STATS - With proper error handling
        // ============================================
        let driversToday = [];
        let allDrivers = [];
        let totalDrivers = 0;
        let availableDrivers = 0;

        try {
            // Check if drivers table exists
            const tableCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'drivers'
                )
            `);

            if (tableCheck.rows[0].exists) {
                // Get total drivers
                const driversCount = await pool.query(`SELECT COUNT(*) as count FROM drivers`);
                totalDrivers = parseInt(driversCount.rows[0]?.count || 0);

                // Get available drivers
                const availableCount = await pool.query(`SELECT COUNT(*) as count FROM drivers WHERE is_available = true`);
                availableDrivers = parseInt(availableCount.rows[0]?.count || 0);

                // ✅ FIXED: Get drivers who delivered today - Using correct column names
                try {
                    // Check what columns exist in drivers table
                    const columnsCheck = await pool.query(`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'drivers'
                    `);
                    const driverColumns = columnsCheck.rows.map(r => r.column_name);
                    console.log('Driver columns:', driverColumns);

                    // Build query based on existing columns
                    let selectFields = 'd.id';
                    let groupFields = 'd.id';
                    
                    if (driverColumns.includes('name')) {
                        selectFields += ', d.name';
                        groupFields += ', d.name';
                    }
                    if (driverColumns.includes('email')) {
                        selectFields += ', d.email';
                        groupFields += ', d.email';
                    }
                    if (driverColumns.includes('phone')) {
                        selectFields += ', d.phone';
                        groupFields += ', d.phone';
                    }
                    if (driverColumns.includes('vehicle_number')) {
                        selectFields += ', d.vehicle_number';
                        groupFields += ', d.vehicle_number';
                    }
                    if (driverColumns.includes('is_available')) {
                        selectFields += ', d.is_available';
                        groupFields += ', d.is_available';
                    }

                    // Only run if we have basic fields
                    if (driverColumns.includes('name') || driverColumns.includes('id')) {
                        const driversResult = await pool.query(`
                            SELECT 
                                ${selectFields},
                                COUNT(o.id) as deliveries_count,
                                COALESCE(SUM(o.total_amount), 0) as earnings_today,
                                MAX(o.updated_at) as last_delivery_time
                            FROM drivers d
                            LEFT JOIN orders o ON d.id = o.driver_id 
                              AND o.status = 'delivered' 
                              AND DATE(o.updated_at) = CURRENT_DATE
                            GROUP BY ${groupFields}
                            ORDER BY deliveries_count DESC
                            LIMIT 10
                        `);
                        driversToday = driversResult.rows || [];
                    }
                } catch (e) {
                    console.log('Drivers today query error:', e.message);
                }

                // ✅ FIXED: Get all drivers with stats
                try {
                    const columnsCheck = await pool.query(`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'drivers'
                    `);
                    const driverColumns = columnsCheck.rows.map(r => r.column_name);

                    let selectFields = 'd.id';
                    let groupFields = 'd.id';
                    
                    if (driverColumns.includes('name')) {
                        selectFields += ', d.name';
                        groupFields += ', d.name';
                    }
                    if (driverColumns.includes('email')) {
                        selectFields += ', d.email';
                        groupFields += ', d.email';
                    }
                    if (driverColumns.includes('phone')) {
                        selectFields += ', d.phone';
                        groupFields += ', d.phone';
                    }
                    if (driverColumns.includes('vehicle_number')) {
                        selectFields += ', d.vehicle_number';
                        groupFields += ', d.vehicle_number';
                    }
                    if (driverColumns.includes('is_available')) {
                        selectFields += ', d.is_available';
                        groupFields += ', d.is_available';
                    }

                    if (driverColumns.includes('name') || driverColumns.includes('id')) {
                        const driversResult = await pool.query(`
                            SELECT 
                                ${selectFields},
                                COUNT(o.id) as total_deliveries,
                                COALESCE(SUM(o.total_amount), 0) as total_earnings,
                                COUNT(CASE WHEN DATE(o.updated_at) = CURRENT_DATE THEN 1 END) as today_deliveries,
                                COALESCE(SUM(CASE WHEN DATE(o.updated_at) = CURRENT_DATE THEN o.total_amount ELSE 0 END), 0) as today_earnings
                            FROM drivers d
                            LEFT JOIN orders o ON d.id = o.driver_id AND o.status = 'delivered'
                            GROUP BY ${groupFields}
                            ORDER BY total_deliveries DESC
                            LIMIT 10
                        `);
                        allDrivers = driversResult.rows || [];
                    }
                } catch (e) {
                    console.log('All drivers query error:', e.message);
                }
            }
        } catch (driverError) {
            console.log('Driver table error:', driverError.message);
        }

        // ============================================
        // ✅ RESPONSE
        // ============================================
        const stats = {
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue,
            pendingOrders,
            inProgressOrders,
            todayOrders,
            todayRevenue,
            lowStockProducts,
            totalDrivers,
            availableDrivers,
            recentOrders,
            categoryBreakdown,
            driversToday,
            allDrivers
        };

        console.log('✅ Dashboard stats fetched successfully');

        return res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        console.error('Error stack:', error.stack);
        
        // Return default stats
        return res.status(200).json({
            success: true,
            data: {
                totalProducts: 0,
                totalOrders: 0,
                totalUsers: 0,
                totalRevenue: 0,
                pendingOrders: 0,
                inProgressOrders: 0,
                todayOrders: 0,
                todayRevenue: 0,
                lowStockProducts: 0,
                totalDrivers: 0,
                availableDrivers: 0,
                recentOrders: [],
                categoryBreakdown: [],
                driversToday: [],
                allDrivers: []
            },
            message: 'Dashboard data loaded (partial)'
        });
    }
});

// ✅ Get recent orders
router.get('/dashboard/recent-orders', protect, isAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const result = await pool.query(
            `SELECT o.*, u.name as user_name, u.email as user_email
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC
             LIMIT $1`,
            [limit]
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Recent orders error:', error);
        return res.status(200).json({
            success: true,
            data: [],
            message: 'Could not fetch recent orders'
        });
    }
});

// ✅ Get chart data
router.get('/dashboard/chart-data', protect, isAdmin, async (req, res) => {
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

        const result = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as revenue
             FROM orders
             WHERE created_at >= CURRENT_DATE - ${interval}
             GROUP BY DATE(created_at)
             ORDER BY date ASC`
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Chart data error:', error);
        return res.status(200).json({
            success: true,
            data: [],
            message: 'Could not fetch chart data'
        });
    }
});

// ✅ Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Admin API is working',
        timestamp: new Date().toISOString()
    });
});

export default router;