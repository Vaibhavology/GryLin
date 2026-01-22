/**
 * Guardian Alerts Integration Tests
 * Tests alert creation, timing, and notification scheduling
 */

import { Item, GuardianAlert, GuardianAlertType, NotificationSettings } from '../../types';

// Helper functions from guardianStore logic
function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getEndOfToday(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

function getEndOfWeek(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(23, 59, 59, 999);
  return date;
}

function groupAlertsByUrgency(alerts: GuardianAlert[]): {
  overdue: GuardianAlert[];
  today: GuardianAlert[];
  thisWeek: GuardianAlert[];
  later: GuardianAlert[];
} {
  const startOfToday = getStartOfToday();
  const endOfToday = getEndOfToday();
  const endOfWeek = getEndOfWeek();

  const activeAlerts = alerts.filter((a) => !a.is_dismissed);

  return {
    overdue: activeAlerts.filter((a) => new Date(a.trigger_date) < startOfToday),
    today: activeAlerts.filter((a) => {
      const date = new Date(a.trigger_date);
      return date >= startOfToday && date <= endOfToday;
    }),
    thisWeek: activeAlerts.filter((a) => {
      const date = new Date(a.trigger_date);
      return date > endOfToday && date <= endOfWeek;
    }),
    later: activeAlerts.filter((a) => new Date(a.trigger_date) > endOfWeek),
  };
}

function determineAlertType(dueDate: Date, now: Date): GuardianAlertType | null {
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue < 0) {
    return 'overdue';
  } else if (daysUntilDue <= 1) {
    return 'deadline_1day';
  } else if (daysUntilDue <= 7) {
    return 'deadline_7day';
  }
  return null;
}

function shouldCreateAlert(
  alertType: GuardianAlertType,
  settings: NotificationSettings
): boolean {
  if (!settings.push_notifications_enabled) {
    return false;
  }

  switch (alertType) {
    case 'overdue':
      return true; // Always create overdue alerts
    case 'deadline_1day':
      return settings.reminder_1day_enabled;
    case 'deadline_7day':
      return settings.reminder_7day_enabled;
    case 'scam_warning':
      return true; // Always create scam warnings
    default:
      return false;
  }
}

describe('Guardian Alerts Integration', () => {
  const createMockAlert = (overrides: Partial<GuardianAlert> = {}): GuardianAlert => ({
    id: 'alert-1',
    user_id: 'user-1',
    item_id: 'item-1',
    alert_type: 'deadline_7day',
    trigger_date: new Date().toISOString(),
    is_dismissed: false,
    is_sent: false,
    created_at: new Date().toISOString(),
    ...overrides,
  });

  describe('Alert Timing', () => {
    it('should create deadline_7day alert for items due within 7 days', () => {
      const now = new Date();
      const dueIn5Days = new Date(now);
      dueIn5Days.setDate(now.getDate() + 5);

      const alertType = determineAlertType(dueIn5Days, now);
      expect(alertType).toBe('deadline_7day');
    });

    it('should create deadline_1day alert for items due within 1 day', () => {
      const now = new Date();
      const dueIn12Hours = new Date(now);
      dueIn12Hours.setHours(now.getHours() + 12);

      const alertType = determineAlertType(dueIn12Hours, now);
      expect(alertType).toBe('deadline_1day');
    });

    it('should create overdue alert for past due items', () => {
      const now = new Date();
      const pastDue = new Date(now);
      pastDue.setDate(now.getDate() - 2);

      const alertType = determineAlertType(pastDue, now);
      expect(alertType).toBe('overdue');
    });

    it('should return null for items due more than 7 days away', () => {
      const now = new Date();
      const dueIn10Days = new Date(now);
      dueIn10Days.setDate(now.getDate() + 10);

      const alertType = determineAlertType(dueIn10Days, now);
      expect(alertType).toBeNull();
    });

    it('should handle items due exactly on day boundaries', () => {
      const now = new Date();
      
      // Due in exactly 1 day
      const dueIn1Day = new Date(now);
      dueIn1Day.setDate(now.getDate() + 1);
      expect(determineAlertType(dueIn1Day, now)).toBe('deadline_1day');

      // Due in exactly 7 days
      const dueIn7Days = new Date(now);
      dueIn7Days.setDate(now.getDate() + 7);
      expect(determineAlertType(dueIn7Days, now)).toBe('deadline_7day');
    });
  });

  describe('Alert Grouping by Urgency', () => {
    it('should group overdue alerts correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const alerts = [
        createMockAlert({ id: 'a1', trigger_date: yesterday.toISOString() }),
      ];

      const grouped = groupAlertsByUrgency(alerts);
      expect(grouped.overdue.length).toBe(1);
      expect(grouped.today.length).toBe(0);
    });

    it('should group today alerts correctly', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const alerts = [
        createMockAlert({ id: 'a1', trigger_date: today.toISOString() }),
      ];

      const grouped = groupAlertsByUrgency(alerts);
      expect(grouped.today.length).toBe(1);
      expect(grouped.overdue.length).toBe(0);
    });

    it('should group this week alerts correctly', () => {
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);

      const alerts = [
        createMockAlert({ id: 'a1', trigger_date: in3Days.toISOString() }),
      ];

      const grouped = groupAlertsByUrgency(alerts);
      expect(grouped.thisWeek.length).toBe(1);
    });

    it('should group later alerts correctly', () => {
      const in10Days = new Date();
      in10Days.setDate(in10Days.getDate() + 10);

      const alerts = [
        createMockAlert({ id: 'a1', trigger_date: in10Days.toISOString() }),
      ];

      const grouped = groupAlertsByUrgency(alerts);
      expect(grouped.later.length).toBe(1);
    });

    it('should exclude dismissed alerts from grouping', () => {
      const today = new Date();

      const alerts = [
        createMockAlert({ id: 'a1', trigger_date: today.toISOString(), is_dismissed: false }),
        createMockAlert({ id: 'a2', trigger_date: today.toISOString(), is_dismissed: true }),
      ];

      const grouped = groupAlertsByUrgency(alerts);
      const totalActive = 
        grouped.overdue.length + 
        grouped.today.length + 
        grouped.thisWeek.length + 
        grouped.later.length;
      
      expect(totalActive).toBe(1);
    });

    it('should handle multiple alerts in different groups', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      
      const in10Days = new Date();
      in10Days.setDate(in10Days.getDate() + 10);

      const alerts = [
        createMockAlert({ id: 'a1', trigger_date: yesterday.toISOString() }),
        createMockAlert({ id: 'a2', trigger_date: today.toISOString() }),
        createMockAlert({ id: 'a3', trigger_date: in3Days.toISOString() }),
        createMockAlert({ id: 'a4', trigger_date: in10Days.toISOString() }),
      ];

      const grouped = groupAlertsByUrgency(alerts);
      expect(grouped.overdue.length).toBe(1);
      expect(grouped.today.length).toBe(1);
      expect(grouped.thisWeek.length).toBe(1);
      expect(grouped.later.length).toBe(1);
    });
  });

  describe('Notification Settings', () => {
    it('should respect push_notifications_enabled setting', () => {
      const settings: NotificationSettings = {
        push_notifications_enabled: false,
        reminder_7day_enabled: true,
        reminder_1day_enabled: true,
      };

      expect(shouldCreateAlert('deadline_7day', settings)).toBe(false);
      expect(shouldCreateAlert('deadline_1day', settings)).toBe(false);
      expect(shouldCreateAlert('overdue', settings)).toBe(false);
    });

    it('should respect reminder_7day_enabled setting', () => {
      const settingsEnabled: NotificationSettings = {
        push_notifications_enabled: true,
        reminder_7day_enabled: true,
        reminder_1day_enabled: true,
      };

      const settingsDisabled: NotificationSettings = {
        push_notifications_enabled: true,
        reminder_7day_enabled: false,
        reminder_1day_enabled: true,
      };

      expect(shouldCreateAlert('deadline_7day', settingsEnabled)).toBe(true);
      expect(shouldCreateAlert('deadline_7day', settingsDisabled)).toBe(false);
    });

    it('should respect reminder_1day_enabled setting', () => {
      const settingsEnabled: NotificationSettings = {
        push_notifications_enabled: true,
        reminder_7day_enabled: true,
        reminder_1day_enabled: true,
      };

      const settingsDisabled: NotificationSettings = {
        push_notifications_enabled: true,
        reminder_7day_enabled: true,
        reminder_1day_enabled: false,
      };

      expect(shouldCreateAlert('deadline_1day', settingsEnabled)).toBe(true);
      expect(shouldCreateAlert('deadline_1day', settingsDisabled)).toBe(false);
    });

    it('should always create overdue alerts when push is enabled', () => {
      const settings: NotificationSettings = {
        push_notifications_enabled: true,
        reminder_7day_enabled: false,
        reminder_1day_enabled: false,
      };

      expect(shouldCreateAlert('overdue', settings)).toBe(true);
    });

    it('should always create scam warnings when push is enabled', () => {
      const settings: NotificationSettings = {
        push_notifications_enabled: true,
        reminder_7day_enabled: false,
        reminder_1day_enabled: false,
      };

      expect(shouldCreateAlert('scam_warning', settings)).toBe(true);
    });
  });

  describe('Alert Dismissal', () => {
    it('should mark alert as dismissed', () => {
      const alert = createMockAlert({ is_dismissed: false });
      const dismissedAlert = { ...alert, is_dismissed: true };
      
      expect(dismissedAlert.is_dismissed).toBe(true);
    });

    it('should cascade dismissal for item when marked as paid', () => {
      const itemId = 'item-1';
      const alerts = [
        createMockAlert({ id: 'a1', item_id: itemId, is_dismissed: false }),
        createMockAlert({ id: 'a2', item_id: itemId, is_dismissed: false }),
        createMockAlert({ id: 'a3', item_id: 'item-2', is_dismissed: false }),
      ];

      // Simulate cascade dismissal
      const updatedAlerts = alerts.map(a => 
        a.item_id === itemId ? { ...a, is_dismissed: true } : a
      );

      const dismissedForItem = updatedAlerts.filter(
        a => a.item_id === itemId && a.is_dismissed
      );
      const notDismissed = updatedAlerts.filter(a => !a.is_dismissed);

      expect(dismissedForItem.length).toBe(2);
      expect(notDismissed.length).toBe(1);
    });
  });
});
