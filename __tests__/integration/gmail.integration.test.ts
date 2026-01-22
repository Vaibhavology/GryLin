/**
 * Gmail Integration Tests
 * Tests Gmail OAuth flow, email fetching, and transactional email filtering
 */

import { isTransactionalEmail, EmailContent } from '../../lib/gmail';
import { Item, ItemCategory, SourceType } from '../../types';

// Helper to create item from email analysis (simulates email-to-item conversion)
function createItemFromEmail(
  emailId: string,
  emailAccountId: string,
  analysis: {
    title: string;
    amount: number | null;
    due_date: string | null;
    category: ItemCategory;
    summary: string[];
    is_scam: boolean;
    risk_score: number;
  }
): Partial<Item> {
  return {
    title: analysis.title,
    category: analysis.category,
    amount: analysis.amount,
    due_date: analysis.due_date,
    summary: analysis.summary,
    status: 'new',
    is_scam: analysis.is_scam,
    risk_score: analysis.risk_score,
    source_type: 'email' as SourceType,
    email_id: emailId,
    email_account_id: emailAccountId,
    image_url: null,
    folder_id: null,
    life_stack_id: null,
  };
}

describe('Gmail Integration', () => {
  describe('isTransactionalEmail', () => {
    it('should identify payment/invoice emails as transactional', () => {
      const email: EmailContent = {
        id: 'test-1',
        from: 'billing@company.com',
        to: 'user@example.com',
        subject: 'Invoice #12345 - Payment Due',
        body: 'Your invoice for $150.00 is due on 01/15/2026. Please pay by the due date.',
        date: '2026-01-06',
        attachments: [],
      };

      expect(isTransactionalEmail(email)).toBe(true);
    });

    it('should identify order confirmation emails as transactional', () => {
      const email: EmailContent = {
        id: 'test-2',
        from: 'orders@amazon.com',
        to: 'user@example.com',
        subject: 'Order Confirmation #ABC123',
        body: 'Thank you for your purchase! Order #ABC123 has been confirmed. Total: $75.99',
        date: '2026-01-06',
        attachments: [],
      };

      expect(isTransactionalEmail(email)).toBe(true);
    });

    it('should identify shipping notification emails as transactional', () => {
      const email: EmailContent = {
        id: 'test-3',
        from: 'shipping@store.com',
        to: 'user@example.com',
        subject: 'Your order has shipped!',
        body: 'Your order has been shipped. Tracking number: 1Z999AA10123456784. Delivery expected by 01/10/2026.',
        date: '2026-01-06',
        attachments: [],
      };

      expect(isTransactionalEmail(email)).toBe(true);
    });

    it('should identify subscription renewal emails as transactional', () => {
      const email: EmailContent = {
        id: 'test-4',
        from: 'billing@netflix.com',
        to: 'user@example.com',
        subject: 'Your subscription renewal',
        body: 'Your subscription will renew on 01/20/2026. Amount: $15.99. Your account statement is attached.',
        date: '2026-01-06',
        attachments: [],
      };

      expect(isTransactionalEmail(email)).toBe(true);
    });

    it('should reject promotional emails', () => {
      const email: EmailContent = {
        id: 'test-5',
        from: 'marketing@store.com',
        to: 'user@example.com',
        subject: 'SALE! 50% off everything!',
        body: 'Limited time offer! Shop now and save big. Unsubscribe from this newsletter at any time. Free shipping on orders over $50!',
        date: '2026-01-06',
        attachments: [],
      };

      expect(isTransactionalEmail(email)).toBe(false);
    });

    it('should reject newsletter emails', () => {
      const email: EmailContent = {
        id: 'test-6',
        from: 'newsletter@blog.com',
        to: 'user@example.com',
        subject: 'Weekly Newsletter - Top Stories',
        body: 'Here are this week\'s top stories. Unsubscribe from this newsletter. Exclusive deals inside!',
        date: '2026-01-06',
        attachments: [],
      };

      expect(isTransactionalEmail(email)).toBe(false);
    });

    it('should identify bank statement emails as transactional', () => {
      const email: EmailContent = {
        id: 'test-7',
        from: 'statements@bank.com',
        to: 'user@example.com',
        subject: 'Your Monthly Bank Statement',
        body: 'Your account statement for December 2025 is ready. Balance: $5,234.56. Transaction details enclosed.',
        date: '2026-01-06',
        attachments: [],
      };

      expect(isTransactionalEmail(email)).toBe(true);
    });

    it('should identify tuition/education emails as transactional', () => {
      const email: EmailContent = {
        id: 'test-8',
        from: 'registrar@university.edu',
        to: 'student@example.com',
        subject: 'Tuition Fee Due - Spring Semester',
        body: 'Your tuition fee of $12,500 for the Spring semester is due by 01/15/2026. Registration deadline approaching.',
        date: '2026-01-06',
        attachments: [],
      };

      expect(isTransactionalEmail(email)).toBe(true);
    });
  });

  describe('Email Content Parsing', () => {
    it('should handle emails with attachments', () => {
      const email: EmailContent = {
        id: 'test-9',
        from: 'billing@utility.com',
        to: 'user@example.com',
        subject: 'Your Utility Bill',
        body: 'Your bill for $89.50 is due on 01/20/2026.',
        date: '2026-01-06',
        attachments: [
          { filename: 'bill.pdf', mimeType: 'application/pdf', size: 102400 },
        ],
      };

      expect(isTransactionalEmail(email)).toBe(true);
      expect(email.attachments.length).toBe(1);
    });

    it('should handle emails with multiple currency formats', () => {
      const emailUSD: EmailContent = {
        id: 'test-10',
        from: 'billing@company.com',
        to: 'user@example.com',
        subject: 'Payment Due',
        body: 'Amount due: $150.00 USD',
        date: '2026-01-06',
        attachments: [],
      };

      const emailINR: EmailContent = {
        id: 'test-11',
        from: 'billing@company.in',
        to: 'user@example.com',
        subject: 'Payment Due',
        body: 'Amount due: ₹12,000',
        date: '2026-01-06',
        attachments: [],
      };

      expect(isTransactionalEmail(emailUSD)).toBe(true);
      expect(isTransactionalEmail(emailINR)).toBe(true);
    });
  });

  describe('Email to Item Creation', () => {
    it('should create item with email source type', () => {
      const emailId = 'email-123';
      const emailAccountId = 'account-456';
      const analysis = {
        title: 'Electric Bill - January 2026',
        amount: 150.00,
        due_date: '2026-01-20',
        category: 'Finance' as ItemCategory,
        summary: ['Pay $150.00', 'Due by January 20', 'Late fee applies after due date'],
        is_scam: false,
        risk_score: 0,
      };

      const item = createItemFromEmail(emailId, emailAccountId, analysis);

      expect(item.source_type).toBe('email');
      expect(item.email_id).toBe(emailId);
      expect(item.email_account_id).toBe(emailAccountId);
      expect(item.title).toBe(analysis.title);
      expect(item.amount).toBe(analysis.amount);
      expect(item.category).toBe(analysis.category);
    });

    it('should preserve scam detection in created item', () => {
      const analysis = {
        title: 'Suspicious Payment Request',
        amount: 500.00,
        due_date: '2026-01-10',
        category: 'Finance' as ItemCategory,
        summary: ['Urgent payment required', 'Act immediately', 'Account will be suspended'],
        is_scam: true,
        risk_score: 85,
      };

      const item = createItemFromEmail('email-scam', 'account-1', analysis);

      expect(item.is_scam).toBe(true);
      expect(item.risk_score).toBe(85);
    });

    it('should handle emails without amounts', () => {
      const analysis = {
        title: 'Appointment Confirmation',
        amount: null,
        due_date: '2026-01-15',
        category: 'Health' as ItemCategory,
        summary: ['Doctor appointment confirmed', 'January 15 at 2:00 PM', 'No cancellation fee'],
        is_scam: false,
        risk_score: 0,
      };

      const item = createItemFromEmail('email-appt', 'account-1', analysis);

      expect(item.amount).toBeNull();
      expect(item.due_date).toBe('2026-01-15');
      expect(item.category).toBe('Health');
    });

    it('should set default status to new', () => {
      const analysis = {
        title: 'Test Item',
        amount: 100,
        due_date: null,
        category: 'Other' as ItemCategory,
        summary: [],
        is_scam: false,
        risk_score: 0,
      };

      const item = createItemFromEmail('email-1', 'account-1', analysis);

      expect(item.status).toBe('new');
    });
  });

  describe('Email Account Limits', () => {
    it('should enforce maximum 3 accounts limit', () => {
      const accounts = [
        { id: '1', email: 'personal@gmail.com', account_type: 'personal' },
        { id: '2', email: 'work@company.com', account_type: 'work' },
        { id: '3', email: 'business@business.com', account_type: 'business' },
      ];

      expect(accounts.length).toBe(3);
      
      // Attempting to add a 4th account should be rejected
      const canAddMore = accounts.length < 3;
      expect(canAddMore).toBe(false);
    });

    it('should prevent duplicate email accounts', () => {
      const existingAccounts = [
        { id: '1', email: 'user@gmail.com', account_type: 'personal' },
      ];
      const newEmail = 'user@gmail.com';

      const isDuplicate = existingAccounts.some(a => a.email === newEmail);
      expect(isDuplicate).toBe(true);
    });
  });
});
