import pool from "../../../lib/db.js";
import jwt from "jsonwebtoken";
import { verifyOTP } from "../../../lib/otpStore.js";

export default async function handler(req, res) {
  try {
    const { email, otp } = req.body;

    const check = verifyOTP(email, otp);

    if (!check.valid) {
      return res.status(400).json({
        success: false,
        message: check.message,
      });
    }

    const driver = await pool.query(
      "SELECT * FROM drivers WHERE email=$1",
      [email]
    );

    const token = jwt.sign(
      { id: driver.rows[0].id, role: "driver" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token,
      user: driver.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}