/**
 * Calculates tax on an amount
 * This will be refactored in Demo 3
 */
function calculateTax(amount: number): number {
  const rate = 0.08;
  return amount * rate;
}

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Calculates discount
 */
export function calculateDiscount(amount: number, percentage: number): number {
  return amount * (percentage / 100);
}

export { calculateTax };

// Made with Bob
