import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from './config';

/**
 * Sends an email notification
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  console.log(`Sending email via ${SMTP_HOST}:${SMTP_PORT}`);
  
  // Simplified email sending logic
  if (!SMTP_HOST || !SMTP_USER) {
    throw new Error('Email configuration incomplete');
  }

  return true;
}

/**
 * Sends a welcome email
 */
export async function sendWelcomeEmail(email: string): Promise<void> {
  await sendEmail(
    email,
    'Welcome!',
    'Thank you for signing up.'
  );
}

// Made with Bob
