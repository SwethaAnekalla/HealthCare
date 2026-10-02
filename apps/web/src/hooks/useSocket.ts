import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/auth';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Initialize socket connection
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: {
        token: localStorage.getItem('accessToken'),
        userId: user.id,
        role: user.role,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const unsubscribe = useCallback((event: string) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    subscribe,
    unsubscribe,
    emit,
  };
};

// Doctor Status Hook
export const useDoctorStatusUpdates = (doctorId: string) => {
  const { socket, subscribe, unsubscribe, emit } = useSocket();

  useEffect(() => {
    if (!socket || !doctorId) return;

    // Subscribe to doctor status
    emit('doctor:status:subscribe', { doctorId });
    subscribe('doctor:status:changed', (data) => {
      console.log('Doctor status changed:', data);
    });

    return () => {
      emit('doctor:status:unsubscribe', { doctorId });
      unsubscribe('doctor:status:changed');
    };
  }, [socket, doctorId, subscribe, unsubscribe, emit]);

  return { socket };
};

// Queue Updates Hook
export const useQueueUpdates = (clinicId: string) => {
  const { socket, subscribe, unsubscribe, emit } = useSocket();

  useEffect(() => {
    if (!socket || !clinicId) return;

    // Subscribe to queue updates
    emit('queue:subscribe', { clinicId });
    subscribe('queue:updated', (data) => {
      console.log('Queue updated:', data);
    });

    return () => {
      emit('queue:unsubscribe', { clinicId });
      unsubscribe('queue:updated');
    };
  }, [socket, clinicId, subscribe, unsubscribe, emit]);

  return { socket };
};

// Chat Hook
export const useChatUpdates = (ticketId: string) => {
  const { socket, subscribe, unsubscribe, emit } = useSocket();

  const sendMessage = useCallback(
    (message: string) => {
      emit('chat:message:received', {
        ticketId,
        message,
        isAgent: false,
      });
    },
    [ticketId, emit]
  );

  useEffect(() => {
    if (!socket || !ticketId) return;

    // Subscribe to chat
    emit('chat:subscribe', { ticketId });
    subscribe('chat:message:received', (data) => {
      console.log('Chat message received:', data);
    });

    return () => {
      unsubscribe('chat:message:received');
    };
  }, [socket, ticketId, subscribe, unsubscribe, emit]);

  return { socket, sendMessage };
};

// Notifications Hook
export const useNotifications = () => {
  const { socket, subscribe, unsubscribe } = useSocket();

  useEffect(() => {
    if (!socket) return;

    subscribe('notification:sent', (data) => {
      console.log('Notification received:', data);
      // Handle notification (show toast, etc)
    });

    return () => {
      unsubscribe('notification:sent');
    };
  }, [socket, subscribe, unsubscribe]);

  return { socket };
};
