// Jest setup file for GryLin tests

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  AuthRequest: jest.fn(),
  makeRedirectUri: jest.fn(() => 'grylin://redirect'),
  ResponseType: { Code: 'code' },
  exchangeCodeAsync: jest.fn(),
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      googleOAuth: {
        webClientId: 'test-client-id',
      },
    },
  },
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.warn in tests unless needed
  warn: jest.fn(),
  error: jest.fn(),
};
