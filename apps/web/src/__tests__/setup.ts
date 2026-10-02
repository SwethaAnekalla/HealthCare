import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Socket.IO
vi.mock('socket.io-client', () => {
  const emit = vi.fn();
  const on = vi.fn();
  const off = vi.fn();
  const disconnect = vi.fn();

  return {
    io: vi.fn(() => ({
      emit,
      on,
      off,
      disconnect,
      id: 'mock-socket-id',
      connected: true,
    })),
  };
});

// Mock API client
vi.mock('../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Extend expect with custom matchers if needed
expect.extend({});
