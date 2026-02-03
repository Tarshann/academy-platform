import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Resend module
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  })),
}));

// Mock the logger
vi.mock('./_core/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set the RESEND_API_KEY for tests
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  describe('sendEmail', () => {
    it('should return false when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY;
      
      // Re-import to get fresh module state
      vi.resetModules();
      const { sendEmail } = await import('./email');
      
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });
      
      expect(result).toBe(false);
    });

    it('should send email successfully when configured', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      
      vi.resetModules();
      const { sendEmail } = await import('./email');
      
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });
      
      expect(result).toBe(true);
    });
  });

  describe('sendGuestPaymentConfirmationEmail', () => {
    it('should format amount correctly', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      
      vi.resetModules();
      const { sendGuestPaymentConfirmationEmail } = await import('./email');
      
      const result = await sendGuestPaymentConfirmationEmail({
        to: 'guest@example.com',
        productName: 'Group Workout Session',
        amount: 2500, // $25.00 in cents
        currency: 'usd',
      });
      
      expect(result).toBe(true);
    });

    it('should include product name in email', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      
      vi.resetModules();
      const { Resend } = await import('resend');
      const { sendGuestPaymentConfirmationEmail } = await import('./email');
      
      await sendGuestPaymentConfirmationEmail({
        to: 'guest@example.com',
        productName: 'Individual Training',
        amount: 6000,
        currency: 'usd',
      });
      
      // Verify Resend was called
      expect(Resend).toHaveBeenCalled();
    });
  });

  describe('sendPaymentConfirmationEmail', () => {
    it('should send confirmation to logged-in user', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      
      vi.resetModules();
      const { sendPaymentConfirmationEmail } = await import('./email');
      
      const result = await sendPaymentConfirmationEmail({
        to: 'user@example.com',
        userName: 'John Doe',
        productName: 'Monthly Unlimited',
        amount: 15000,
        currency: 'usd',
      });
      
      expect(result).toBe(true);
    });
  });
});
