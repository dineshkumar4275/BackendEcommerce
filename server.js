// // // import express from 'express';
// // // import cors from 'cors';
// // // import dotenv from 'dotenv';
// // // import http from 'http';
// // // import { Server } from 'socket.io';
// // // import pool from './src/config/database.js';

// // // // Routes
// // // import productRoutes from './src/routes/productRoutes.js';
// // // import authRoutes from './src/routes/authRoutes.js';
// // // import dashboardRoutes from './src/routes/dashboardRoutes.js';
// // // import orderRoutes from './src/routes/orderRoutes.js';
// // // import trackingRoutes from './src/routes/trackingRoutes.js';
// // // import driverRoutes from './src/routes/driverRoutes.js';
// // // import wishlistRoutes from './src/routes/wishlistRoutes.js';
// // // import razorpayRoutes from './src/routes/razorpayRoutes.js';
// // // import userRoutes from './src/routes/userRoutes.js';
// // // import notificationRoutes from './src/routes/notificationRoutes.js';
// // // import adminRoutes from './src/routes/adminRoutes.js';

// // // dotenv.config();

// // // const app = express();

// // // /* =========================
// // //    CORS
// // // ========================= */
// // // app.use(cors({
// // //   origin: [
// // //     'http://localhost:3000',
// // //     'http://localhost:3001',
// // //     'https://yourfrontend.vercel.app'
// // //   ],
// // //   credentials: true,
// // //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
// // //   allowedHeaders: ['Content-Type', 'Authorization']
// // // }));

// // // /* =========================
// // //    MIDDLEWARE
// // // ========================= */
// // // app.use(express.json());
// // // app.use(express.urlencoded({ extended: true }));

// // // /* =========================
// // //    ROOT ROUTE
// // // ========================= */
// // // app.get('/', (req, res) => {
// // //   res.json({
// // //     success: true,
// // //     message: 'Ecommerce Backend Running 🚀'
// // //   });
// // // });

// // // /* =========================
// // //    HEALTH CHECK
// // // ========================= */
// // // app.get('/api/health', (req, res) => {
// // //   res.json({
// // //     success: true,
// // //     status: 'OK',
// // //     timestamp: new Date().toISOString()
// // //   });
// // // });

// // // /* =========================
// // //    API ROUTES
// // // ========================= */
// // // app.use('/api/products', productRoutes);
// // // app.use('/api/auth', authRoutes);
// // // app.use('/api/dashboard', dashboardRoutes);
// // // app.use('/api/orders', orderRoutes);
// // // app.use('/api/tracking', trackingRoutes);
// // // app.use('/api/drivers', driverRoutes);
// // // app.use('/api/wishlist', wishlistRoutes);
// // // app.use('/api/razorpay', razorpayRoutes);
// // // app.use('/api/users', userRoutes);
// // // app.use('/api/notifications', notificationRoutes);
// // // app.use('/api/admin', adminRoutes);

// // // /* =========================
// // //    SOCKET.IO
// // // ========================= */
// // // const server = http.createServer(app);

// // // const io = new Server(server, {
// // //   cors: {
// // //     origin: [
// // //       'http://localhost:3000',
// // //       'https://yourfrontend.vercel.app'
// // //     ],
// // //     methods: ['GET', 'POST']
// // //   }
// // // });

// // // app.set('io', io);

// // // io.on('connection', (socket) => {
// // //   console.log(`✅ Client Connected: ${socket.id}`);

// // //   socket.on('track-order', (orderId) => {
// // //     socket.join(`order_${orderId}`);
// // //     console.log(`📍 Tracking Order: ${orderId}`);
// // //   });

// // //   socket.on('driver-location', async (data) => {
// // //     try {
// // //       const { driverId, latitude, longitude, orderId } = data;

// // //       await pool.query(
// // //         `
// // //         UPDATE drivers
// // //         SET current_latitude = $1,
// // //             current_longitude = $2,
// // //             last_location_update = NOW()
// // //         WHERE id = $3
// // //         `,
// // //         [latitude, longitude, driverId]
// // //       );

// // //       io.to(`order_${orderId}`).emit('driver-location-update', {
// // //         driverId,
// // //         latitude,
// // //         longitude,
// // //         timestamp: new Date()
// // //       });

// // //     } catch (error) {
// // //       console.error('Socket Error:', error);
// // //     }
// // //   });

// // //   socket.on('disconnect', () => {
// // //     console.log(`❌ Client Disconnected: ${socket.id}`);
// // //   });
// // // });

// // // /* =========================
// // //    404 HANDLER
// // // ========================= */
// // // app.use((req, res) => {
// // //   res.status(404).json({
// // //     success: false,
// // //     message: `Route ${req.originalUrl} not found`
// // //   });
// // // });

// // // /* =========================
// // //    ERROR HANDLER
// // // ========================= */
// // // app.use((err, req, res, next) => {
// // //   console.error(err.stack);

// // //   res.status(500).json({
// // //     success: false,
// // //     message: 'Internal Server Error'
// // //   });
// // // });

// // // /* =========================
// // //    START SERVER
// // // ========================= */
// // // const PORT = process.env.PORT || 5000;

// // // server.listen(PORT, () => {
// // //   console.log(`🚀 Server Running On Port ${PORT}`);
// // // });

// // import express from 'express';
// // import cors from 'cors';
// // import dotenv from 'dotenv';
// // import http from 'http';
// // import { Server } from 'socket.io';
// // import pool from './src/config/database.js';

// // // Routes
// // import productRoutes from './src/routes/productRoutes.js';
// // import authRoutes from './src/routes/authRoutes.js';
// // import dashboardRoutes from './src/routes/dashboardRoutes.js';
// // import orderRoutes from './src/routes/orderRoutes.js';
// // import trackingRoutes from './src/routes/trackingRoutes.js';
// // import driverRoutes from './src/routes/driverRoutes.js';
// // import wishlistRoutes from './src/routes/wishlistRoutes.js';
// // import razorpayRoutes from './src/routes/razorpayRoutes.js';
// // import userRoutes from './src/routes/userRoutes.js';
// // import notificationRoutes from './src/routes/notificationRoutes.js';
// // import adminRoutes from './src/routes/adminRoutes.js';

// // dotenv.config();

// // const app = express();

// // /* =========================
// //    CORS
// // ========================= */
// // app.use(cors({
// //   origin: [
// //     'http://localhost:3000',
// //     'http://localhost:3001',
// //     'https://frontend-ecommerce-six-self.vercel.app'
// //   ],
// //   credentials: true,
// //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
// //   allowedHeaders: ['Content-Type', 'Authorization']
// // }));

// // /* =========================
// //    MIDDLEWARE
// // ========================= */
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));

// // /* =========================
// //    ROOT ROUTE
// // ========================= */
// // app.get('/', (req, res) => {
// //   res.json({
// //     success: true,
// //     message: 'Ecommerce Backend Running 🚀'
// //   });
// // });

// // /* =========================
// //    HEALTH CHECK
// // ========================= */
// // app.get('/api/health', (req, res) => {
// //   res.json({
// //     success: true,
// //     status: 'OK',
// //     timestamp: new Date().toISOString()
// //   });
// // });

// // /* =========================
// //    API ROUTES
// // ========================= */
// // app.use('/api/products', productRoutes);
// // app.use('/api/auth', authRoutes);
// // app.use('/api/dashboard', dashboardRoutes);
// // app.use('/api/orders', orderRoutes);
// // app.use('/api/tracking', trackingRoutes);
// // app.use('/api/drivers', driverRoutes);
// // app.use('/api/wishlist', wishlistRoutes);
// // app.use('/api/razorpay', razorpayRoutes);
// // app.use('/api/users', userRoutes);
// // app.use('/api/notifications', notificationRoutes);
// // app.use('/api/admin', adminRoutes);

// // /* =========================
// //    SOCKET.IO
// // ========================= */
// // const server = http.createServer(app);

// // const io = new Server(server, {
// //   cors: {
// //     origin: [
// //       'http://localhost:3000',
// //       'https://frontend-ecommerce-six-self.vercel.app'
// //     ],
// //     methods: ['GET', 'POST'],
// //     credentials: true
// //   }
// // });

// // app.set('io', io);

// // io.on('connection', (socket) => {
// //   console.log(`✅ Client Connected: ${socket.id}`);

// //   socket.on('track-order', (orderId) => {
// //     socket.join(`order_${orderId}`);
// //     console.log(`📍 Tracking Order: ${orderId}`);
// //   });

// //   socket.on('driver-location', async (data) => {
// //     try {
// //       const { driverId, latitude, longitude, orderId } = data;

// //       await pool.query(
// //         `
// //         UPDATE drivers
// //         SET current_latitude = $1,
// //             current_longitude = $2,
// //             last_location_update = NOW()
// //         WHERE id = $3
// //         `,
// //         [latitude, longitude, driverId]
// //       );

// //       io.to(`order_${orderId}`).emit('driver-location-update', {
// //         driverId,
// //         latitude,
// //         longitude,
// //         timestamp: new Date()
// //       });

// //     } catch (error) {
// //       console.error('Socket Error:', error);
// //     }
// //   });

// //   socket.on('disconnect', () => {
// //     console.log(`❌ Client Disconnected: ${socket.id}`);
// //   });
// // });

// // /* =========================
// //    404 HANDLER
// // ========================= */
// // app.use((req, res) => {
// //   res.status(404).json({
// //     success: false,
// //     message: `Route ${req.originalUrl} not found`
// //   });
// // });

// // /* =========================
// //    ERROR HANDLER
// // ========================= */
// // app.use((err, req, res, next) => {
// //   console.error(err.stack);

// //   res.status(500).json({
// //     success: false,
// //     message: err.message || 'Internal Server Error'
// //   });
// // });

// // /* =========================
// //    START SERVER
// // ========================= */
// // const PORT = process.env.PORT || 5000;

// // server.listen(PORT, () => {
// //   console.log(`🚀 Server Running On Port ${PORT}`);
// // });
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import pool from './src/config/database.js';

// // Routes
// import productRoutes from './src/routes/productRoutes.js';
// import authRoutes from './src/routes/authRoutes.js';
// import dashboardRoutes from './src/routes/dashboardRoutes.js';
// import orderRoutes from './src/routes/orderRoutes.js';
// import trackingRoutes from './src/routes/trackingRoutes.js';
// import driverRoutes from './src/routes/driverRoutes.js';
// import wishlistRoutes from './src/routes/wishlistRoutes.js';
// import razorpayRoutes from './src/routes/razorpayRoutes.js';
// import userRoutes from './src/routes/userRoutes.js';
// import notificationRoutes from './src/routes/notificationRoutes.js';
// import adminRoutes from './src/routes/adminRoutes.js';

// dotenv.config();

// const app = express();

// // CORS
// app.use(cors({
//   origin: [
//     'http://localhost:3000',
//     'http://localhost:3001',
//     'https://frontend-ecommerce-six-self.vercel.app',
//     'https://backend-ecommerce-five-dun.vercel.app'
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ============ ROUTES - MUST BE IN THIS ORDER ============

// // Root route
// app.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ecommerce Backend Running 🚀'
//   });
// });

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({
//     success: true,
//     status: 'OK',
//     timestamp: new Date().toISOString()
//   });
// });

// // ============ REGISTER ALL API ROUTES ============
// // IMPORTANT: These MUST come before any wildcard or 404 handler
// app.use('/api/products', productRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/tracking', trackingRoutes);
// app.use('/api/drivers', driverRoutes);  // ← THIS IS CRITICAL
// app.use('/api/wishlist', wishlistRoutes);
// app.use('/api/razorpay', razorpayRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/admin', adminRoutes);

// // ============ DEBUG: Log all registered routes ============
// console.log('✅ Registered API Routes:');
// console.log('  - /api/health');
// console.log('  - /api/products');
// console.log('  - /api/auth');
// console.log('  - /api/drivers');
// console.log('  - /api/drivers/all');
// console.log('  - /api/drivers/create');
// console.log('  - /api/orders');

// // ============ 404 HANDLER - MUST BE LAST ============
// app.use('*', (req, res) => {
//   console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.originalUrl} not found`,
//     availableRoutes: [
//       '/api/health',
//       '/api/products',
//       '/api/auth',
//       '/api/drivers',
//       '/api/drivers/all',
//       '/api/drivers/create',
//       '/api/orders'
//     ]
//   });
// });

// // ============ ERROR HANDLER ============
// app.use((err, req, res, next) => {
//   console.error('❌ Error:', err.stack);
//   res.status(500).json({
//     success: false,
//     message: err.message || 'Internal Server Error'
//   });
// });

// const PORT = process.env.PORT || 5000;

// // For local development
// if (process.env.NODE_ENV !== 'production') {
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//   });
// }

// // For Vercel
// export default app;

import express from 'express';
import cors from 'cors';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple routes
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Ecommerce Backend Running 🚀',
    endpoints: {
      'POST /api/drivers/send-otp': 'Send OTP to driver',
      'POST /api/drivers/verify-otp': 'Verify OTP code'
    }
  });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// OTP storage (in-memory)
const otpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP endpoint
app.post('/api/drivers/send-otp', (req, res) => {
  try {
    const { email, phone } = req.body;
    const identifier = email || phone;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }
    
    const otp = generateOTP();
    otpStore.set(identifier, { otp, expiresAt: Date.now() + 10 * 60000 });
    
    console.log(`✅ OTP for ${identifier}: ${otp}`);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      devOTP: otp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify OTP endpoint
app.post('/api/drivers/verify-otp', (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    const identifier = email || phone;
    
    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and OTP are required'
      });
    }
    
    const record = otpStore.get(identifier);
    
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired'
      });
    }
    
    if (record.expiresAt < Date.now()) {
      otpStore.delete(identifier);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }
    
    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    otpStore.delete(identifier);
    
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// For Vercel
export default app;