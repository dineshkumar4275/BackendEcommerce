// utils/otpStore.js
// Simple in-memory OTP store (for development)
// In production, use Redis or database

const otpStore = new Map();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(email);
      console.log(`🗑️ Cleaned expired OTP for ${email}`);
    }
  }
}, 5 * 60 * 1000);

export const saveOTP = (email, otp) => {
  // OTP expires in 10 minutes
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    createdAt: Date.now()
  });
  console.log(`💾 OTP saved for ${email}: ${otp} (expires in 10 min)`);
  return true;
};

export const verifyOTP = (email, otp) => {
  const record = otpStore.get(email);
  
  if (!record) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (record.expiresAt < Date.now()) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (record.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // OTP verified successfully, delete it
  otpStore.delete(email);
  console.log(`✅ OTP verified for ${email}`);
  return { valid: true, message: 'OTP verified' };
};

// For debugging (optional)
export const getOTPInfo = (email) => {
  return otpStore.get(email);
};