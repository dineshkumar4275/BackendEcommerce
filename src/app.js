// backend/src/app.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
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

// ✅ Import location routes
import locationRoutes from './src/routes/locationRoutes.js';

dotenv.config();

const app = express();

// ============================================
// ✅ FIXED CORS - Allow all origins for development
// ============================================
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow all origins in development
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // Production allowed origins
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
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('❌ Blocked by CORS:', origin);
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
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Credentials'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// ✅ Handle preflight requests explicitly
app.options('*', cors());

// ✅ Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Log all requests with origin
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  console.log('  Origin:', req.headers.origin || 'No origin');
  console.log('  IP:', req.ip || req.socket?.remoteAddress);
  
  // ✅ Set CORS headers for all responses (safety net)
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ecommerce Backend Running 🚀',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============ REGISTER ALL API ROUTES ============
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

// ✅ Location routes
app.use('/api/location', locationRoutes);
console.log('  ✅ /api/location');

console.log('✅ All routes registered successfully!');

// ============ 404 HANDLER ============
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed',
      origin: req.headers.origin
    });
  }
  
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`📍 Location API: http://localhost:${PORT}/api/location`);
    console.log(`\n✅ Ready to accept requests!\n`);
  });
}

// For Vercel
export default app;