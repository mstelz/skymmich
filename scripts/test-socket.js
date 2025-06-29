import { io } from 'socket.io-client';

// Connect to the server
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Connected to server via Socket.io');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

// Listen for plate solving updates
socket.on('plate-solving-update', (data) => {
  console.log('📡 Received plate solving update:', data);
});

// Listen for Immich sync updates
socket.on('immich-sync-complete', (data) => {
  console.log('📡 Received Immich sync update:', data);
});

// Keep the connection alive for a few seconds
setTimeout(() => {
  console.log('🧪 Test completed. Disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000);

console.log('🧪 Starting Socket.io test...'); 