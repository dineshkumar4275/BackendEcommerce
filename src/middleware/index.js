// backend/src/middleware/index.js

export {
  authenticateToken,
  isAdmin,
  isAdminOrDriver,
  isVerified,
  generateToken,
  refreshToken
} from './authMiddleware.js';