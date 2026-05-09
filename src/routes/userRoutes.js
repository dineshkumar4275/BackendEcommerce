import express from 'express';
import pool from '../config/database.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    console.log('📋 GET /api/users - Fetching all users');
    
    const result = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      message: 'Users fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get single user by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    const result = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'User fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update user role (Admin only)
router.put('/:id/role', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const validRoles = ['user', 'admin', 'driver'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role' 
      });
    }
    
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update user profile
router.put('/profile/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email } = req.body;
    
    if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    const result = await pool.query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        updated_at = NOW()
       WHERE id = $4 RETURNING id, name, email, phone, role`,
      [name, phone, email, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get user statistics (Admin only)
router.get('/stats/summary', protect, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'driver' THEN 1 END) as driver_count,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as customer_count,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week
       FROM users`
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'User statistics fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;