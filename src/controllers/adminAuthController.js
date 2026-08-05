// backend/src/controllers/adminAuthController.js
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ============================================
// ✅ ADMIN LOGIN - Step 1: Password Verification
// ============================================
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Get admin user
        const result = await pool.query(
            `SELECT * FROM users 
             WHERE email = $1 AND is_admin = TRUE`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            // Log failed attempt
            await logAdminActivity(null, 'LOGIN_FAILED', req, { email });
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = result.rows[0];

        // ✅ Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
            return res.status(403).json({
                success: false,
                message: `Account locked. Try again in ${remainingMinutes} minutes`,
                locked: true,
                remainingMinutes
            });
        }

        // ✅ Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Increment login attempts
            await pool.query(
                `UPDATE users SET 
                    login_attempts = COALESCE(login_attempts, 0) + 1,
                    locked_until = CASE 
                        WHEN COALESCE(login_attempts, 0) + 1 >= 5 
                        THEN NOW() + INTERVAL '30 minutes' 
                        ELSE locked_until 
                    END
                 WHERE id = $1`,
                [user.id]
            );

            await logAdminActivity(user.id, 'LOGIN_FAILED', req, { reason: 'Invalid password' });

            const remainingAttempts = 5 - (user.login_attempts || 0) - 1;
            return res.status(401).json({
                success: false,
                message: `Invalid password. ${remainingAttempts} attempts remaining`,
                remainingAttempts
            });
        }

        // ✅ Reset login attempts on successful password
        await pool.query(
            `UPDATE users SET 
                login_attempts = 0,
                locked_until = NULL,
                last_login = NOW()
             WHERE id = $1`,
            [user.id]
        );

        // ✅ Generate 2FA code
        const twoFactorCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save 2FA code
        await pool.query(
            `INSERT INTO two_factor_codes (user_id, code, purpose, expires_at)
             VALUES ($1, $2, 'admin_login', $3)`,
            [user.id, twoFactorCode, expiresAt]
        );

        // ✅ Send 2FA code via email
        await send2FACodeEmail(user.email, twoFactorCode, user.name);

        await logAdminActivity(user.id, '2FA_SENT', req, { email: user.email });

        return res.json({
            success: true,
            message: 'Password verified. 2FA code sent to your email.',
            requires2FA: true,
            userId: user.id,
            email: user.email,
            // Only for development
            ...(process.env.NODE_ENV === 'development' && { testCode: twoFactorCode })
        });

    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// ============================================
// ✅ VERIFY 2FA CODE - Step 2
// ============================================
export const verify2FA = async (req, res) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({
                success: false,
                message: 'User ID and 2FA code are required'
            });
        }

        // ✅ Verify 2FA code
        const result = await pool.query(
            `SELECT * FROM two_factor_codes 
             WHERE user_id = $1 
             AND code = $2 
             AND purpose = 'admin_login'
             AND expires_at > NOW()
             AND used = FALSE
             ORDER BY created_at DESC 
             LIMIT 1`,
            [userId, code]
        );

        if (result.rows.length === 0) {
            await logAdminActivity(userId, '2FA_FAILED', req, { reason: 'Invalid or expired code' });
            
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired 2FA code'
            });
        }

        // ✅ Mark code as used
        await pool.query(
            `UPDATE two_factor_codes SET used = TRUE WHERE id = $1`,
            [result.rows[0].id]
        );

        // ✅ Get user
        const userResult = await pool.query(
            `SELECT id, name, email, role FROM users WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        // ✅ Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // ✅ Create admin session
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await pool.query(
            `INSERT INTO admin_sessions (user_id, session_token, ip_address, user_agent, expires_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                user.id,
                sessionToken,
                req.ip || req.headers['x-forwarded-for'] || '',
                req.headers['user-agent'] || '',
                sessionExpires
            ]
        );

        await logAdminActivity(user.id, 'LOGIN_SUCCESS', req, { sessionToken });

        return res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token,
                sessionToken
            }
        });

    } catch (error) {
        console.error('2FA verification error:', error);
        return res.status(500).json({
            success: false,
            message: '2FA verification failed',
            error: error.message
        });
    }
};

// ============================================
// ✅ RESEND 2FA CODE
// ============================================
export const resend2FACode = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Get user
        const userResult = await pool.query(
            `SELECT id, name, email FROM users WHERE id = $1 AND is_admin = TRUE`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Admin user not found'
            });
        }

        const user = userResult.rows[0];

        // Generate new 2FA code
        const twoFactorCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Save new code
        await pool.query(
            `INSERT INTO two_factor_codes (user_id, code, purpose, expires_at)
             VALUES ($1, $2, 'admin_login', $3)`,
            [user.id, twoFactorCode, expiresAt]
        );

        // Send email
        await send2FACodeEmail(user.email, twoFactorCode, user.name);

        await logAdminActivity(user.id, '2FA_RESENT', req, { email: user.email });

        return res.json({
            success: true,
            message: 'New 2FA code sent to your email',
            ...(process.env.NODE_ENV === 'development' && { testCode: twoFactorCode })
        });

    } catch (error) {
        console.error('Resend 2FA error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to resend 2FA code',
            error: error.message
        });
    }
};

// ============================================
// ✅ ADMIN LOGOUT
// ============================================
export const adminLogout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            // Invalidate session
            await pool.query(
                `UPDATE admin_sessions SET is_valid = FALSE WHERE session_token = $1`,
                [token]
            );
        }

        await logAdminActivity(req.user?.id, 'LOGOUT', req);

        return res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Admin logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};

// ============================================
// ✅ GET ADMIN SESSIONS
// ============================================
export const getAdminSessions = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT id, session_token, ip_address, user_agent, 
                    created_at, expires_at, is_valid
             FROM admin_sessions 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        return res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get sessions',
            error: error.message
        });
    }
};

// ============================================
// ✅ REVOKE ADMIN SESSION
// ============================================
export const revokeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `UPDATE admin_sessions 
             SET is_valid = FALSE 
             WHERE id = $1 AND user_id = $2 
             RETURNING *`,
            [sessionId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        await logAdminActivity(userId, 'SESSION_REVOKED', req, { sessionId });

        return res.json({
            success: true,
            message: 'Session revoked successfully'
        });

    } catch (error) {
        console.error('Revoke session error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to revoke session',
            error: error.message
        });
    }
};

// ============================================
// ✅ HELPER: Send 2FA Code Email
// ============================================
async function send2FACodeEmail(email, code, name) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Admin 2FA Verification</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .code { font-size: 48px; font-weight: bold; color: #ff6b35; letter-spacing: 10px; text-align: center; padding: 20px; background: #f8f8f8; border-radius: 10px; margin: 20px 0; }
                    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🛡️ Admin 2FA Verification</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p style="font-size: 16px; color: #333;">Hello ${name},</p>
                        <p style="font-size: 16px; color: #333;">Use the verification code below to complete your admin login:</p>
                        <div class="code">${code}</div>
                        <div class="warning">
                            ⚠️ This code is valid for <strong>10 minutes</strong>.
                            <br>
                            <strong>Never share this code with anyone.</strong>
                        </div>
                        <p style="font-size: 14px; color: #666;">If you didn't request this, please secure your account immediately.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                        <p>&copy; ${new Date().getFullYear()} Sombu Store. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: `"Sombu Store" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🛡️ Admin 2FA Verification Code - Sombu Store',
            html: htmlContent,
            text: `Your admin 2FA verification code is: ${code}\n\nThis code is valid for 10 minutes.\nNever share this code with anyone.`
        });

        console.log(`✅ 2FA code sent to ${email}`);
        return true;

    } catch (error) {
        console.error('❌ 2FA email error:', error.message);
        return false;
    }
}

// ============================================
// ✅ HELPER: Log Admin Activity
// ============================================
async function logAdminActivity(userId, action, req, details = {}) {
    try {
        await pool.query(
            `INSERT INTO admin_activity_log (user_id, action, ip_address, user_agent, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                action,
                req.ip || req.headers['x-forwarded-for'] || '',
                req.headers['user-agent'] || '',
                JSON.stringify(details)
            ]
        );
    } catch (error) {
        console.error('Activity log error:', error);
    }
}