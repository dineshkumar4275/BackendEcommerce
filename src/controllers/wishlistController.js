import pool from '../config/database.js';

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if table exists, if not return empty array
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wishlist'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        success: true,
        data: [],
        message: 'Wishlist table not created yet'
      });
    }
    
    const result = await pool.query(
      'SELECT * FROM wishlist WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return res.json({
      success: true,
      data: result.rows,
      message: 'Wishlist fetched successfully'
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
      error: error.message
    });
  }
};

// Add to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, product_name, product_price, product_image } = req.body;
    
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Check if already exists
    const existing = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );
    
    if (existing.rows.length > 0) {
      return res.json({
        success: false,
        message: 'Product already in wishlist'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO wishlist (user_id, product_id, product_name, product_price, product_image) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, product_id, product_name || 'Product', product_price || 0, product_image || null]
    );
    
    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Added to wishlist'
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add to wishlist',
      error: error.message
    });
  }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM wishlist WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }
    
    return res.json({
      success: true,
      message: 'Removed from wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove from wishlist',
      error: error.message
    });
  }
};

// Clear wishlist
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await pool.query('DELETE FROM wishlist WHERE user_id = $1', [userId]);
    
    return res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist',
      error: error.message
    });
  }
};

// Check if product is in wishlist
export const checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.params;
    
    const result = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );
    
    return res.json({
      success: true,
      inWishlist: result.rows.length > 0
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check wishlist',
      error: error.message
    });
  }
};