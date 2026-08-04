// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

// ✅ Load environment variables
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

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// ✅ CORS CONFIGURATION - FIXED FOR VERCEL
// ============================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
  'https://frontend-ecommerce-pink.vercel.app',
  'https://backend-ecommerce-five-dun.vercel.app',
  'https://api.sombu.in',
  'https://www.sombu.in',
  'https://sombu.in',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
}));

// ✅ Handle preflight requests
app.options('*', cors());

// ✅ Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Request logger (for debugging)
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// ============================================
// ✅ HEALTH CHECK - Must work for Vercel
// ============================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Sombu Store API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

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

// ============================================
// ✅ REGISTER ROUTES
// ============================================
try {
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
  
  console.log('✅ All routes registered successfully');
} catch (error) {
  console.error('❌ Failed to register routes:', error);
}

// ============================================
// ✅ 404 HANDLER
// ============================================
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/',
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

// ============================================
// ✅ ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// ✅ START SERVER (for local development)
// ============================================
if (process.env.NODE_ENV !== 'production') {
  const server = createServer(app);
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
}

// ============================================
// ✅ EXPORT FOR VERCEL
// ============================================
export default app;