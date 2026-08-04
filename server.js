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
import addressRoutes from './src/routes/addressRoutes.js';

dotenv.config();

const app = express();

// ============================================
// ✅ FIXED CORS CONFIGURATION
// ============================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
  'http://192.168.1.2:8081',
  'https://frontend-ecommerce-pink.vercel.app',
  'https://backend-ecommerce-five-dun.vercel.app',
  'https://api.sombu.in',
  'https://www.sombu.in',
  'https://sombu.in',
  // Add your production frontend URL
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked for origin:', origin);
        callback(new Error('Not allowed by CORS'));
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
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24 hours
  })
);

// ✅ Handle preflight requests explicitly
app.options('*', cors());

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// ✅ REQUEST LOGGER (for debugging)
// ============================================
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url} - Origin: ${req.headers.origin || 'unknown'}`);
  next();
});

// ============ ROUTES ============

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ecommerce Backend Running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
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
console.log('  - /api/address');

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
      '/api/address'
    ]
  });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 CORS allowed origins:`, allowedOrigins);
  });
}

// For Vercel
export default app;