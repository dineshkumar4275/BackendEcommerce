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

// Send OTP
export const sendOTP = async (req, res) => {
  try {
    let { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    
    // ✅ Clean and fix email format
    let cleanEmail = String(email).trim().toLowerCase();
    
    // If no @ symbol, add @gmail.com
    if (!cleanEmail.includes('@')) {
      cleanEmail = cleanEmail + '@gmail.com';
      console.log(`📧 Auto-corrected email: ${cleanEmail}`);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    otpStore.set(cleanEmail, { otp, expiresAt, attempts: 0 });
    
    console.log(`\n📧 OTP for ${cleanEmail}: ${otp}\n`);
    
    // Send email (will log to console if fails)
    await sendOTPEmail(cleanEmail, otp, cleanEmail.split('@')[0]);
    
    res.json({ 
      success: true, 
      message: 'OTP sent to email',
      testOTP: otp // Only for development
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP and Login
// Verify OTP and Login
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, role } = req.body; // Add role parameter
    
    // Clean and trim OTP
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
    
    // Compare as strings
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
    
    // Success - delete OTP
    otpStore.delete(cleanEmail);
    console.log(`✅ OTP VERIFIED SUCCESSFULLY!`);
    
    // ✅ FIRST: Check in users table
    let user = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    let isDriver = false;
    let isNewUser = false;
    
    // ✅ IF NOT FOUND in users, check in drivers table
    if (user.rows.length === 0) {
      console.log(`🔍 Checking drivers table for ${cleanEmail}`);
      const driver = await pool.query('SELECT * FROM drivers WHERE email = $1', [cleanEmail]);
      
      if (driver.rows.length > 0) {
        console.log(`✅ Driver found: ${driver.rows[0].name}`);
        isDriver = true;
        
        // Create a user-like object from driver data
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
        // No user found in either table - create new user
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
    
    // Check if user is trying to login as driver but is not a driver
    if (role === 'driver' && user.rows[0].role !== 'driver') {
      // Check if this email exists in drivers table
      const driverCheck = await pool.query('SELECT * FROM drivers WHERE email = $1', [cleanEmail]);
      if (driverCheck.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'You are not registered as a driver. Please contact admin.' 
        });
      } else {
        // Update user object with driver data
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

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    
    // Delete old OTP
    otpStore.delete(email);
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    otpStore.set(email, { otp, expiresAt, attempts: 0, createdAt: Date.now() });
    
    console.log(`\n📧 RESEND OTP for ${email}: ${otp}\n`);
    
    // Send email
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
export const validateToken = async (req, res) => {
  try {
    // If we reach here, the protect middleware has validated the token
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
// Admin Login
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