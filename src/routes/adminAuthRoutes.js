// backend/src/routes/adminAuthRoutes.js
import express from 'express';
import {
    adminLogin,
    verify2FA,
    resend2FACode,
    adminLogout,
    getAdminSessions,
    revokeSession
} from '../controllers/adminAuthController.js';
// ✅ FIXED: Correct import path - authMiddleware.js instead of auth.js
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Public routes (no authentication)
router.post('/login', adminLogin);
router.post('/verify-2fa', verify2FA);
router.post('/resend-2fa', resend2FACode);

// ✅ Protected routes (require admin authentication)
router.post('/logout', authenticateToken, isAdmin, adminLogout);
router.get('/sessions', authenticateToken, isAdmin, getAdminSessions);
router.delete('/sessions/:sessionId', authenticateToken, isAdmin, revokeSession);

export default router;