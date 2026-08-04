// backend/src/routes/addressRoutes.js
import express from 'express';
import AddressController from '../controllers/addressController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateAddress } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/address - Get user's address
router.get('/', AddressController.getAddress);

// PUT /api/address - Update user's address
router.put('/', validateAddress, AddressController.updateAddress);

// DELETE /api/address - Delete user's address
router.delete('/', AddressController.deleteAddress);

export default router;