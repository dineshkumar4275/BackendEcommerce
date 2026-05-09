import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// Get user notifications
router.get('/user', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;
        
        const result = await notificationService.getUserNotifications(userId, parseInt(limit), parseInt(offset));
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get driver notifications
router.get('/driver', protect, async (req, res) => {
    try {
        const driverId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;
        
        const result = await notificationService.getDriverNotifications(driverId, parseInt(limit), parseInt(offset));
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting driver notifications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isDriver = req.user.role === 'driver';
        
        const result = await notificationService.markAsRead(id, isDriver ? null : userId, isDriver ? userId : null);
        
        if (!result) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark all notifications as read
router.put('/read-all', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const isDriver = req.user.role === 'driver';
        
        await notificationService.markAllAsRead(isDriver ? null : userId, isDriver ? userId : null);
        
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete notification
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isDriver = req.user.role === 'driver';
        
        const result = await notificationService.deleteNotification(id, isDriver ? null : userId, isDriver ? userId : null);
        
        if (!result) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        
        res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Save FCM token
router.post('/fcm-token', protect, async (req, res) => {
    try {
        const { token, deviceType } = req.body;
        const userId = req.user.id;
        const isDriver = req.user.role === 'driver';
        
        const result = await notificationService.saveFCMToken(
            isDriver ? null : userId,
            isDriver ? userId : null,
            token,
            deviceType || 'mobile'
        );
        
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Remove FCM token
router.delete('/fcm-token', protect, async (req, res) => {
    try {
        const { token } = req.body;
        
        await notificationService.removeFCMToken(token);
        
        res.json({ success: true, message: 'FCM token removed successfully' });
    } catch (error) {
        console.error('Error removing FCM token:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;