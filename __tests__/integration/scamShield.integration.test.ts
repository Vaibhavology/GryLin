/**
 * Scam Shield Integration Tests
 * Tests scam detection for urgency language, suspicious senders, and sensitive info requests
 */

import { detectScam, hasScamIndicators, ScamAnalysis } from '../../lib/scamDetector';

describe('Scam Shield Integration', () => {
  describe('detectScam', () => {
    it('should detect high-risk phishing emails with urgency language', () => {
      const content = 'URGENT: Your account has been blocked! Act now to verify your identity. Click here to verify immediately or your account will be suspended within 24 hours.';
      const sender = 'security@paypa1.com';

      const result = detectScam(content, sender);

      expect(result.is_scam).toBe(true);
      expect(result.risk_score).toBeGreaterThanOrEqual(70);
      expect(result.scam_indicators.length).toBeGreaterThan(0);
      expect(result.recommendation).toContain('HIGH RISK');
    });

    it('should detect emails requesting sensitive information', () => {
      // Content with sensitive info requests AND urgency language to trigger high risk
      const content = 'URGENT: Please confirm your password and PIN number immediately to continue. We need to verify your bank account number and credit card details. Act now or your account will be suspended!';
      const sender = 'support@bank-verify.xyz';

      const result = detectScam(content, sender);

      expect(result.is_scam).toBe(true);
      expect(result.risk_score).toBeGreaterThanOrEqual(70);
      expect(result.scam_indicators.some(i => i.toLowerCase().includes('sensitive'))).toBe(true);
    });

    it('should flag sensitive info requests with medium risk when no urgency', () => {
      const content = 'Please confirm your password and PIN number to continue. We need to verify your bank account number.';
      const sender = 'support@bank.com';

      const result = detectScam(content, sender);

      // Should have medium risk but not necessarily flagged as scam
      expect(result.risk_score).toBeGreaterThan(0);
      expect(result.scam_indicators.some(i => i.toLowerCase().includes('sensitive'))).toBe(true);
    });

    it('should detect suspicious domain patterns', () => {
      const content = 'Your order has been shipped.';
      const sender = 'support@amaz0n-verify.xyz';

      const result = detectScam(content, sender);

      expect(result.risk_score).toBeGreaterThan(0);
      expect(result.scam_indicators.some(i => i.toLowerCase().includes('domain'))).toBe(true);
    });

    it('should flag emails with multiple urgency phrases', () => {
      const content = 'Final notice! Your account will be suspended. Act immediately to avoid suspension. Failure to respond within 48 hours will result in account closure.';
      const sender = 'alerts@company.com';

      const result = detectScam(content, sender);

      expect(result.risk_score).toBeGreaterThanOrEqual(40);
      expect(result.scam_indicators.some(i => i.toLowerCase().includes('urgency'))).toBe(true);
    });

    it('should return low risk for legitimate emails', () => {
      const content = 'Thank you for your purchase. Your order #12345 has been confirmed. Expected delivery: January 10, 2026.';
      const sender = 'orders@amazon.com';

      const result = detectScam(content, sender);

      expect(result.is_scam).toBe(false);
      expect(result.risk_score).toBeLessThan(70);
      expect(result.recommendation).not.toContain('HIGH RISK');
    });

    it('should detect OTP/verification code requests', () => {
      const content = 'Please share your OTP to complete the verification. Enter your one-time password below.';
      const sender = 'verify@service.com';

      const result = detectScam(content, sender);

      expect(result.risk_score).toBeGreaterThan(0);
      expect(result.scam_indicators.some(i => i.toLowerCase().includes('sensitive'))).toBe(true);
    });

    it('should detect click-here phishing patterns', () => {
      const content = 'Your account needs verification. Click here to verify your account. Login here to continue.';
      const sender = 'support@service.com';

      const result = detectScam(content, sender);

      expect(result.risk_score).toBeGreaterThan(0);
      expect(result.scam_indicators.some(i => i.toLowerCase().includes('link'))).toBe(true);
    });

    it('should return risk score between 0 and 100', () => {
      const testCases = [
        { content: 'Normal email content', sender: 'user@company.com' },
        { content: 'Act now! Verify immediately!', sender: 'scam@fake.xyz' },
        { content: 'Your password needs to be reset', sender: 'support@bank.com' },
      ];

      testCases.forEach(({ content, sender }) => {
        const result = detectScam(content, sender);
        expect(result.risk_score).toBeGreaterThanOrEqual(0);
        expect(result.risk_score).toBeLessThanOrEqual(100);
      });
    });

    it('should provide appropriate recommendations based on risk level', () => {
      // High risk
      const highRisk = detectScam(
        'Account blocked! Act now! Verify your password immediately!',
        'security@paypa1.xyz'
      );
      expect(highRisk.recommendation).toContain('HIGH RISK');

      // Low risk
      const lowRisk = detectScam(
        'Your monthly statement is ready.',
        'statements@bank.com'
      );
      expect(lowRisk.recommendation).not.toContain('HIGH RISK');
    });
  });

  describe('hasScamIndicators', () => {
    it('should return true for content with urgency language', () => {
      expect(hasScamIndicators('Act now before it\'s too late!')).toBe(true);
      expect(hasScamIndicators('Your account will be suspended')).toBe(true);
      expect(hasScamIndicators('Verify immediately to continue')).toBe(true);
    });

    it('should return true for content requesting sensitive info', () => {
      expect(hasScamIndicators('Please enter your password')).toBe(true);
      expect(hasScamIndicators('Confirm your bank account number')).toBe(true);
      expect(hasScamIndicators('Share your OTP code')).toBe(true);
    });

    it('should return false for normal content', () => {
      expect(hasScamIndicators('Thank you for your order')).toBe(false);
      expect(hasScamIndicators('Your package has been delivered')).toBe(false);
      expect(hasScamIndicators('Meeting scheduled for tomorrow')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const result = detectScam('', 'user@company.com');
      expect(result.is_scam).toBe(false);
      expect(result.risk_score).toBe(0);
    });

    it('should handle empty sender', () => {
      const result = detectScam('Normal email content', '');
      expect(result.risk_score).toBeGreaterThanOrEqual(0);
    });

    it('should be case-insensitive for pattern matching', () => {
      const result1 = detectScam('ACT NOW!', 'user@company.com');
      const result2 = detectScam('act now!', 'user@company.com');
      
      expect(result1.risk_score).toBe(result2.risk_score);
    });
  });
});
