import { verifyToken } from '../auth/index';
import { calculateTax, formatCurrency } from './utils';

/**
 * Processes a checkout with authentication
 * This calls verifyToken and will break in Demo 1
 */
export async function processCheckout(
  token: string,
  amount: number
): Promise<{ success: boolean; total: number }> {
  // Verify user is authenticated
  const isValid = verifyToken(token);
  
  if (!isValid) {
    throw new Error('Invalid authentication token');
  }

  // Calculate total with tax
  const tax = calculateTax(amount);
  const total = amount + tax;

  return {
    success: true,
    total: parseFloat(formatCurrency(total))
  };
}

/**
 * Validates payment method
 */
export function validatePayment(token: string, paymentMethod: string): boolean {
  if (!verifyToken(token)) {
    return false;
  }
  
  return ['credit_card', 'debit_card', 'paypal'].includes(paymentMethod);
}

// Made with Bob
