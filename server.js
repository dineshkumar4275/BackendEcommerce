// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import http from 'http';
// import { Server } from 'socket.io';
// import jwt from 'jsonwebtoken';
// import pool from './src/config/database.js';

// // Import all routes
// import productRoutes from './src/routes/productRoutes.js';
// import authRoutes from './src/routes/authRoutes.js';
// import { setupSocketIO } from './src/socket/socketManager.js';
// import dashboardRoutes from './src/routes/dashboardRoutes.js';
// import orderRoutes from './src/routes/orderRoutes.js';
// import trackingRoutes from './src/routes/trackingRoutes.js';
// import driverRoutes from './src/routes/driverRoutes.js';
// import wishlistRoutes from './src/routes/wishlistRoutes.js';
// import razorpayRoutes from './src/routes/razorpayRoutes.js';
// import userRoutes from './src/routes/userRoutes.js';

// dotenv.config();

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:3000", "http://localhost:3001", "http://192.168.1.100:3000", "exp://192.168.1.4:8081"],
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     credentials: true
//   }
// });

// // CORS middleware
// app.use(cors({
//   origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.*'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// const PORT = process.env.PORT || 5000;

// // Make io available to routes
// app.set('io', io);

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ============ REGISTER ROUTES (ALL OF THEM) ============
// app.use('/api/products', productRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/tracking', trackingRoutes);
// app.use('/api/drivers', driverRoutes);
// app.use('/api/wishlist', wishlistRoutes);
// app.use('/api/razorpay', razorpayRoutes);
// app.use('/api/users', userRoutes);
// // ============ SOCKET.IO FOR REAL-TIME DRIVER TRACKING ============
// io.use((socket, next) => {
//   const auth = socket.handshake.auth;
  
//   if (auth && auth.driverId) {
//     socket.driverId = auth.driverId;
//     socket.userRole = 'driver';
//     console.log(`Driver ${socket.driverId} authenticated via socket`);
//     return next();
//   }
  
//   socket.userRole = 'guest';
//   next();
// });

// io.on('connection', (socket) => {
//   console.log(`✅ Client connected: ${socket.id} (Role: ${socket.userRole}`);

//   if (socket.userRole === 'driver') {
//     socket.join(`driver_${socket.userId}`);
//     console.log(`🚚 Driver ${socket.userId} joined driver room`);
//     socket.emit('available-orders', { message: 'You can now receive orders' });
//   }

//   socket.on('driver-location', async (data) => {
//     const { latitude, longitude, orderId } = data;
//     const driverId = socket.userId;
    
//     if (!driverId) return;
    
//     console.log(`📍 Driver ${driverId} location: ${latitude}, ${longitude}`);
    
//     try {
//       await pool.query(
//         `UPDATE drivers SET current_latitude = $1, current_longitude = $2, last_location_update = NOW() WHERE id = $3`,
//         [latitude, longitude, driverId]
//       );
      
//       if (orderId) {
//         await pool.query(
//           `INSERT INTO tracking (order_id, driver_id, status, latitude, longitude, created_at) 
//            VALUES ($1, $2, 'in_transit', $3, $4, NOW())`,
//           [orderId, driverId, latitude, longitude]
//         );
//         io.to(`order_${orderId}`).emit('driver-location', { orderId, driverId, latitude, longitude, timestamp: new Date() });
//       }
      
//       io.emit('all-drivers-location', { driverId, latitude, longitude, timestamp: new Date() });
//     } catch (error) {
//       console.error('Location update error:', error);
//     }
//   });

//   socket.on('track-order', (orderId) => {
//     socket.join(`order_${orderId}`);
//     console.log(`📍 Order ${orderId} tracking started by ${socket.userRole}`);
//     socket.emit('order-status', { orderId, status: 'tracking-started' });
//   });

//   socket.on('update-order-status', async (data) => {
//     const { orderId, status, location } = data;
//     const driverId = socket.userId;
    
//     console.log(`📦 Order ${orderId} status updated to: ${status}`);
    
//     try {
//       await pool.query(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, [status, orderId]);
//       await pool.query(`INSERT INTO tracking (order_id, driver_id, status, location, created_at) VALUES ($1, $2, $3, $4, NOW())`, [orderId, driverId, status, location || status]);
//       io.to(`order_${orderId}`).emit('order-status-update', { orderId, status, location: location || status, driverId, timestamp: new Date() });
      
//       if (status === 'delivered') {
//         io.to(`order_${orderId}`).emit('order-delivered', { orderId, message: 'Your order has been delivered!', timestamp: new Date() });
//       }
//     } catch (error) {
//       console.error('Status update error:', error);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log(`❌ Client disconnected: ${socket.id}`);
//   });
// });

// // ============ HEALTH CHECK ============
// app.get('/api/health', (req, res) => {
//   res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
// });

// // ============ DRIVER DIRECT ROUTES (BACKUP) ============
// // GET /api/drivers/all - Direct route
// app.get('/api/drivers/all', async (req, res) => {
//   try {
//     console.log('📋 GET /api/drivers/all (direct)');
//     const result = await pool.query('SELECT id, name, phone, vehicle_number, is_available, current_latitude, current_longitude, email FROM drivers ORDER BY id');
//     res.json({ success: true, data: result.rows, total: result.rows.length });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // ============ 404 HANDLER (MUST BE LAST) ============
// app.use('*', (req, res) => {
//   console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
//   res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
// });

// // ============ ERROR HANDLER ============
// app.use((err, req, res, next) => {
//   console.error('Error:', err.stack);
//   res.status(500).json({ success: false, message: 'Internal server error' });
// });

// // ============ START SERVER ============
// server.listen(PORT, () => {
//   console.log(`\n🚀 Server running on http://localhost:${PORT}`);
//   console.log(`🔌 WebSocket server ready`);
//   console.log(`\n📦 API Endpoints:`);
//   console.log(`   ✅ POST  /api/auth/send-otp`);
//   console.log(`   ✅ POST  /api/auth/verify-otp`);
//   console.log(`   ✅ GET   /api/products`);
//   console.log(`   ✅ GET   /api/orders`);
//   console.log(`   ✅ GET   /api/wishlist`);
//   console.log(`   ✅ GET   /api/drivers/all`);
//   console.log(`   ✅ GET   /api/tracking/:orderId`);
// });
// server.js (Updated with all routes)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from './src/config/database.js';

// Import all routes
import productRoutes from './src/routes/productRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import trackingRoutes from './src/routes/trackingRoutes.js';
import driverRoutes from './src/routes/driverRoutes.js';
import wishlistRoutes from './src/routes/wishlistRoutes.js';
import razorpayRoutes from './src/routes/razorpayRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "exp://192.168.1.4:8081"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

// CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'exp://192.168.1.4:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 5000;

// Make io available to routes
app.set('io', io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ REGISTER ROUTES ============
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
// ============ SOCKET.IO FOR REAL-TIME ============
io.use((socket, next) => {
  const auth = socket.handshake.auth;
  
  if (auth && auth.driverId) {
    socket.driverId = auth.driverId;
    socket.userRole = 'driver';
    console.log(`Driver ${socket.driverId} authenticated via socket`);
    return next();
  }
  
  if (auth && auth.userId) {
    socket.userId = auth.userId;
    socket.userRole = 'user';
    console.log(`User ${socket.userId} authenticated`);
    return next();
  }
  
  socket.userRole = 'guest';
  next();
});

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id} (Role: ${socket.userRole})`);

  // Driver joins their room
  if (socket.driverId) {
    socket.join(`driver_${socket.driverId}`);
    console.log(`🚚 Driver ${socket.driverId} joined driver room`);
  }
  
  // User joins their room
  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
    console.log(`👤 User ${socket.userId} joined user room`);
  }

  // Driver location updates
  socket.on('driver-location', async (data) => {
    const { latitude, longitude, orderId } = data;
    const driverId = socket.driverId;
    
    if (!driverId) return;
    
    try {
      await pool.query(
        `UPDATE drivers SET current_latitude = $1, current_longitude = $2, last_location_update = NOW() WHERE id = $3`,
        [latitude, longitude, driverId]
      );
      
      if (orderId) {
        io.to(`order_${orderId}`).emit('driver-location', {
          driverId,
          latitude,
          longitude,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Location update error:', error);
    }
  });

  // Order tracking
  socket.on('track-order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`📍 Order ${orderId} tracking started`);
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    
    if (socket.driverId) {
      await pool.query(
        `UPDATE drivers SET is_available = false WHERE id = $1`,
        [socket.driverId]
      );
      console.log(`🔴 Driver ${socket.driverId} set offline`);
    }
  });
});

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

// ============ 404 HANDLER ============
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ============ START SERVER ============
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`\n📦 API Endpoints:`);
  console.log(`   ✅ POST  /api/drivers/send-otp`);
  console.log(`   ✅ POST  /api/drivers/verify-otp`);
  console.log(`   ✅ GET   /api/drivers/available-orders`);
  console.log(`   ✅ GET   /api/drivers/my-orders`);
  console.log(`   ✅ GET   /api/drivers/earnings`);
  console.log(`   ✅ GET   /api/drivers/order/:orderId`);
  console.log(`   ✅ PUT   /api/drivers/order/:orderId/status`);
  console.log(`   ✅ GET   /api/orders/my-orders`);
  console.log(`   ✅ GET   /api/orders/track/:orderNumber`);
});