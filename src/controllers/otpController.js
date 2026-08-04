// src/controllers/otpController.js
import pool from '../config/database.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// ============================================
// ✅ EMAIL TRANSPORTER
// ============================================
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log('📧 Email Config:');
  console.log(`  EMAIL_USER: ${emailUser}`);
  console.log(`  EMAIL_PASS: ${emailPass ? '✅ Set' : '❌ Missing'}`);

  if (!emailUser || !emailPass) {
    console.error('❌ Email credentials missing');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Email transporter created');
    return transporter;
  } catch (error) {
    console.error('❌ Email config error:', error.message);
    return null;
  }
}

// ============================================
// ✅ SEND EMAIL OTP
// ============================================
async function sendEmailOTP(email, otp, purpose = 'login') {
  try {
    console.log(`📧 Sending OTP to ${email}...`);
    
    const transporter = getTransporter();
    if (!transporter) {
      console.error('❌ No transporter available');
      return false;
    }

    // Check if this is the admin email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const isAdmin = email === adminEmail;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
          .header { 
            background: ${isAdmin ? 'linear-gradient(135deg, #ff6b35, #d63031)' : 'linear-gradient(135deg, #6c63ff, #4a3fcf)'}; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .header .badge { 
            display: inline-block; 
            background: rgba(255,255,255,0.2); 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            color: #fff; 
            margin-top: 8px;
          }
          .content { padding: 40px 30px; }
          .otp-box { 
            background: ${isAdmin ? '#fff5f0' : '#f0f0ff'}; 
            border-radius: 10px; 
            padding: 20px; 
            text-align: center; 
            margin: 20px 0;
            border: ${isAdmin ? '2px solid #ff6b35' : '2px solid #6c63ff'};
          }
          .otp-code { 
            font-size: 48px; 
            font-weight: bold; 
            letter-spacing: 10px; 
            color: ${isAdmin ? '#d63031' : '#6c63ff'}; 
          }
          .info { color: #666; font-size: 14px; line-height: 1.6; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
          .highlight { color: #6c63ff; font-weight: bold; }
          .admin-highlight { color: #d63031; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isAdmin ? '🛡️ Admin OTP Verification' : '🔐 OTP Verification'}</h1>
            ${isAdmin ? '<div class="badge">🔑 Admin Access</div>' : ''}
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #333;">Hello${isAdmin ? ' Admin' : ''},</p>
            <p style="font-size: 16px; color: #333;">
              You requested an OTP to ${isAdmin ? 'access the admin dashboard' : 'log in to your account'}.
            </p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            ${isAdmin ? '<p style="color: #d63031; font-weight: bold;">⚠️ This is an admin login. Keep this OTP secure.</p>' : ''}
            <p class="info">This OTP is valid for <span class="${isAdmin ? 'admin-highlight' : 'highlight'}">10 minutes</span>.</p>
            <p class="info">If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Sombu Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Sombu Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isAdmin 
        ? `🛡️ Admin OTP for Dashboard Access - Sombu Store` 
        : `🔐 Your OTP - Sombu Store`,
      html: htmlContent,
      text: `Your OTP is: ${otp}. Valid for 10 minutes.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    console.log(`  Message ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return false;
  }
}

// ============================================
// ✅ SEND OTP CONTROLLER
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

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // ✅ Check if this is the admin email (from .env)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const isAdmin = contact === adminEmail;
    
    console.log(`📱 Generated OTP for ${contact}: ${otp} ${isAdmin ? '(ADMIN)' : ''}`);

    // ✅ Save OTP to database
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS otps (
          id SERIAL PRIMARY KEY,
          contact VARCHAR(255) NOT NULL,
          type VARCHAR(20) DEFAULT 'email',
          otp VARCHAR(6) NOT NULL,
          purpose VARCHAR(20) DEFAULT 'login',
          is_admin BOOLEAN DEFAULT FALSE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(
        `INSERT INTO otps (contact, type, otp, purpose, is_admin, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (contact) 
         DO UPDATE SET otp = $3, is_admin = $5, expires_at = $6, created_at = NOW()`,
        [contact, type, otp, 'login', isAdmin, expiresAt]
      );
      console.log('✅ OTP saved to database');
    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
    }

    // ✅ Send OTP via email
    let emailSent = false;
    if (type === 'email') {
      emailSent = await sendEmailOTP(contact, otp, isAdmin ? 'admin' : 'login');
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    // ✅ Return response
    return res.status(200).json({
      success: true,
      message: emailSent 
        ? `✅ OTP sent to ${isAdmin ? 'admin' : 'your'} email` 
        : '⚠️ OTP generated but email sending failed. Check logs.',
      data: {
        contact,
        type,
        isAdmin,
        expiresIn: '10 minutes',
        emailSent,
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
// ✅ VERIFY OTP CONTROLLER
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

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const isAdmin = contact === adminEmail;

    // ✅ DEVELOPMENT MODE - Accept any 6-digit OTP
    if (process.env.NODE_ENV === 'development') {
      // Check if user exists
      let userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR phone = $1',
        [contact]
      );

      let user = userResult.rows[0];
      
      if (!user) {
        const role = isAdmin ? 'admin' : 'user';
        const newUser = await pool.query(
          `INSERT INTO users (email, phone, name, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING *`,
          [
            contact.includes('@') ? contact : null,
            !contact.includes('@') ? contact : null,
            isAdmin ? 'Admin' : (contact.split('@')[0] || 'User'),
            role
          ]
        );
        user = newUser.rows[0];
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role || (isAdmin ? 'admin' : 'user'),
          isAdmin: isAdmin || user.role === 'admin'
        },
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
            role: user.role || (isAdmin ? 'admin' : 'user')
          },
          token,
          isAdmin: isAdmin || user.role === 'admin'
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
      const role = isAdmin ? 'admin' : 'user';
      const newUser = await pool.query(
        `INSERT INTO users (email, phone, name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [
          contact.includes('@') ? contact : null,
          !contact.includes('@') ? contact : null,
          isAdmin ? 'Admin' : (contact.split('@')[0] || 'User'),
          role
        ]
      );
      user = newUser.rows[0];
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role || (isAdmin ? 'admin' : 'user'),
        isAdmin: isAdmin || user.role === 'admin'
      },
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
          role: user.role || (isAdmin ? 'admin' : 'user')
        },
        token,
        isAdmin: isAdmin || user.role === 'admin'
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
// ✅ RESEND OTP CONTROLLER
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

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const isAdmin = contact === adminEmail;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `UPDATE otps 
       SET otp = $1, expires_at = $2, created_at = NOW()
       WHERE contact = $3`,
      [otp, expiresAt, contact]
    );

    if (contact.includes('@')) {
      await sendEmailOTP(contact, otp, isAdmin ? 'admin' : 'login');
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        contact,
        isAdmin,
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

export default {
  sendOTP,
  verifyOTP,
  resendOTP
};