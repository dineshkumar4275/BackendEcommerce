// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const protect = async (req, res, next) => {
  let token;
  
  console.log('🔐 ===== AUTH MIDDLEWARE =====');
  
  // Get token from headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    
    // Remove quotes if present
    if (token && token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }
    
    console.log('📝 Token found:', token ? token.substring(0, 30) + '...' : 'EMPTY');
  }
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }
  
  try {
    // Verify token
    const secret = process.env.JWT_SECRET || 'my_super_secret_key_12345678';
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token verified - ID:', decoded.id, 'Role:', decoded.role);
    
    // For driver role
    if (decoded.role === 'driver') {
      const driver = await pool.query(
        'SELECT id, name, email, phone, is_available, vehicle_number, vehicle_type FROM drivers WHERE id = $1',
        [decoded.id]
      );
      
      if (driver.rows.length === 0) {
        console.log('❌ Driver not found for ID:', decoded.id);
        return res.status(401).json({ 
          success: false, 
          message: 'Driver not found' 
        });
      }
      
      req.user = {
        id: driver.rows[0].id,
        name: driver.rows[0].name,
        email: driver.rows[0].email,
        phone: driver.rows[0].phone,
        role: 'driver',
        is_available: driver.rows[0].is_available,
        vehicle_number: driver.rows[0].vehicle_number,
        vehicle_type: driver.rows[0].vehicle_type
      };
      console.log('✅ Driver authenticated:', req.user.name, 'ID:', req.user.id);
      return next();
    }
    
    // For admin or user role
    const user = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (user.rows.length === 0) {
      console.log('❌ User not found for ID:', decoded.id);
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    req.user = {
      id: user.rows[0].id,
      name: user.rows[0].name,
      email: user.rows[0].email,
      role: user.rows[0].role
    };
    console.log('✅ User authenticated:', req.user.name, 'Role:', req.user.role);
    return next();
    
  } catch (error) {
    console.error('❌ JWT Error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// ✅ Export isAdmin middleware
export const isAdmin = (req, res, next) => {
  console.log('🔐 Checking admin access...');
  console.log('📝 User role:', req.user?.role);
  
  if (req.user && req.user.role === 'admin') {
    console.log('✅ Admin access granted');
    next();
  } else {
    console.log('❌ Admin access denied');
    res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
};

// ✅ Export isDriver middleware (optional)
export const isDriver = (req, res, next) => {
  console.log('🔐 Checking driver access...');
  console.log('📝 User role:', req.user?.role);
  
  if (req.user && req.user.role === 'driver') {
    console.log('✅ Driver access granted');
    next();
  } else {
    console.log('❌ Driver access denied');
    res.status(403).json({ 
      success: false, 
      message: 'Driver access required' 
    });
  }
};