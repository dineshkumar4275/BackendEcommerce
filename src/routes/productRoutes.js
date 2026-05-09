// src/routes/productRoutes.js

import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// ============ PRODUCT SEARCH ============
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, limit = 20 } = req.query;
    
    console.log('Search query:', q);
    
    let query = `
      SELECT id, name, description, price, stock, category, 
             image_url, image_url_2, image_url_3, image_url_4, image_url_5,
             created_at 
      FROM products 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (q && q.trim()) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${q.trim()}%`);
      paramIndex++;
    }
    
    if (category && category !== 'all' && category !== '') {
      query += ` AND category ILIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }
    
    if (minPrice) {
      query += ` AND price >= $${paramIndex}`;
      params.push(parseFloat(minPrice));
      paramIndex++;
    }
    
    if (maxPrice) {
      query += ` AND price <= $${paramIndex}`;
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }
    
    query += ` AND stock > 0`;
    
    if (q && q.trim()) {
      query += ` ORDER BY 
        CASE WHEN name ILIKE $${paramIndex} THEN 1 ELSE 2 END,
        price ASC`;
      params.push(`%${q.trim()}%`);
      paramIndex++;
    } else {
      query += ` ORDER BY created_at DESC`;
    }
    
    query += ` LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category`
    );
    
    const categories = result.rows.map(row => row.category);
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price, stock, category, 
              image_url, image_url_2, image_url_3, image_url_4, image_url_5,
              created_at 
       FROM products 
       ORDER BY created_at DESC`
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }
    
    const result = await pool.query(
      `SELECT id, name, description, price, stock, category, 
              image_url, image_url_2, image_url_3, image_url_4, image_url_5,
              created_at 
       FROM products 
       WHERE id = $1`,
      [productId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { 
      name, description, price, stock, category, 
      image_url, image_url_2, image_url_3, image_url_4, image_url_5,
      brand, model, warranty, weight, dimensions, material, features,
      is_featured, compare_price
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO products (
        name, description, price, stock, category, 
        image_url, image_url_2, image_url_3, image_url_4, image_url_5,
        brand, model, warranty, weight, dimensions, material, features,
        is_featured, compare_price, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW()) 
      RETURNING *`,
      [
        name, description, price, stock, category,
        image_url, image_url_2 || null, image_url_3 || null, image_url_4 || null, image_url_5 || null,
        brand || null, model || null, warranty || null, weight || null, dimensions || null, material || null, features || null,
        is_featured || false, compare_price || null
      ]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }
    
    const { 
      name, description, price, stock, category, 
      image_url, image_url_2, image_url_3, image_url_4, image_url_5,
      brand, model, warranty, weight, dimensions, material, features,
      is_featured, compare_price
    } = req.body;
    
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, stock = $4, category = $5,
           image_url = $6, image_url_2 = $7, image_url_3 = $8, image_url_4 = $9, image_url_5 = $10,
           brand = $11, model = $12, warranty = $13, weight = $14, dimensions = $15, 
           material = $16, features = $17, is_featured = $18, compare_price = $19,
           updated_at = NOW()
       WHERE id = $20 
       RETURNING *`,
      [
        name, description, price, stock, category,
        image_url, image_url_2 || null, image_url_3 || null, image_url_4 || null, image_url_5 || null,
        brand || null, model || null, warranty || null, weight || null, dimensions || null, 
        material || null, features || null, is_featured || false, compare_price || null,
        productId
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }
    
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [productId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;