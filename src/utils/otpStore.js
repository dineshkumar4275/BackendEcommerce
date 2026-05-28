// utils/otpStore.js
// Simple in-memory OTP store (for development)
// In production, use Redis or database

const otpStore = new Map();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [identifier, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(identifier);
      console.log(`🗑️ Cleaned expired OTP for ${identifier}`);
    }
  }
}, 5 * 60 * 1000);

// Save OTP using phone or email as identifier
export const saveOTP = (identifier, otp) => {
  otpStore.set(identifier, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    createdAt: Date.now()
  });
  console.log(`💾 OTP saved for ${identifier}: ${otp} (expires in 10 min)`);
  return true;
};

// Verify OTP
export const verifyOTP = (identifier, otp) => {
  const record = otpStore.get(identifier);
  
  if (!record) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (record.expiresAt < Date.now()) {
    otpStore.delete(identifier);
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (record.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // OTP verified successfully, delete it
  otpStore.delete(identifier);
  console.log(`✅ OTP verified for ${identifier}`);
  return { valid: true, message: 'OTP verified' };
};

// For debugging (optional)
export const getOTPInfo = (identifier) => {
  return otpStore.get(identifier);
};

// Generate random OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};