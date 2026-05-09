import pool from '../config/database.js';

// Get all products
export const getProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single product by ID (for edit page)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create product (Admin only)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, image_url, is_featured } = req.body;
    
    const result = await pool.query(
      'INSERT INTO products (name, description, price, category, stock, image_url, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, price, category, stock, image_url, is_featured || false]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Product created successfully',
      product: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update product (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock, image_url, is_featured } = req.body;
    
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, category = $4, 
           stock = $5, image_url = $6, is_featured = $7, updated_at = NOW() 
       WHERE id = $8 
       RETURNING *`,
      [name, description, price, category, stock, image_url, is_featured, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      product: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: error.message });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      return res.json(result.rows);
    }
    
    const searchTerm = `%${q.toLowerCase()}%`;
    const result = await pool.query(
      `SELECT * FROM products 
       WHERE LOWER(name) LIKE $1 
          OR LOWER(description) LIKE $1 
          OR LOWER(category) LIKE $1
       ORDER BY created_at DESC`,
      [searchTerm]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
};