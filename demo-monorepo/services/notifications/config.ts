/**
 * Email configuration
 * SMTP_SERVER will be changed to MAIL_HOST in Demo 2
 */
export const SMTP_HOST = process.env.SMTP_SERVER;
export const SMTP_PORT = process.env.SMTP_PORT || '587';
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;

/**
 * Notification settings
 */
export const NOTIFICATION_SETTINGS = {
  enabled: true,
  retryAttempts: 3,
  timeout: 5000
};

// Made with Bob
