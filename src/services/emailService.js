import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// SMTP Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify SMTP connection (IMPORTANT)
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP ERROR:', error);
  } else {
    console.log('✅ SMTP READY');
  }
});
export const sendAdminOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Driver App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Admin OTP',
      html: `
        <div>
          <h2>Admin Login OTP</h2>
          <p>Your OTP is: <b>${otp}</b></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Admin OTP sent to ${email}`);
    return true;

  } catch (error) {
    console.log('❌ Admin OTP error:', error.message);
    return false;
  }
};
// Email format validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Send OTP Email
export const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    // Validate email
    if (!email || !isValidEmail(email)) {
      console.log(`❌ Invalid email: ${email}`);
      console.log(`📱 OTP (DEV MODE): ${otp}`);
      return true;
    }

    const mailOptions = {
      from: `"Driver App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial; max-width: 500px;">
          <h2 style="color:#6366F1;">OTP Verification</h2>
          <p>Hello ${name},</p>

          <p>Your OTP is:</p>

          <div style="
            font-size:28px;
            font-weight:bold;
            padding:15px;
            background:#F3F4F6;
            text-align:center;
            border-radius:8px;
            color:#111827;">
            ${otp}
          </div>

          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn’t request this, ignore this email.</p>

          <hr />
          <small>Driver App System</small>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ OTP email sent to ${email}`);
    return true;

  } catch (error) {
    console.log('❌ Email send error:', error.message);

    // fallback dev mode
    console.log(`📱 OTP (FALLBACK): ${otp}`);

    return false;
  }
};