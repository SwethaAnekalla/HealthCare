import { io, Socket } from 'socket.io-client';

const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

let socket: Socket | null = null;

export const initSocket = (token?: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(wsUrl, {
    auth: token
      ? {
          token,
        }
      : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });

  socket.on('error', (error) => {
    console.error('[Socket] Error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
