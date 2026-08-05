// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './src/config/database.js';

// Routes - ✅ REMOVED DUPLICATES
import adminAuthRoutes from './src/routes/adminAuthRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
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

dotenv.config();

const app = express();

// ============================================
// ✅ CORS CONFIGURATION
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
];

// ✅ CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, ' +
    'Access-Control-Allow-Origin, Access-Control-Allow-Headers, ' +
    'Access-Control-Allow-Methods, Access-Control-Allow-Credentials'
  );
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
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
    message: '🚀 Ecommerce Backend Running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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

app.use('/api/admin/auth', adminAuthRoutes);
console.log('  ✅ /api/admin/auth');

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
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ Ready to accept requests!\n`);
  });
}

// For Vercel
export default app;