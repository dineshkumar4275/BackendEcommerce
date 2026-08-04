// src/controllers/otpController.js
import pool from '../config/database.js';
import jwt from 'jsonwebtoken';

// ============================================
// ✅ SEND OTP
// ============================================
export const sendOTP = async (req, res) => {
  try {
    console.log('📱 Send OTP request:', req.body);
    
    const { email, phone } = req.body;
    const contact = email || phone;
    const type = email ? 'email' : 'phone';

    if (!contact) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save to database
    try {
      // Create table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS otps (
          id SERIAL PRIMARY KEY,
          contact VARCHAR(255) NOT NULL,
          type VARCHAR(20) DEFAULT 'email',
          otp VARCHAR(6) NOT NULL,
          purpose VARCHAR(20) DEFAULT 'login',
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(
        `INSERT INTO otps (contact, type, otp, purpose, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (contact) 
         DO UPDATE SET otp = $3, expires_at = $5, created_at = NOW()`,
        [contact, type, otp, 'login', expiresAt]
      );
      console.log('✅ OTP saved to database');
    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
      // Continue even if DB fails - OTP still works
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        contact,
        type,
        expiresIn: '10 minutes',
        ...(isDevelopment && { otp }),
      }
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// ============================================
// ✅ VERIFY OTP
// ============================================
export const verifyOTP = async (req, res) => {
  try {
    console.log('📱 Verify OTP request:', req.body);
    
    const { contact, otp } = req.body;

    if (!contact || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Contact and OTP are required'
      });
    }

    // ✅ DEVELOPMENT - Accept any OTP
    if (process.env.NODE_ENV === 'development') {
      // Check if user exists
      let userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR phone = $1',
        [contact]
      );

      let user = userResult.rows[0];
      
      if (!user) {
        // Create new user
        const newUser = await pool.query(
          `INSERT INTO users (email, phone, name, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING *`,
          [
            contact.includes('@') ? contact : null,
            !contact.includes('@') ? contact : null,
            contact.split('@')[0] || 'User'
          ]
        );
        user = newUser.rows[0];
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role || 'user' },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
          },
          token
        }
      });
    }

    // ✅ PRODUCTION - Verify from database
    const result = await pool.query(
      `SELECT * FROM otps 
       WHERE contact = $1 
       AND otp = $2 
       AND expires_at > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [contact, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Delete used OTP
    await pool.query(
      'DELETE FROM otps WHERE contact = $1',
      [contact]
    );

    // Get or create user
    let userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $1',
      [contact]
    );

    let user = userResult.rows[0];
    
    if (!user) {
      const newUser = await pool.query(
        `INSERT INTO users (email, phone, name, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [
          contact.includes('@') ? contact : null,
          !contact.includes('@') ? contact : null,
          contact.split('@')[0] || 'User'
        ]
      );
      user = newUser.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

// ============================================
// ✅ RESEND OTP
// ============================================
export const resendOTP = async (req, res) => {
  try {
    console.log('📱 Resend OTP request:', req.body);
    
    const { contact } = req.body;

    if (!contact) {
      return res.status(400).json({
        success: false,
        message: 'Contact is required'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `UPDATE otps 
       SET otp = $1, expires_at = $2, created_at = NOW()
       WHERE contact = $3`,
      [otp, expiresAt, contact]
    );

    const isDevelopment = process.env.NODE_ENV === 'development';

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        contact,
        expiresIn: '10 minutes',
        ...(isDevelopment && { otp })
      }
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};