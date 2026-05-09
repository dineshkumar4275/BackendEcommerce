// mobile-app/services/socket.js
import io from 'socket.io-client';
import { SOCKET_URL } from '../config';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.driverId = null;
    this.token = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  async connect() {
    try {
      // Get driver info and token
      const driverInfo = await SecureStore.getItemAsync('driverInfo');
      const token = await AsyncStorage.getItem('token');
      
      const driver = driverInfo ? JSON.parse(driverInfo) : null;
      this.driverId = driver?.id || 1;
      this.token = token;
      
      console.log('🔄 Connecting to socket:', SOCKET_URL);
      console.log('Driver ID:', this.driverId);
      console.log('Token exists:', !!this.token);
      
      // Connect with authentication
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        auth: {
          token: this.token,
          driverId: this.driverId,
          role: 'driver'
        }
      });
      
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Socket connection error:', error);
      this.connectWithFallback();
    }
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Register as driver
      this.registerDriver();
      
      // Set driver as available
      this.setDriverAvailability(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.connectWithFallback();
      }
    });

    // Driver specific events
    this.socket.on('driver-registered', (data) => {
      console.log('✅ Driver registered:', data);
      if (this.onDriverRegistered) this.onDriverRegistered(data);
    });

    this.socket.on('new-order-assigned', (data) => {
      console.log('📦 New order assigned:', data);
      if (this.onNewOrder) this.onNewOrder(data);
    });

    this.socket.on('order-accepted', (data) => {
      console.log('✅ Order accepted:', data);
      if (this.onOrderAccepted) this.onOrderAccepted(data);
    });

    this.socket.on('order-status-update', (data) => {
      console.log('📊 Order status update:', data);
      if (this.onOrderStatusUpdate) this.onOrderStatusUpdate(data);
    });

    this.socket.on('driver-location-request', (data) => {
      console.log('📍 Location request received');
      this.sendCurrentLocation();
    });

    this.socket.on('availability-updated', (data) => {
      console.log('🟢 Availability updated:', data);
      if (this.onAvailabilityUpdated) this.onAvailabilityUpdated(data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (this.onError) this.onError(error);
    });
  }

  connectWithFallback() {
    console.log('🔄 Connecting without auth fallback...');
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    
    this.socket.on('connect', () => {
      console.log('✅ Socket connected (fallback mode)');
      this.isConnected = true;
      
      // Register driver after connection
      if (this.driverId) {
        this.socket.emit('register-driver', { 
          driverId: this.driverId,
          token: this.token 
        });
      }
    });
    
    this.socket.on('driver-registered', (data) => {
      console.log('✅ Driver registered in fallback mode:', data);
      this.setDriverAvailability(true);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Fallback connection error:', error.message);
    });
  }

  registerDriver() {
    if (this.isConnected && this.driverId) {
      this.socket.emit('register-driver', {
        driverId: this.driverId,
        token: this.token,
        role: 'driver'
      });
      console.log('📡 Driver registration sent:', this.driverId);
    }
  }

  disconnect() {
    if (this.socket) {
      this.setDriverAvailability(false);
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket disconnected manually');
    }
  }

  setDriverAvailability(isAvailable) {
    if (this.isConnected && this.driverId) {
      this.socket.emit('driver-availability', { 
        isAvailable, 
        driverId: this.driverId,
        timestamp: new Date().toISOString()
      });
      console.log(`🟢 Driver ${this.driverId} availability: ${isAvailable}`);
    }
  }

  sendDriverLocation(latitude, longitude, orderId = null) {
    if (this.isConnected && this.driverId) {
      this.socket.emit('driver-location', { 
        latitude, 
        longitude, 
        orderId,
        driverId: this.driverId,
        timestamp: new Date().toISOString()
      });
      console.log(`📍 Location sent: ${latitude}, ${longitude} for order: ${orderId}`);
    }
  }

  sendCurrentLocation() {
    // Get current location from GPS and send
    if (this.onGetCurrentLocation) {
      this.onGetCurrentLocation(async (location) => {
        if (location) {
          this.sendDriverLocation(location.latitude, location.longitude);
        }
      });
    }
  }

  acceptOrder(orderId) {
    if (this.isConnected && this.driverId) {
      this.socket.emit('accept-order', { 
        orderId, 
        driverId: this.driverId,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ Accepted order: ${orderId}`);
    }
  }

  rejectOrder(orderId, reason) {
    if (this.isConnected && this.driverId) {
      this.socket.emit('reject-order', { 
        orderId, 
        driverId: this.driverId,
        reason: reason || 'Not available',
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Rejected order: ${orderId}`);
    }
  }

  updateOrderStatus(orderId, status, location = null) {
    if (this.isConnected && this.driverId) {
      this.socket.emit('update-order-status', { 
        orderId, 
        status, 
        location, 
        driverId: this.driverId,
        timestamp: new Date().toISOString()
      });
      console.log(`📦 Order ${orderId} status: ${status}`);
    }
  }

  trackOrder(orderId) {
    if (this.isConnected) {
      this.socket.emit('track-order', orderId);
      console.log(`👀 Tracking order: ${orderId}`);
    }
  }

  stopTracking(orderId) {
    if (this.isConnected) {
      this.socket.emit('stop-tracking', orderId);
      console.log(`👀 Stopped tracking order: ${orderId}`);
    }
  }

  getDriverLocation(driverId) {
    if (this.isConnected) {
      this.socket.emit('get-driver-location', { driverId });
    }
  }

  // Event listener registration methods
  onNewOrder(callback) {
    this.onNewOrder = callback;
  }

  onOrderAccepted(callback) {
    this.onOrderAccepted = callback;
  }

  onOrderStatusUpdate(callback) {
    this.onOrderStatusUpdate = callback;
  }

  onDriverRegistered(callback) {
    this.onDriverRegistered = callback;
  }

  onAvailabilityUpdated(callback) {
    this.onAvailabilityUpdated = callback;
  }

  onGetCurrentLocation(callback) {
    this.onGetCurrentLocation = callback;
  }

  onError(callback) {
    this.onError = callback;
  }

  // Generic event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}, socket not connected`);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      driverId: this.driverId,
      socketId: this.socket?.id
    };
  }
}

export default new SocketService();