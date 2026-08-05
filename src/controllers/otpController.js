// backend/src/controllers/otpController.js
import pool from '../config/database.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// ============================================
// ✅ SEND OTP
// ============================================
export const sendOTP = async (req, res) => {
  try {
    console.log('\n📱 ===== SEND OTP REQUEST =====');
    console.log('  Body:', req.body);
    console.log('================================\n');

    const { email, phone } = req.body;
    const contact = email || phone;

    if (!contact) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`📱 Generated OTP: ${otp} for ${contact}`);

    // Save OTP to database
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

      // Delete old OTPs for this contact
      await pool.query(
        'DELETE FROM otps WHERE contact = $1',
        [contact]
      );

      // Insert new OTP
      await pool.query(
        `INSERT INTO otps (contact, type, otp, purpose, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [contact, 'email', otp, 'login', expiresAt]
      );
      console.log('✅ OTP saved to database');
    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
    }

    // Send email
    let emailSent = false;
    try {
      emailSent = await sendEmailOTP(contact, otp);
    } catch (emailError) {
      console.error('❌ Email error:', emailError.message);
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    return res.status(200).json({
      success: true,
      message: emailSent ? 'OTP sent to your email' : 'OTP generated',
      data: {
        contact,
        expiresIn: '10 minutes',
        emailSent,
        ...(isDevelopment && { otp }),
      }
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ✅ VERIFY OTP
// ============================================
export const verifyOTP = async (req, res) => {
  try {
    console.log('\n📱 ===== VERIFY OTP REQUEST =====');
    console.log('  Body:', req.body);
    console.log('================================\n');

    // Accept both 'contact' and 'email' fields
    const { contact, email, phone, otp } = req.body;
    const userContact = contact || email || phone;

    // Validate input
    if (!userContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact (email or phone) is required'
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    if (otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits'
      });
    }

    console.log(`📱 Verifying OTP: ${otp} for ${userContact}`);

    // ✅ DEVELOPMENT MODE - Accept any 6-digit OTP
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Accepting any OTP');
      
      let user = null;
      
      try {
        // Check if user exists
        if (pool) {
          const userResult = await pool.query(
            'SELECT id, name, email, phone, role FROM users WHERE email = $1 OR phone = $1',
            [userContact]
          );
          user = userResult.rows[0];
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError.message);
      }

      if (!user) {
        try {
          if (pool) {
            const checkUser = await pool.query(
              'SELECT id FROM users WHERE email = $1 OR phone = $1',
              [userContact]
            );

            if (checkUser.rows.length === 0) {
              const newUser = await pool.query(
                `INSERT INTO users (email, phone, name, role, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 RETURNING id, name, email, phone, role`,
                [
                  userContact.includes('@') ? userContact : null,
                  !userContact.includes('@') ? userContact : null,
                  userContact.split('@')[0] || 'User',
                  'user'
                ]
              );
              user = newUser.rows[0];
              console.log('✅ New user created');
            } else {
              const existingUser = await pool.query(
                'SELECT id, name, email, phone, role FROM users WHERE email = $1 OR phone = $1',
                [userContact]
              );
              user = existingUser.rows[0];
            }
          } else {
            user = {
              id: 1,
              name: userContact.split('@')[0] || 'User',
              email: userContact.includes('@') ? userContact : null,
              phone: !userContact.includes('@') ? userContact : null,
              role: 'user'
            };
          }
        } catch (dbError) {
          console.error('❌ User creation error:', dbError.message);
          user = {
            id: 1,
            name: userContact.split('@')[0] || 'User',
            email: userContact.includes('@') ? userContact : null,
            phone: !userContact.includes('@') ? userContact : null,
            role: 'user'
          };
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id || 1,
          email: user.email || userContact,
          phone: user.phone || null,
          role: user.role || 'user'
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

      // Delete OTP
      try {
        if (pool) {
          await pool.query(
            'DELETE FROM otps WHERE contact = $1',
            [userContact]
          );
        }
      } catch (dbError) {
        console.log('⚠️ Could not delete OTP');
      }

      // Return success with token
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: user.id || 1,
            name: user.name || 'User',
            email: user.email || userContact,
            phone: user.phone || null,
            role: user.role || 'user'
          },
          token: token
        }
      });
    }

    // ✅ PRODUCTION - Verify from database
    if (!pool) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const result = await pool.query(
      `SELECT * FROM otps 
       WHERE contact = $1 
       AND otp = $2 
       AND expires_at > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userContact, otp]
    );

    if (result.rows.length === 0) {
      const expiredResult = await pool.query(
        `SELECT * FROM otps 
         WHERE contact = $1 
         AND otp = $2 
         AND expires_at <= NOW()
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userContact, otp]
      );

      if (expiredResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // Delete used OTP
    await pool.query(
      'DELETE FROM otps WHERE contact = $1',
      [userContact]
    );

    // Get or create user
    let userResult = await pool.query(
      'SELECT id, name, email, phone, role FROM users WHERE email = $1 OR phone = $1',
      [userContact]
    );

    let user = userResult.rows[0];

    if (!user) {
      const newUser = await pool.query(
        `INSERT INTO users (email, phone, name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, name, email, phone, role`,
        [
          userContact.includes('@') ? userContact : null,
          !userContact.includes('@') ? userContact : null,
          userContact.split('@')[0] || 'User',
          'user'
        ]
      );
      user = newUser.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role || 'user'
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
          role: user.role || 'user'
        },
        token: token
      }
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error.message);
    console.error('  Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ✅ RESEND OTP
// ============================================
export const resendOTP = async (req, res) => {
  try {
    console.log('\n📱 ===== RESEND OTP REQUEST =====');
    console.log('  Body:', req.body);
    console.log('================================\n');

    const { contact, email } = req.body;
    const userContact = contact || email;

    if (!userContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact is required'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      if (pool) {
        await pool.query(
          'DELETE FROM otps WHERE contact = $1',
          [userContact]
        );

        await pool.query(
          `INSERT INTO otps (contact, type, otp, purpose, expires_at, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [userContact, 'email', otp, 'login', expiresAt]
        );
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
    }

    // Send email
    await sendEmailOTP(userContact, otp);

    const isDevelopment = process.env.NODE_ENV === 'development';

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        contact: userContact,
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

// ============================================
// ✅ SEND EMAIL OTP
// ============================================
async function sendEmailOTP(email, otp) {
  try {
    console.log(`📧 Sending OTP to ${email}...`);

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn('⚠️ Email credentials not configured');
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

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
          .header { background: linear-gradient(135deg, #6c63ff, #4a3fcf); padding: 30px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .otp-box { background: #f0f0ff; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #6c63ff; }
          .info { color: #666; font-size: 14px; line-height: 1.6; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
          .highlight { color: #6c63ff; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 OTP Verification</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">You requested an OTP to log in to your account.</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p class="info">This OTP is valid for <span class="highlight">10 minutes</span>.</p>
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
      from: `"Sombu Store" <${emailUser}>`,
      to: email,
      subject: `🔐 Your OTP - Sombu Store`,
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

export default {
  sendOTP,
  verifyOTP,
  resendOTP
};