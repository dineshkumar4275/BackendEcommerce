import pool from '../config/database.js';

const Wishlist = {
  // Get user's wishlist
  async getUserWishlist(userId) {
    const query = `
      SELECT 
        w.id,
        w.product_id,
        w.added_at,
        p.name,
        p.price,
        p.images,
        p.category,
        p.stock
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error in getUserWishlist:', error);
      throw error;
    }
  },

  // Add to wishlist
  async addToWishlist(userId, productId) {
    const query = `
      INSERT INTO wishlists (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING id, user_id, product_id, added_at
    `;
    try {
      const result = await pool.query(query, [userId, productId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in addToWishlist:', error);
      throw error;
    }
  },

  // Remove from wishlist
  async removeFromWishlist(userId, productId) {
    const query = `
      DELETE FROM wishlists
      WHERE user_id = $1 AND product_id = $2
      RETURNING id
    `;
    try {
      const result = await pool.query(query, [userId, productId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in removeFromWishlist:', error);
      throw error;
    }
  },

  // Check if product is in wishlist
  async isInWishlist(userId, productId) {
    const query = `
      SELECT id FROM wishlists
      WHERE user_id = $1 AND product_id = $2
    `;
    try {
      const result = await pool.query(query, [userId, productId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error in isInWishlist:', error);
      return false;
    }
  },

  // Get wishlist count
  async getWishlistCount(userId) {
    const query = `
      SELECT COUNT(*) as count FROM wishlists
      WHERE user_id = $1
    `;
    try {
      const result = await pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error in getWishlistCount:', error);
      return 0;
    }
  }
};

export default Wishlist;