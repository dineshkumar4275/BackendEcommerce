import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Wishlist from '../models/Wishlist.js';
import pool from '../config/database.js';

const router = express.Router();

// Get user's wishlist
// Get user's wishlist
router.get('/', protect, async (req, res) => {
  try {
    console.log('Fetching wishlist for user:', req.user.id);
    
    const query = `
      SELECT 
        w.id,
        w.product_id,
        w.added_at,
        p.name,
        p.price,
        p.images,
        p.image_url,
        p.image_url_2,
        p.image_url_3,
        p.image_url_4,
        p.image_url_5,
        p.category,
        p.stock
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    console.log('Raw query result:', result.rows);
    
    const transformedItems = result.rows.map(item => {
      // Get the first available image
      let imageUrl = null;
      
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        imageUrl = item.images[0];
      } else if (item.image_url) {
        imageUrl = item.image_url;
      } else if (item.image_url_2) {
        imageUrl = item.image_url_2;
      } else if (item.image_url_3) {
        imageUrl = item.image_url_3;
      } else if (item.image_url_4) {
        imageUrl = item.image_url_4;
      } else if (item.image_url_5) {
        imageUrl = item.image_url_5;
      }
      
      return {
        id: item.id,
        product_id: item.product_id,
        name: item.name,
        price: parseFloat(item.price),
        image_url: imageUrl,
        category: item.category,
        added_at: item.added_at
      };
    });
    
    console.log('Transformed items:', transformedItems);
    
    res.json({
      success: true,
      data: transformedItems,
      count: transformedItems.length
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Add to wishlist
router.post('/', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }
    
    // Check if product exists
    const productQuery = 'SELECT id, name, price, images, category FROM products WHERE id = $1';
    const productResult = await pool.query(productQuery, [productId]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    const product = productResult.rows[0];
    
    // Check if already in wishlist
    const exists = await Wishlist.isInWishlist(req.user.id, productId);
    
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }
    
    // Add to wishlist
    const wishlistItem = await Wishlist.addToWishlist(req.user.id, productId);
    
    res.json({
      success: true,
      message: 'Added to wishlist successfully',
      data: {
        id: wishlistItem.id,
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image_url: product.images && product.images.length > 0 ? product.images[0] : null,
        category: product.category,
        added_at: wishlistItem.added_at
      }
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Remove from wishlist
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }
    
    const removed = await Wishlist.removeFromWishlist(req.user.id, productId);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }
    
    res.json({
      success: true,
      message: 'Removed from wishlist successfully'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const inWishlist = await Wishlist.isInWishlist(req.user.id, productId);
    
    res.json({
      success: true,
      inWishlist: inWishlist
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get wishlist count
router.get('/count', protect, async (req, res) => {
  try {
    const count = await Wishlist.getWishlistCount(req.user.id);
    
    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Get wishlist count error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;