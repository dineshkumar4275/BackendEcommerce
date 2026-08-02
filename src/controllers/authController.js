// backend/src/controllers/authController.js

import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { sendOTPEmail, sendAdminOTP } from '../services/emailService.js';

// Global OTP store (in production, use Redis)
const otpStore = new Map();

// Clean expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
      console.log(`🗑️ Cleaned expired OTP for ${email}`);
    }
  }
}, 60000);

// ============================================
// ✅ REGISTER - New user registration
// ============================================
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role = 'user' } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, is_verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, email, phone, role, is_verified`,
      [name, email.toLowerCase(), hashedPassword, phone || null, role, false]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.is_verified
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// ============================================
// ✅ LOGIN - User login
// ============================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.is_verified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// ============================================
// ✅ GET PROFILE - Get current user profile
// ============================================
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, name, email, phone, role, is_verified, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// ============================================
// ✅ UPDATE PROFILE - Update user profile
// ============================================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone)
       WHERE id = $3
       RETURNING id, name, email, phone, role`,
      [name, phone, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// ============================================
// ✅ CHANGE PASSWORD - Change user password
// ============================================
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user with password
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// ============================================
// ✅ FORGOT PASSWORD - Send reset link
// ============================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: result.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In production, send email with reset link
    console.log(`🔑 Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'Password reset link sent to your email',
      resetToken // Only for development
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
};

// ============================================
// ✅ RESET PASSWORD - Reset with token
// ============================================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

// ============================================
// ✅ VERIFY EMAIL - Verify user email
// ============================================
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Update user verification status
    await pool.query(
      'UPDATE users SET is_verified = true WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Invalid or expired verification token',
      error: error.message
    });
  }
};

// ============================================
// ✅ LOGOUT - Logout user (client-side)
// ============================================
export const logout = async (req, res) => {
  try {
    // Client should remove token from localStorage
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// ============================================
// ✅ SEND OTP - Send OTP for login
// ============================================
export const sendOTP = async (req, res) => {
  try {
    let { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    
    let cleanEmail = String(email).trim().toLowerCase();
    
    if (!cleanEmail.includes('@')) {
      cleanEmail = cleanEmail + '@gmail.com';
      console.log(`📧 Auto-corrected email: ${cleanEmail}`);
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    otpStore.set(cleanEmail, { otp, expiresAt, attempts: 0 });
    
    console.log(`\n📧 OTP for ${cleanEmail}: ${otp}\n`);
    
    await sendOTPEmail(cleanEmail, otp, cleanEmail.split('@')[0]);
    
    res.json({ 
      success: true, 
      message: 'OTP sent to email',
      testOTP: otp
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ✅ VERIFY OTP - Verify OTP and login
// ============================================
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, role } = req.body;
    
    const cleanOtp = String(otp).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    
    console.log(`\n🔐 VERIFYING OTP`);
    console.log(`📧 Email: ${cleanEmail}`);
    console.log(`🔢 Entered OTP: "${cleanOtp}"`);
    
    const stored = otpStore.get(cleanEmail);
    
    if (!stored) {
      console.log(`❌ No OTP found for ${cleanEmail}`);
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found. Please request a new OTP.' 
      });
    }
    
    console.log(`📦 Stored OTP: "${stored.otp}"`);
    
    const isMatch = stored.otp === cleanOtp;
    console.log(`🔍 Match: ${isMatch}`);
    
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanEmail);
      console.log(`❌ OTP expired`);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP expired. Please request a new OTP.' 
      });
    }
    
    if (!isMatch) {
      stored.attempts += 1;
      otpStore.set(cleanEmail, stored);
      console.log(`❌ Invalid OTP. Attempt ${stored.attempts}/5`);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${5 - stored.attempts} attempts remaining.`,
        attemptsLeft: 5 - stored.attempts
      });
    }
    
    otpStore.delete(cleanEmail);
    console.log(`✅ OTP VERIFIED SUCCESSFULLY!`);
    
    let user = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    let isDriver = false;
    let isNewUser = false;
    
    if (user.rows.length === 0) {
      console.log(`🔍 Checking drivers table for ${cleanEmail}`);
      const driver = await pool.query('SELECT * FROM drivers WHERE email = $1', [cleanEmail]);
      
      if (driver.rows.length > 0) {
        console.log(`✅ Driver found: ${driver.rows[0].name}`);
        isDriver = true;
        user = {
          rows: [{
            id: driver.rows[0].id,
            name: driver.rows[0].name,
            email: driver.rows[0].email,
            phone: driver.rows[0].phone,
            role: 'driver',
            password: null
          }]
        };
      } else {
        console.log(`📝 Creating new user for ${cleanEmail}`);
        const hashedPassword = await bcrypt.hash('otp-auth', 10);
        const name = cleanEmail.split('@')[0];
        const result = await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
          [name, cleanEmail, hashedPassword, 'user']
        );
        user = result;
        isNewUser = true;
      }
    }
    
    if (role === 'driver' && user.rows[0].role !== 'driver') {
      const driverCheck = await pool.query('SELECT * FROM drivers WHERE email = $1', [cleanEmail]);
      if (driverCheck.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'You are not registered as a driver. Please contact admin.' 
        });
      } else {
        isDriver = true;
        user = {
          rows: [{
            id: driverCheck.rows[0].id,
            name: driverCheck.rows[0].name,
            email: driverCheck.rows[0].email,
            phone: driverCheck.rows[0].phone,
            role: 'driver',
            password: null
          }]
        };
      }
    }
    
    const token = generateToken(user.rows[0].id, user.rows[0].role);
    
    console.log(`🎉 Login successful: ${user.rows[0].name} (${user.rows[0].role})`);
    
    res.json({
      success: true,
      token,
      isNewUser,
      isDriver,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        phone: user.rows[0].phone || null,
        role: user.rows[0].role
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ============================================
// ✅ RESEND OTP - Resend OTP
// ============================================
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    
    otpStore.delete(email);
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    otpStore.set(email, { otp, expiresAt, attempts: 0, createdAt: Date.now() });
    
    console.log(`\n📧 RESEND OTP for ${email}: ${otp}\n`);
    
    await sendOTPEmail(email, otp, email.split('@')[0]);
    
    res.json({ 
      success: true, 
      message: 'OTP resent successfully',
      testOTP: otp
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ✅ VALIDATE TOKEN - Validate JWT token
// ============================================
export const validateToken = async (req, res) => {
  try {
    res.json({ 
      valid: true, 
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(401).json({ valid: false, message: error.message });
  }
};

// ============================================
// ✅ ADMIN LOGIN - Admin login
// ============================================
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    if (email === 'admin@example.com' && password === 'admin123') {
      const token = generateToken(user.id, user.role);
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    }
    
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};