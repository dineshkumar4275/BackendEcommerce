// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './src/config/database.js';

// Routes
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

// ✅ NEW: Import address routes
import addressRoutes from './src/routes/addressRoutes.js';

dotenv.config();

const app = express();

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8081',
      'http://192.168.1.2:8081',
      'https://frontend-ecommerce-pink.vercel.app',
      'https://backend-ecommerce-five-dun.vercel.app',
      'https://api.sombu.in/api',
      'https://www.sombu.in',
      'https://sombu.in',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ ROUTES ============

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ecommerce Backend Running 🚀'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// ============ REGISTER ALL API ROUTES ============
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
app.use('/api/location', locationRoutes);

// ✅ NEW: Address routes
app.use('/api/address', addressRoutes);

// ============ DEBUG: Log all registered routes ============
console.log('✅ Registered API Routes:');
console.log('  - /api/health');
console.log('  - /api/products');
console.log('  - /api/auth');
console.log('  - /api/dashboard');
console.log('  - /api/orders');
console.log('  - /api/tracking');
console.log('  - /api/drivers');
console.log('  - /api/wishlist');
console.log('  - /api/razorpay');
console.log('  - /api/users');
console.log('  - /api/notifications');
console.log('  - /api/admin');
console.log('  - /api/location');
console.log('  ✅ /api/address');  // ✅ NEW

// ============ 404 HANDLER ============
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/health',
      '/api/products',
      '/api/auth',
      '/api/dashboard',
      '/api/orders',
      '/api/tracking',
      '/api/drivers',
      '/api/wishlist',
      '/api/razorpay',
      '/api/users',
      '/api/notifications',
      '/api/admin',
      '/api/location',
      '/api/address'  // ✅ NEW
    ]
  });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Address API: http://localhost:${PORT}/api/address`);
  });
}

// For Vercel
export default app;