/**
 * Shared types across services
 */

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
}

export interface PaymentMethod {
  type: 'credit_card' | 'debit_card' | 'paypal';
  last4?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  tax: number;
  total: number;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
}

// Made with Bob
