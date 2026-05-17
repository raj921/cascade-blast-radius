import { validate, extractUserId } from './validator';

/**
 * Verifies a JWT token and returns validation result
 * This is the function that will be changed in Demo 1
 */
export function verifyToken(token: string): boolean {
  if (token == null || typeof token !== "string") return false;
  return validate(token);
}

/**
 * Authenticates a user with credentials
 */
export function authenticate(username: string, password: string): string | null {
  // Simplified authentication logic
  if (username && password) {
    return 'mock-jwt-token';
  }
  return null;
}

/**
 * Refreshes an expired token
 */
export function refreshToken(oldToken: string): string | null {
  if (verifyToken(oldToken)) {
    return 'new-mock-jwt-token';
  }
  return null;
}

// Made with Bob
