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

// // ✅ Import location routes
// import locationRoutes from './src/routes/locationRoutes.js';

// dotenv.config();

// const app = express();

// // CORS
// app.use(
//   cors({
//     origin: [
//       'http://localhost:3000',
//       'http://localhost:3001',
//       'http://localhost:8081',
//       'http://192.168.1.2:8081',
//       'https://frontend-ecommerce-pink.vercel.app',
//       'https://backend-ecommerce-five-dun.vercel.app',
//       'https://api.sombu.in/api',
//       'https://www.sombu.in',
//       'https://sombu.in',
//     ],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
//   })
// );

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
// app.use('/api/products', productRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/tracking', trackingRoutes);
// app.use('/api/drivers', driverRoutes);
// app.use('/api/wishlist', wishlistRoutes);
// app.use('/api/razorpay', razorpayRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/admin', adminRoutes);

// // ✅ LOCATION ROUTES - Add this line
// app.use('/api/location', locationRoutes);

// // ============ DEBUG: Log all registered routes ============
// console.log('✅ Registered API Routes:');
// console.log('  - /api/health');
// console.log('  - /api/products');
// console.log('  - /api/auth');
// console.log('  - /api/dashboard');
// console.log('  - /api/orders');
// console.log('  - /api/tracking');
// console.log('  - /api/drivers');
// console.log('  - /api/wishlist');
// console.log('  - /api/razorpay');
// console.log('  - /api/users');
// console.log('  - /api/notifications');
// console.log('  - /api/admin');
// console.log('  ✅ /api/location');  // ✅ Added this
// console.log('  ✅ /api/location/detect');
// console.log('  ✅ /api/location/search/:query');
// console.log('  ✅ /api/location/by-zip/:zipcode');
// console.log('  ✅ /api/location/nearby');

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
//       '/api/dashboard',
//       '/api/orders',
//       '/api/tracking',
//       '/api/drivers',
//       '/api/wishlist',
//       '/api/razorpay',
//       '/api/users',
//       '/api/notifications',
//       '/api/admin',
//       '/api/location',
//       '/api/location/detect',
//       '/api/location/search/:query',
//       '/api/location/by-zip/:zipcode',
//       '/api/location/nearby'
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
//     console.log(`📍 Location API: http://localhost:${PORT}/api/location`);
//   });
// }

// // For Vercel
// export default app;
// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Import routes
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
import locationRoutes from './src/routes/locationRoutes.js';
import addressRoutes from './src/routes/addressRoutes.js';
import languageRoutes from './src/routes/languageRoutes.js';

const app = express();

// ============================================
// ✅ COMPLETE CORS FIX - MULTIPLE LAYERS
// ============================================

// ✅ LAYER 1: Raw CORS middleware (BEFORE anything else)
app.use((req, res, next) => {
  // Always set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, ' +
    'Access-Control-Allow-Origin, Access-Control-Allow-Headers, ' +
    'Access-Control-Allow-Methods, Access-Control-Allow-Credentials'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // ✅ Handle OPTIONS immediately
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled:', req.url);
    return res.status(200).end();
  }
  
  next();
});

// ✅ LAYER 2: Express CORS middleware (backup)
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 
    'Authorization', 'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers', 'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ✅ LAYER 3: Additional CORS headers (safety net)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// ✅ Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Request logger
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// ============================================
// ✅ ROUTES
// ============================================

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Sombu Store API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Register routes
console.log('📦 Registering API Routes...');

app.use('/api/products', productRoutes);
console.log('  ✅ /api/products');

app.use('/api/auth', authRoutes);
console.log('  ✅ /api/auth');

app.use('/api/dashboard', dashboardRoutes);
console.log('  ✅ /api/dashboard');

app.use('/api/orders', orderRoutes);
console.log('  ✅ /api/orders');

app.use('/api/tracking', trackingRoutes);
console.log('  ✅ /api/tracking');

app.use('/api/drivers', driverRoutes);
console.log('  ✅ /api/drivers');

app.use('/api/wishlist', wishlistRoutes);
console.log('  ✅ /api/wishlist');

app.use('/api/razorpay', razorpayRoutes);
console.log('  ✅ /api/razorpay');

app.use('/api/users', userRoutes);
console.log('  ✅ /api/users');

app.use('/api/notifications', notificationRoutes);
console.log('  ✅ /api/notifications');

app.use('/api/admin', adminRoutes);
console.log('  ✅ /api/admin');

app.use('/api/location', locationRoutes);
console.log('  ✅ /api/location');

app.use('/api/address', addressRoutes);
console.log('  ✅ /api/address');

app.use('/api/language', languageRoutes);
console.log('  ✅ /api/language');

console.log('✅ All routes registered successfully!');

// ============================================
// ✅ 404 HANDLER
// ============================================
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ============================================
// ✅ ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ============================================
// ✅ START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`✅ Ready to accept requests!\n`);
  });
}

// ✅ EXPORT FOR VERCEL
export default app;