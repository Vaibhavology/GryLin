/**
 * Error Handler - Centralized error handling utilities
 * Provides user-friendly error messages and error classification
 */

// Error types for classification
export type ErrorType = 
  | 'network'
  | 'auth'
  | 'validation'
  | 'permission'
  | 'not_found'
  | 'rate_limit'
  | 'server'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
}

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'Failed to fetch': 'Unable to connect. Please check your internet connection.',
  'Network request failed': 'Network error. Please check your connection and try again.',
  'NetworkError': 'Connection lost. Please check your internet and try again.',
  'ECONNREFUSED': 'Unable to reach the server. Please try again later.',
  'ETIMEDOUT': 'Request timed out. Please try again.',
  
  // Auth errors
  'Invalid login credentials': 'Invalid email or password. Please try again.',
  'Email not confirmed': 'Please verify your email address before signing in.',
  'User already registered': 'This email is already registered. Please sign in instead.',
  'Invalid email': 'Please enter a valid email address.',
  'Password should be at least': 'Password must be at least 6 characters.',
  'User not found': 'No account found with this email. Please sign up.',
  'Invalid password': 'Incorrect password. Please try again.',
  
  // Permission errors
  'Permission denied': 'You don\'t have permission to perform this action.',
  'Unauthorized': 'Please sign in to continue.',
  'JWT expired': 'Your session has expired. Please sign in again.',
  'Invalid JWT': 'Session invalid. Please sign in again.',
  
  // Rate limiting
  'rate limit': 'Too many requests. Please wait a moment and try again.',
  'Too many requests': 'Please slow down and try again in a few seconds.',
  
  // Storage errors
  'Bucket not found': 'Storage configuration error. Please contact support.',
  'Object not found': 'The requested file was not found.',
  'Payload too large': 'File is too large. Please use a smaller file.',
  
  // Gmail errors
  'Google authentication was cancelled': 'Gmail connection was cancelled. Please try again.',
  'Failed to obtain access token': 'Could not connect to Gmail. Please try again.',
  'Token refresh failed': 'Gmail session expired. Please reconnect your account.',
  'Maximum 3 accounts allowed': 'You can only link up to 3 Gmail accounts.',
  
  // AI errors
  'AI analysis failed': 'Could not analyze the document. Please try again.',
  'Vision API error': 'Image analysis failed. Please try with a clearer image.',
  
  // Generic
  'Something went wrong': 'An unexpected error occurred. Please try again.',
};

/**
 * Classify an error into a type
 */
function classifyError(error: Error | string): ErrorType {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();
  
  // Network errors
  if (
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('etimedout') ||
    lowerMessage.includes('offline')
  ) {
    return 'network';
  }
  
  // Auth errors
  if (
    lowerMessage.includes('login') ||
    lowerMessage.includes('password') ||
    lowerMessage.includes('credentials') ||
    lowerMessage.includes('sign in') ||
    lowerMessage.includes('sign up') ||
    lowerMessage.includes('jwt') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('session')
  ) {
    return 'auth';
  }
  
  // Validation errors
  if (
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('required') ||
    lowerMessage.includes('must be') ||
    lowerMessage.includes('validation')
  ) {
    return 'validation';
  }
  
  // Permission errors
  if (
    lowerMessage.includes('permission') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('access denied')
  ) {
    return 'permission';
  }
  
  // Not found errors
  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('does not exist')
  ) {
    return 'not_found';
  }
  
  // Rate limit errors
  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many')
  ) {
    return 'rate_limit';
  }
  
  // Server errors
  if (
    lowerMessage.includes('server') ||
    lowerMessage.includes('500') ||
    lowerMessage.includes('503')
  ) {
    return 'server';
  }
  
  return 'unknown';
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;
  
  // Check for exact matches first
  for (const [key, friendlyMessage] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return friendlyMessage;
    }
  }
  
  // Check for partial matches (case-insensitive)
  const lowerMessage = message.toLowerCase();
  for (const [key, friendlyMessage] of Object.entries(ERROR_MESSAGES)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return friendlyMessage;
    }
  }
  
  // Return a generic message based on error type
  const errorType = classifyError(error);
  switch (errorType) {
    case 'network':
      return 'Connection error. Please check your internet and try again.';
    case 'auth':
      return 'Authentication error. Please sign in again.';
    case 'validation':
      return 'Please check your input and try again.';
    case 'permission':
      return 'You don\'t have permission to do this.';
    case 'not_found':
      return 'The requested item was not found.';
    case 'rate_limit':
      return 'Too many requests. Please wait and try again.';
    case 'server':
      return 'Server error. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Parse an error into a structured AppError
 */
export function parseError(error: unknown): AppError {
  let originalError: Error;
  
  if (error instanceof Error) {
    originalError = error;
  } else if (typeof error === 'string') {
    originalError = new Error(error);
  } else {
    originalError = new Error('Unknown error');
  }
  
  const type = classifyError(originalError);
  const message = getUserFriendlyMessage(originalError);
  
  // Determine if error is retryable
  const retryable = ['network', 'rate_limit', 'server'].includes(type);
  
  return {
    type,
    message,
    originalError,
    retryable,
  };
}

/**
 * Check if the device is offline
 */
export function isOffline(): boolean {
  // In React Native, we'd use NetInfo, but for now return false
  // This would be enhanced with actual network status checking
  return false;
}

/**
 * Create an offline error
 */
export function createOfflineError(): AppError {
  return {
    type: 'network',
    message: 'You appear to be offline. Please check your connection.',
    retryable: true,
  };
}

/**
 * Log error for debugging (in development)
 */
export function logError(error: unknown, context?: string): void {
  if (__DEV__) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}

// Export for use in components
export default {
  parseError,
  getUserFriendlyMessage,
  isOffline,
  createOfflineError,
  logError,
};
