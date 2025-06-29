import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    socketRef.current = io('http://localhost:5000');

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to server via Socket.io');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
}

export function usePlateSolvingUpdates(callback: (data: any) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for plate solving updates
    socket.on('plate-solving-update', callback);

    return () => {
      socket.off('plate-solving-update', callback);
    };
  }, [socket, callback]);
}

export function useImmichSyncUpdates(callback: (data: any) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for Immich sync updates
    socket.on('immich-sync-complete', callback);

    return () => {
      socket.off('immich-sync-complete', callback);
    };
  }, [socket, callback]);
} 