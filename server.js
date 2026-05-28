// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import http from 'http';
// import { Server } from 'socket.io';
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

// /* =========================
//    CORS
// ========================= */
// app.use(cors({
//   origin: [
//     'http://localhost:3000',
//     'http://localhost:3001',
//     'https://yourfrontend.vercel.app'
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// /* =========================
//    MIDDLEWARE
// ========================= */
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* =========================
//    ROOT ROUTE
// ========================= */
// app.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Ecommerce Backend Running 🚀'
//   });
// });

// /* =========================
//    HEALTH CHECK
// ========================= */
// app.get('/api/health', (req, res) => {
//   res.json({
//     success: true,
//     status: 'OK',
//     timestamp: new Date().toISOString()
//   });
// });

// /* =========================
//    API ROUTES
// ========================= */
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

// /* =========================
//    SOCKET.IO
// ========================= */
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: [
//       'http://localhost:3000',
//       'https://yourfrontend.vercel.app'
//     ],
//     methods: ['GET', 'POST']
//   }
// });

// app.set('io', io);

// io.on('connection', (socket) => {
//   console.log(`✅ Client Connected: ${socket.id}`);

//   socket.on('track-order', (orderId) => {
//     socket.join(`order_${orderId}`);
//     console.log(`📍 Tracking Order: ${orderId}`);
//   });

//   socket.on('driver-location', async (data) => {
//     try {
//       const { driverId, latitude, longitude, orderId } = data;

//       await pool.query(
//         `
//         UPDATE drivers
//         SET current_latitude = $1,
//             current_longitude = $2,
//             last_location_update = NOW()
//         WHERE id = $3
//         `,
//         [latitude, longitude, driverId]
//       );

//       io.to(`order_${orderId}`).emit('driver-location-update', {
//         driverId,
//         latitude,
//         longitude,
//         timestamp: new Date()
//       });

//     } catch (error) {
//       console.error('Socket Error:', error);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log(`❌ Client Disconnected: ${socket.id}`);
//   });
// });

// /* =========================
//    404 HANDLER
// ========================= */
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.originalUrl} not found`
//   });
// });

// /* =========================
//    ERROR HANDLER
// ========================= */
// app.use((err, req, res, next) => {
//   console.error(err.stack);

//   res.status(500).json({
//     success: false,
//     message: 'Internal Server Error'
//   });
// });

// /* =========================
//    START SERVER
// ========================= */
// const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//   console.log(`🚀 Server Running On Port ${PORT}`);
// });

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
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

dotenv.config();

const app = express();

/* =========================
   CORS
========================= */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://frontend-ecommerce-six-self.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ROOT ROUTE
========================= */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ecommerce Backend Running 🚀'
  });
});

/* =========================
   HEALTH CHECK
========================= */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

/* =========================
   API ROUTES
========================= */
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

/* =========================
   SOCKET.IO
========================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://frontend-ecommerce-six-self.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`✅ Client Connected: ${socket.id}`);

  socket.on('track-order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`📍 Tracking Order: ${orderId}`);
  });

  socket.on('driver-location', async (data) => {
    try {
      const { driverId, latitude, longitude, orderId } = data;

      await pool.query(
        `
        UPDATE drivers
        SET current_latitude = $1,
            current_longitude = $2,
            last_location_update = NOW()
        WHERE id = $3
        `,
        [latitude, longitude, driverId]
      );

      io.to(`order_${orderId}`).emit('driver-location-update', {
        driverId,
        latitude,
        longitude,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Socket Error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client Disconnected: ${socket.id}`);
  });
});

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server Running On Port ${PORT}`);
});
