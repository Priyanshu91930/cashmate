import React, { useEffect, useState } from 'react';
import webSocketService from '../services/websocket';

const SocketDebugger = () => {
  const [status, setStatus] = useState('Disconnected');
  const [events, setEvents] = useState([]);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Get user ID from localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const id = userData._id || 'unknown';
    setUserId(id);

    // Monitor connection events
    const onConnect = () => {
      setStatus('Connected');
      addEvent('Connected to server');
    };

    const onDisconnect = () => {
      setStatus('Disconnected');
      addEvent('Disconnected from server');
    };

    const onConnectionRequest = (data) => {
      addEvent(`Connection request received: ${JSON.stringify(data)}`);
    };

    const onNewMessage = (data) => {
      addEvent(`New message: ${JSON.stringify(data)}`);
    };

    // Add debugging listeners
    webSocketService.socket?.on('connect', onConnect);
    webSocketService.socket?.on('disconnect', onDisconnect);
    webSocketService.addListener('connection-request', onConnectionRequest);
    webSocketService.addListener('new-message', onNewMessage);

    // Connect if not already connected
    if (!webSocketService.socket) {
      webSocketService.connect(id);
    } else if (webSocketService.socket.connected) {
      setStatus('Connected');
      addEvent('Already connected');
    }

    return () => {
      // Clean up listeners
      webSocketService.socket?.off('connect', onConnect);
      webSocketService.socket?.off('disconnect', onDisconnect);
      webSocketService.removeListener('connection-request', onConnectionRequest);
      webSocketService.removeListener('new-message', onNewMessage);
    };
  }, []);

  const addEvent = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [{time: timestamp, message}, ...prev.slice(0, 9)]);
  };

  const testNotification = () => {
    // Simulate receiving a notification
    const mockData = {
      senderName: 'Test User',
      senderId: 'test-id',
      amount: 500
    };
    webSocketService.notifyListeners('connection-request', mockData);
    addEvent('Sent test notification');
  };

  return (
    <div className="fixed bottom-24 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-800">Socket Debugger</h3>
        <div className={`px-2 py-1 rounded text-xs ${status === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {status}
        </div>
      </div>
      <div className="text-xs mb-2">
        <strong>User ID:</strong> {userId}
      </div>
      <button 
        onClick={testNotification} 
        className="w-full mb-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
      >
        Test Notification
      </button>
      <div className="bg-gray-50 rounded border border-gray-200 p-2 h-40 overflow-y-auto">
        <h4 className="text-xs font-medium mb-1">Event Log:</h4>
        {events.length === 0 && (
          <div className="text-xs text-gray-500">No events yet</div>
        )}
        {events.map((event, i) => (
          <div key={i} className="text-xs mb-1">
            <span className="text-gray-500">{event.time}:</span> {event.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocketDebugger; 