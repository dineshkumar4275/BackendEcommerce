// backend/src/routes/languageRoutes.js

import express from 'express';
import {
  getUserLanguage,
  updateUserLanguage,
  getLanguages,
  getProductWithTranslation
} from '../controllers/languageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ✅ Public routes
router.get('/languages', getLanguages);

// ✅ Protected routes (require authentication)
router.get('/user-language', authenticateToken, getUserLanguage);
router.put('/user-language', authenticateToken, updateUserLanguage);

// ✅ Product with translation
router.get('/product/:id/translate', getProductWithTranslation);

export default router;