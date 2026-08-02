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

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8081',
      'https://frontend-ecommerce-pink.vercel.app',
      'https://api.sombu.in',
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

// Log all requests (for debugging)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

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

// ✅ REGISTER ALL API ROUTES
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

// ✅ LOCATION ROUTES - Make sure this is added
app.use('/api/location', locationRoutes);

console.log('✅ Registered Routes:');
console.log('  - /api/health');
console.log('  - /api/products');
console.log('  - /api/auth');
console.log('  - /api/location/detect');
console.log('  - /api/location/reverse');
console.log('  - /api/location/search/:query');

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Location API: http://localhost:${PORT}/api/location`);
  });
}

export default app;