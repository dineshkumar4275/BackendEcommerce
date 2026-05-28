import pool from "../../../lib/db.js";

export default async function handler(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM drivers ORDER BY id DESC"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}