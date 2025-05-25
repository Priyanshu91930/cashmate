import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.activeChats = new Map();
  }

  connect(userId) {
    if (!userId) {
      console.error('WebSocketService: Cannot connect without a userId');
      return;
    }

    console.log('WebSocketService: Attempting to connect with userId:', userId);
    this.userId = userId;
    
    if (this.socket && this.socket.connected && this.connected) {
      console.log('WebSocketService: Already connected');
      return;
    }
    
    try {
      console.log('WebSocketService: Creating new socket connection...');
      this.socket = io('http://localhost:3002', {
        query: { userId },
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        withCredentials: true,
        extraHeaders: {
          "Access-Control-Allow-Origin": "*"
        }
      });

      // Handle request updates
      this.socket.on('request-updated', (data) => {
        console.log('WebSocketService: Request updated:', data);
        this.notifyListeners('request-updated', data);
      });

      this.socket.on('request-connected', (data) => {
        console.log('WebSocketService: Request connected:', data);
        this.notifyListeners('request-connected', data);
      });

      this.socket.on('request-deleted', (data) => {
        console.log('WebSocketService: Request deleted:', data);
        this.notifyListeners('request-deleted', data);
      });

      // Debug all socket events
      this.socket.onAny((event, ...args) => {
        console.log('WebSocketService: Received event:', event, 'with args:', args);
      });

      this.socket.on('connect', () => {
        console.log('WebSocketService: Connected to server with socket id:', this.socket.id);
        this.connected = true;
        this.reconnectAttempts = 0;
        this.notifyListeners('connection-status', { status: 'connected' });
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocketService: Connection error:', error);
        this.notifyListeners('connection-status', { 
          status: 'error', 
          error: error.message 
        });
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`WebSocketService: Disconnected: ${reason}`);
        this.connected = false;
        this.notifyListeners('connection-status', { 
          status: 'disconnected', 
          reason 
        });
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`WebSocketService: Reconnection attempt ${attemptNumber}`);
        this.reconnectAttempts = attemptNumber;
        if (attemptNumber >= this.maxReconnectAttempts) {
          console.error('WebSocketService: Max reconnection attempts reached');
          this.socket.disconnect();
        }
      });

      this.socket.on('reconnect', () => {
        console.log('WebSocketService: Reconnected');
        this.connected = true;
        this.notifyListeners('connection-status', { status: 'reconnected' });
      });

      // Handle incoming connection requests
      this.socket.on('connection-request', (data) => {
        console.log('WebSocketService: Received connection request:', data);
        const { fromUserId, senderName, senderAvatar, amount, location, distance } = data;

        // Add sender to active chats
        this.addToActiveChats({
          userId: fromUserId,
          name: senderName,
          avatar: senderAvatar,
          amount,
          location,
          distance,
          online: true,
          lastMessage: {
            text: 'New connection request',
            timestamp: new Date().toISOString(),
            type: 'system'
          }
        });

        // Notify listeners
        this.notifyListeners('new-connection-request', data);
      });

      // Handle new messages
      this.socket.on('new-message', (data) => {
        console.log('WebSocketService: Received new message:', data);
        
        // Update active chats with the new message
        this.updateChatMessage(data.senderId, {
          id: data.messageId,
          text: data.message,
          sender: data.senderId,
          timestamp: data.timestamp,
          status: 'received'
        });

        // Increment unread count if the message is from another user
        if (data.senderId !== this.userId) {
          this.incrementUnreadCount(data.senderId);
        }

        // Notify all listeners about the new message
        this.notifyListeners('new-message', data);
      });

      // Handle message delivery confirmation
      this.socket.on('message-delivered', (data) => {
        console.log('WebSocketService: Message delivered:', data);
        this.notifyListeners('message-status-update', {
          messageId: data.messageId,
          status: 'delivered'
        });
      });

      // Handle message read status
      this.socket.on('messages-read', (data) => {
        console.log('WebSocketService: Messages read:', data);
        this.notifyListeners('message-status-update', {
          senderId: data.by,
          status: 'read',
          timestamp: data.timestamp
        });
      });

      // Handle message queued (recipient offline)
      this.socket.on('message-queued', (data) => {
        console.log('WebSocketService: Message queued:', data);
        this.notifyListeners('message-status-update', {
          messageId: data.messageId,
          status: 'sent'
        });
      });

      // Handle message errors
      this.socket.on('message-error', (data) => {
        console.log('WebSocketService: Message error:', data);
        this.notifyListeners('message-status-update', {
          messageId: data.messageId,
          status: 'error'
        });
      });

      // Handle connection acceptance
      this.socket.on('connection-accepted', (data) => {
        console.log('WebSocketService: Connection accepted:', data);
        this.notifyListeners('connection-accepted', data);
      });

      // Handle server errors
      this.socket.on('error', (error) => {
        console.error('WebSocketService: Server error:', error);
        this.notifyListeners('server-error', error);
      });

    } catch (error) {
      console.error('WebSocketService: Error initializing socket:', error);
      this.notifyListeners('connection-status', { 
        status: 'error', 
        error: error.message 
      });
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('WebSocketService: Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.notifyListeners('connection-status', { status: 'disconnected' });
    }
  }

  sendMessage(recipientId, message) {
    if (!this.socket || !this.connected) {
      console.error('WebSocketService: Cannot send message, not connected');
      this.reconnectIfNeeded();
      return false;
    }

    if (!recipientId || !message) {
      console.error('WebSocketService: Invalid message data', { recipientId, message });
      return false;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const messageData = {
        recipientId,
        senderId: this.userId,
        message: message.message || message,
        senderName: userData.name || 'Unknown User',
        timestamp: new Date().toISOString(),
        amount: message.amount,
        deliveryOption: message.deliveryOption,
        requestId: message.requestId
      };

      console.log('WebSocketService: Sending message:', messageData);
      
      this.socket.emit('send-message', messageData);

      // Update active chats
      this.updateChatMessage(recipientId, {
        text: messageData.message,
        sender: this.userId,
        timestamp: messageData.timestamp,
        status: 'sent'
      });

      return true;
    } catch (error) {
      console.error('WebSocketService: Error sending message:', error);
      return false;
    }
  }

  sendConnectionRequest(recipientId, requestData) {
    console.log('WebSocketService: Attempting to send connection request');
    console.log('Socket status:', {
      exists: !!this.socket,
      connected: this.connected,
      socketId: this.socket?.id
    });

    if (!this.socket || !this.connected) {
      console.error('WebSocketService: Cannot send connection request, not connected');
      this.reconnectIfNeeded();
      return false;
    }

    if (!recipientId) {
      console.error('WebSocketService: No recipient ID provided for connection request');
      return false;
    }

    try {
      console.log('WebSocketService: Sending connection request:', {
        recipientId,
        ...requestData
      });

      // Add recipient to sender's active chats immediately
      this.addToActiveChats({
        userId: recipientId,
        name: requestData.recipientName,
        avatar: requestData.recipientAvatar,
        amount: requestData.amount,
        location: requestData.location,
        distance: requestData.distance,
        online: true,
        lastMessage: {
          text: 'Connection request sent',
          timestamp: new Date().toISOString(),
          type: 'system'
        }
      });

      // Send the connection request
      this.socket.emit('connection-request', {
        recipientId,
        ...requestData,
        timestamp: new Date().toISOString()
      });

      console.log('WebSocketService: Connection request emitted successfully');
      return true;
    } catch (error) {
      console.error('WebSocketService: Error sending connection request:', error);
      return false;
    }
  }

  acceptConnection(requesterId, requestData) {
    if (!this.socket || !this.connected) {
      console.error('WebSocketService: Cannot accept connection, not connected');
      this.reconnectIfNeeded();
      return false;
    }

    try {
      console.log('WebSocketService: Accepting connection from:', {
        requesterId,
        ...requestData
      });

      this.socket.emit('accept-connection', { 
        requesterId,
        ...requestData,
        timestamp: new Date().toISOString()
      });

      // Add acceptance status listeners
      this.socket.once('accept-sent', (data) => {
        console.log('WebSocketService: Connection acceptance sent:', data);
        this.notifyListeners('accept-status', { status: 'sent', ...data });
      });

      this.socket.once('accept-error', (data) => {
        console.error('WebSocketService: Connection acceptance error:', data);
        this.notifyListeners('accept-status', { status: 'error', ...data });
      });

      return true;
    } catch (error) {
      console.error('WebSocketService: Error accepting connection:', error);
      this.notifyListeners('accept-status', { 
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  reconnectIfNeeded() {
    if (this.userId && (!this.socket || !this.connected)) {
      console.log('WebSocketService: Attempting to reconnect');
      this.connect(this.userId);
    }
  }

  addListener(event, callback) {
    console.log('WebSocketService: Adding listener for event:', event);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.removeListener(event, callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    console.log('WebSocketService: Notifying listeners for event:', event, 'with data:', data);
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`WebSocketService: Error in listener for ${event}:`, error);
        }
      });
    }
  }

  setUserActive(userId, userData) {
    if (!this.socket || !this.connected) {
      console.error('WebSocketService: Cannot set user active, not connected');
      return false;
    }

    try {
      console.log('WebSocketService: Setting user active:', userId);
      this.socket.emit('set-user-active', {
        userId,
        userData,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('WebSocketService: Error setting user active:', error);
      return false;
    }
  }

  addToActiveChats(chatData) {
    try {
      const { userId, name, amount, avatar, location, distance, lastMessage, online } = chatData;
      console.log('WebSocketService: Adding to active chats:', chatData);

      if (!userId) {
        throw new Error('Invalid chat data: missing userId');
      }

      // Update existing chat or create new one
      const existingChat = this.activeChats.get(userId);
      const updatedChat = {
        userId,
        name: name || existingChat?.name || 'Unknown User',
        avatar: avatar || existingChat?.avatar || '/default-avatar.png',
        amount: amount || existingChat?.amount || 0,
        location: location || existingChat?.location || 'College Campus',
        distance: distance || existingChat?.distance || 'Nearby',
        lastMessage: lastMessage || existingChat?.lastMessage || null,
        unreadCount: existingChat?.unreadCount || 0,
        online: online ?? existingChat?.online ?? false,
        timestamp: new Date().toISOString()
      };

      this.activeChats.set(userId, updatedChat);

      console.log('WebSocketService: Active chats updated:', 
        Array.from(this.activeChats.values())
      );

      // Notify listeners of active chats update
      this.notifyListeners('active-chats-update', 
        Array.from(this.activeChats.values())
      );

      return true;
    } catch (error) {
      console.error('WebSocketService: Error adding to active chats:', error);
      return false;
    }
  }

  getActiveChats() {
    return Array.from(this.activeChats.values());
  }

  updateChatMessage(userId, message) {
    if (this.activeChats.has(userId)) {
      const chat = this.activeChats.get(userId);
      chat.lastMessage = message;
      chat.timestamp = new Date().toISOString();
      
      // Increment unread count if message is from other user
      if (message.sender !== this.userId) {
        chat.unreadCount = (chat.unreadCount || 0) + 1;
      }
      
      this.activeChats.set(userId, chat);
      this.notifyListeners('active-chats-update', 
        Array.from(this.activeChats.values())
      );
    }
  }

  markChatAsRead(userId) {
    if (this.activeChats.has(userId)) {
      const chat = this.activeChats.get(userId);
      chat.unreadCount = 0;
      this.activeChats.set(userId, chat);
      this.notifyListeners('active-chats-update', 
        Array.from(this.activeChats.values())
      );
    }
  }

  updateActiveChat(userId, chatData) {
    if (this.activeChats.has(userId)) {
      const existingChat = this.activeChats.get(userId);
      this.activeChats.set(userId, {
        ...existingChat,
        ...chatData,
        timestamp: new Date().toISOString()
      });
      this.notifyListeners('active-chats-update', this.getActiveChats());
    }
  }

  markUserOffline(userId) {
    if (this.activeChats.has(userId)) {
      const chatData = this.activeChats.get(userId);
      this.activeChats.set(userId, {
        ...chatData,
        online: false
      });
      this.notifyListeners('active-chats-update', this.getActiveChats());
    }
  }

  incrementUnreadCount(userId) {
    if (this.activeChats.has(userId)) {
      const chatData = this.activeChats.get(userId);
      this.activeChats.set(userId, {
        ...chatData,
        unreadCount: (chatData.unreadCount || 0) + 1
      });
      this.notifyListeners('active-chats-update', this.getActiveChats());
    }
  }

  resetUnreadCount(userId) {
    if (this.activeChats.has(userId)) {
      const chatData = this.activeChats.get(userId);
      this.activeChats.set(userId, {
        ...chatData,
        unreadCount: 0
      });
      this.notifyListeners('active-chats-update', this.getActiveChats());
    }
  }

  updateLastMessage(userId, message) {
    if (this.activeChats.has(userId)) {
      const chatData = this.activeChats.get(userId);
      this.activeChats.set(userId, {
        ...chatData,
        lastMessage: message
      });
      this.notifyListeners('active-chats-update', this.getActiveChats());
    }
  }

  handleMessage(message) {
    // ... existing message handling code ...
    
    // Update active chats based on message type
    switch (message.type) {
      case 'user_online':
        this.updateActiveChat(message.userId, message.userData);
        break;
      case 'user_offline':
        this.markUserOffline(message.userId);
        break;
      case 'chat_message':
        this.updateLastMessage(message.from, message.content);
        if (message.from !== this.userId) {
          this.incrementUnreadCount(message.from);
        }
        break;
      // ... handle other message types ...
    }
    
    // Notify message listeners as before
    this.notifyListeners('message', message);
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService; 