// src/services/notificationService.js
import pool from '../config/database.js';

// Simple in-memory notification store (for development)
// In production, use database (already set up in schema)

class NotificationService {
  
  // Create notification for user
  async createUserNotification(userId, title, message, type = 'info', data = null) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [userId, title, message, type, data ? JSON.stringify(data) : null]
      );
      
      console.log(`📧 Notification created for user ${userId}: ${title}`);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user notification:', error);
      return null;
    }
  }
  
  // Create notification for driver
  async createDriverNotification(driverId, title, message, type = 'info', data = null) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (driver_id, title, message, type, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [driverId, title, message, type, data ? JSON.stringify(data) : null]
      );
      
      console.log(`📧 Notification created for driver ${driverId}: ${title}`);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating driver notification:', error);
      return null;
    }
  }
  
  // Get user notifications
  async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
      
      return {
        notifications: result.rows,
        unread_count: parseInt(countResult.rows[0].count),
        total: result.rows.length
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { notifications: [], unread_count: 0, total: 0 };
    }
  }
  
  // Get driver notifications
  async getDriverNotifications(driverId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE driver_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [driverId, limit, offset]
      );
      
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM notifications WHERE driver_id = $1 AND is_read = false`,
        [driverId]
      );
      
      return {
        notifications: result.rows,
        unread_count: parseInt(countResult.rows[0].count),
        total: result.rows.length
      };
    } catch (error) {
      console.error('Error getting driver notifications:', error);
      return { notifications: [], unread_count: 0, total: 0 };
    }
  }
  
  // Mark notification as read
  async markAsRead(notificationId, userId = null, driverId = null) {
    try {
      let query;
      let params;
      
      if (userId) {
        query = `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`;
        params = [notificationId, userId];
      } else if (driverId) {
        query = `UPDATE notifications SET is_read = true WHERE id = $1 AND driver_id = $2 RETURNING *`;
        params = [notificationId, driverId];
      } else {
        return null;
      }
      
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  }
  
  // Mark all notifications as read
  async markAllAsRead(userId = null, driverId = null) {
    try {
      if (userId) {
        await pool.query(
          `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
          [userId]
        );
      } else if (driverId) {
        await pool.query(
          `UPDATE notifications SET is_read = true WHERE driver_id = $1 AND is_read = false`,
          [driverId]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  }
  
  // Delete notification
  async deleteNotification(notificationId, userId = null, driverId = null) {
    try {
      let query;
      let params;
      
      if (userId) {
        query = `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`;
        params = [notificationId, userId];
      } else if (driverId) {
        query = `DELETE FROM notifications WHERE id = $1 AND driver_id = $2 RETURNING id`;
        params = [notificationId, driverId];
      } else {
        return null;
      }
      
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting notification:', error);
      return null;
    }
  }
  
  // Save FCM token (for future use)
  async saveFCMToken(userId = null, driverId = null, token, deviceType = 'mobile') {
    try {
      // Check if token already exists
      const existing = await pool.query(
        'SELECT id FROM fcm_tokens WHERE token = $1',
        [token]
      );
      
      if (existing.rows.length > 0) {
        // Update existing token
        await pool.query(
          `UPDATE fcm_tokens 
           SET user_id = $1, driver_id = $2, device_type = $3, is_active = true, updated_at = NOW()
           WHERE token = $4`,
          [userId, driverId, deviceType, token]
        );
      } else {
        // Insert new token
        await pool.query(
          `INSERT INTO fcm_tokens (user_id, driver_id, token, device_type, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [userId, driverId, token, deviceType]
        );
      }
      
      console.log(`✅ FCM token saved for ${userId ? 'user' : 'driver'}: ${token.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
  }
  
  // Remove FCM token
  async removeFCMToken(token) {
    try {
      await pool.query(
        `UPDATE fcm_tokens SET is_active = false WHERE token = $1`,
        [token]
      );
      console.log(`✅ FCM token removed`);
      return true;
    } catch (error) {
      console.error('Error removing FCM token:', error);
      return false;
    }
  }
  
  // Send notification to user (for real-time via socket)
  async sendRealTimeNotification(userId, title, message, data = null) {
    try {
      // Save to database
      const notification = await this.createUserNotification(userId, title, message, 'real_time', data);
      
      // Emit via socket if available
      const io = global.io;
      if (io) {
        io.to(`user_${userId}`).emit('new-notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error sending real-time notification:', error);
      return null;
    }
  }
  
  // Send notification to driver (for real-time via socket)
  async sendRealTimeToDriver(driverId, title, message, data = null) {
    try {
      // Save to database
      const notification = await this.createDriverNotification(driverId, title, message, 'real_time', data);
      
      // Emit via socket if available
      const io = global.io;
      if (io) {
        io.to(`driver_${driverId}`).emit('new-notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error sending real-time driver notification:', error);
      return null;
    }
  }
  
  // Send order status notification to user
  async notifyOrderStatus(userId, orderId, status, message) {
    return this.sendRealTimeNotification(userId, 'Order Update', message, {
      type: 'order_status',
      order_id: orderId,
      status: status
    });
  }
  
  // Send new order notification to driver
  async notifyNewOrder(driverId, orderId, orderNumber) {
    return this.sendRealTimeToDriver(driverId, 'New Order Available', `New order #${orderNumber} is available for delivery`, {
      type: 'new_order',
      order_id: orderId,
      order_number: orderNumber
    });
  }
  
  // Send order assigned notification to driver
  async notifyOrderAssigned(driverId, orderId, orderNumber) {
    return this.sendRealTimeToDriver(driverId, 'Order Assigned', `Order #${orderNumber} has been assigned to you`, {
      type: 'order_assigned',
      order_id: orderId
    });
  }
}

export default new NotificationService();