import pool from "../../../lib/db.js";
import { saveOTP } from "../../../lib/otpStore.js";

export default async function handler(req, res) {
  try {
    const { email } = req.body;

    const driver = await pool.query(
      "SELECT id, name, email FROM drivers WHERE email=$1",
      [email]
    );

    if (driver.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    saveOTP(email, otp);

    console.log("OTP SENT:", email, otp); // debug

    res.json({
      success: true,
      message: "OTP sent successfully",
      otp, // remove in production
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}