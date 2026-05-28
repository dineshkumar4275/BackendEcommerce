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
// "// Force redeploy" 
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRoutes from './routes/dashboardRoutes.js';
import productRoutes from './routes/productRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import razorpayRoutes from './routes/razorpayRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

// ============ CORS CONFIGURATION ============
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  
  'https://your-frontend.vercel.app',
  'https://your-driver-app.vercel.app',
  'exp://localhost:19000',
  'exp://localhost:19001'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(null, true); // Allow all in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Content-Length', 'X-Total-Count'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// ============ MIDDLEWARE ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============ ROOT ROUTE ============
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ecommerce Backend Running 🚀',
    version: '1.0.0',
    endpoints: {
      'GET /': 'API Information',
      'GET /health': 'Health Check',
      'GET /api/test': 'Test Endpoint',
      'GET /api/drivers': 'Driver API Info',
      'POST /api/drivers/send-otp': 'Send OTP to Driver',
      'POST /api/drivers/verify-otp': 'Verify OTP Code',
      'GET /api/drivers/all': 'Get All Drivers',
      'GET /api/products': 'Get All Products',
      'GET /api/orders': 'Get All Orders'
    },
    documentation: 'https://github.com/your-repo',
    support: 'support@yourdomain.com'
  });
});

// ============ API TEST ROUTE ============
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// ============ API ROUTES ============
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ============ 404 HANDLER ============
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/test',
      'GET /api/drivers',
      'POST /api/drivers/send-otp',
      'POST /api/drivers/verify-otp',
      'GET /api/drivers/all',
      'GET /api/products',
      'GET /api/orders'
    ]
  });
});

// ============ GLOBAL ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  console.error('Stack:', err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ============ START SERVER (Local Development) ============
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`✅ Health check at http://localhost:${PORT}/health`);
  });
}

// ============ EXPORT FOR VERCEL ============
export default app;