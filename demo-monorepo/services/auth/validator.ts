/**
 * Validates a JWT token structure
 */
export function validate(token: string): boolean {
  // Simplified validation
  return token.length > 10 && token.includes('.');
}

/**
 * Extracts user ID from token
 */
export function extractUserId(token: string): string {
  // Simplified extraction
  return token.split('.')[1] || 'unknown';
}

// Made with Bob
