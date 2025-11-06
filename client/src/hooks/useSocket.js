import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

/**
 * Custom hook to manage Socket.IO connection
 * @param {string} token - Authentication token
 * @returns {object} Socket instance
 */
const useSocket = (token) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      // Disconnect if no token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        socket = null;
      }
      return;
    }

    // Only create one socket instance
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket = socketRef.current;

      // Connection event handlers
      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        socket = null;
      }
    };
  }, [token]);

  return socketRef.current;
};

// Export socket instance for use outside hooks
export const getSocket = () => socket;

export default useSocket;
