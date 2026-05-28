const otpMap = new Map();

export function saveOTP(email, otp) {
  otpMap.set(email, {
    otp,
    expires: Date.now() + 10 * 60 * 1000, // 10 min
  });
}

export function verifyOTP(email, otp) {
  const data = otpMap.get(email);

  if (!data) {
    return { valid: false, message: "OTP not found" };
  }

  if (Date.now() > data.expires) {
    otpMap.delete(email);
    return { valid: false, message: "OTP expired" };
  }

  if (data.otp !== otp) {
    return { valid: false, message: "Invalid OTP" };
  }

  otpMap.delete(email);
  return { valid: true };
}