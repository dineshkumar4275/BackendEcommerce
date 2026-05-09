import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export function setupSocketIO(io) {
  const driverLastSeen = new Map();

  console.log('🔌 Socket Manager Started');

  // ================= AUTH =================
  io.use((socket, next) => {
    const { token, driverId, role, userId } = socket.handshake.auth;

    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
      }

      if (role === 'driver' && driverId) {
        socket.driverId = Number(driverId);
        socket.userRole = 'driver';
        socket.userId = Number(driverId);

        console.log(`🚚 Driver ${socket.driverId} authenticated`);
      }

      next();
    } catch (err) {
      console.log('Auth error:', err.message);
      next();
    }
  });

  // ================= CONNECTION =================
  io.on('connection', (socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    // DRIVER ONLINE
    if (socket.driverId) {
      driverLastSeen.set(socket.driverId, Date.now());

      pool.query(
        `UPDATE drivers SET is_available = true WHERE id = $1`,
        [socket.driverId]
      );

      console.log(`🟢 Driver ${socket.driverId} ONLINE`);
    }

    // ================= HEARTBEAT =================
    socket.on('driver-heartbeat', async (data) => {
      const driverId = socket.driverId || data.driverId;
      if (!driverId) return;

      driverLastSeen.set(driverId, Date.now());

      await pool.query(
        `UPDATE drivers 
         SET is_available = true, last_location_update = NOW()
         WHERE id = $1`,
        [driverId]
      );
    });

    // ================= DISCONNECT =================
    socket.on('disconnect', async () => {
      console.log(`❌ Disconnected: ${socket.id}`);

      const driverId = socket.driverId;

      if (driverId) {
        driverLastSeen.delete(driverId);

        await pool.query(
          `UPDATE drivers 
           SET is_available = false 
           WHERE id = $1`,
          [driverId]
        );

        console.log(`🔴 Driver ${driverId} OFFLINE`);
      }
    });
  });

  // ================= CLEANUP OFFLINE DRIVERS =================
  setInterval(async () => {
    const now = Date.now();
    const TIMEOUT = 30000; // 30 sec

    for (const [driverId, lastSeen] of driverLastSeen.entries()) {
      if (now - lastSeen > TIMEOUT) {
        console.log(`⛔ Driver ${driverId} TIMEOUT OFFLINE`);

        driverLastSeen.delete(driverId);

        await pool.query(
          `UPDATE drivers SET is_available = false WHERE id = $1`,
          [driverId]
        );
      }
    }
  }, 10000);
}