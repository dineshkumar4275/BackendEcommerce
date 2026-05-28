import express from "express";
import pool from "../config/database.js";
import jwt from "jsonwebtoken";
import { sendOTPEmail } from "../services/emailService.js";
import { saveOTP, verifyOTP } from "../utils/otpStore.js";

const router = express.Router();

/* ================================
   SEND OTP
================================ */
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required",
      });
    }

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
    await sendOTPEmail(email, otp, driver.rows[0].name);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ================================
   VERIFY OTP
================================ */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const check = verifyOTP(email, otp);

    if (!check.valid) {
      return res.status(401).json({
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
