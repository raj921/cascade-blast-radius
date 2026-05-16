import { verifyToken } from '../auth/index';
import { calculateTax } from './utils';

/**
 * Generates an invoice
 * Another caller of verifyToken
 */
export function generateInvoice(
  token: string,
  items: Array<{ name: string; price: number }>
): string {
  if (!verifyToken(token)) {
    throw new Error('Unauthorized');
  }

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  return `Invoice Total: $${total.toFixed(2)}`;
}

// Made with Bob
