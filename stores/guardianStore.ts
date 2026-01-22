import { create } from 'zustand';
import { GuardianAlert, GuardianAlertType, Item, NotificationSettings } from '../types';
import {
  getGuardianAlerts,
  createGuardianAlert,
  updateGuardianAlert,
  dismissGuardianAlert,
  getItems,
} from '../lib/supabase';
import { isTestUser } from './authStore';
import { getLocalItems, getLocalAlerts, createLocalAlert, updateLocalAlert } from '../lib/localStorage';

interface GroupedAlerts {
  overdue: GuardianAlert[];
  today: GuardianAlert[];
  thisWeek: GuardianAlert[];
  later: GuardianAlert[];
}

interface GuardianState {
  alerts: GuardianAlert[];
  unreadCount: number;
  isMonitoring: boolean;
  isLoading: boolean;
  error: string | null;
}

interface GuardianActions {
  fetchAlerts: (userId: string) => Promise<void>;
  checkDeadlines: (userId: string, notificationSettings?: NotificationSettings) => Promise<void>;
  createAlert: (
    userId: string,
    itemId: string,
    alertType: GuardianAlertType,
    triggerDate: Date
  ) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  dismissAlertsForItem: (itemId: string) => Promise<void>;
  getAlertsByUrgency: () => GroupedAlerts;
  clearError: () => void;
}

type GuardianStore = GuardianState & GuardianActions;

// Helper to get start of today
function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Helper to get end of today
function getEndOfToday(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

// Helper to get end of this week (7 days from now)
function getEndOfWeek(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(23, 59, 59, 999);
  return date;
}

export const useGuardianStore = create<GuardianStore>((set, get) => ({
  // Initial state
  alerts: [],
  unreadCount: 0,
  isMonitoring: false,
  isLoading: false,
  error: null,

  // Fetch all alerts for a user
  fetchAlerts: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      let alerts: GuardianAlert[];
      if (isTestUser(userId)) {
        alerts = await getLocalAlerts(userId);
      } else {
        alerts = await getGuardianAlerts(userId);
      }
      const unreadCount = alerts.filter((a) => !a.is_dismissed).length;
      set({ alerts, unreadCount, isLoading: false });
    } catch (error: any) {
      // Silently handle UUID errors
      if (!error?.message?.includes('uuid') && !error?.code?.includes('22P02')) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch alerts',
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  // Check all items for upcoming deadlines and create alerts
  // Respects user notification settings for 7-day and 1-day reminders
  checkDeadlines: async (userId: string, notificationSettings?: NotificationSettings) => {
    set({ isMonitoring: true, error: null });
    try {
      let items: Item[];
      if (isTestUser(userId)) {
        items = await getLocalItems(userId);
      } else {
        items = await getItems(userId);
      }
      const { alerts, createAlert } = get();
      const now = new Date();

      // Default to all notifications enabled if settings not provided
      const settings: NotificationSettings = notificationSettings || {
        push_notifications_enabled: true,
        reminder_7day_enabled: true,
        reminder_1day_enabled: true,
      };

      // If push notifications are disabled, don't create any alerts
      if (!settings.push_notifications_enabled) {
        set({ isMonitoring: false });
        return;
      }

      for (const item of items) {
        if (!item.due_date || item.status === 'paid' || item.status === 'archived') {
          continue;
        }

        const dueDate = new Date(item.due_date);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if alert already exists for this item
        const existingAlert = alerts.find(
          (a) => a.item_id === item.id && !a.is_dismissed
        );

        if (existingAlert) continue;

        // Create appropriate alert based on days until due and user settings
        if (daysUntilDue < 0) {
          // Overdue - always create alert
          await createAlert(userId, item.id, 'overdue', dueDate);
        } else if (daysUntilDue <= 1 && settings.reminder_1day_enabled) {
          // Due within 1 day - only if 1-day reminder is enabled
          await createAlert(userId, item.id, 'deadline_1day', dueDate);
        } else if (daysUntilDue <= 7 && daysUntilDue > 1 && settings.reminder_7day_enabled) {
          // Due within 7 days (but more than 1 day) - only if 7-day reminder is enabled
          await createAlert(userId, item.id, 'deadline_7day', dueDate);
        }
      }

      // Refresh alerts after creating new ones
      await get().fetchAlerts(userId);
      set({ isMonitoring: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to check deadlines',
        isMonitoring: false,
      });
    }
  },

  // Create a new alert
  createAlert: async (
    userId: string,
    itemId: string,
    alertType: GuardianAlertType,
    triggerDate: Date
  ) => {
    try {
      let newAlert: GuardianAlert;
      const alertData = {
        user_id: userId,
        item_id: itemId,
        alert_type: alertType,
        trigger_date: triggerDate.toISOString(),
        is_dismissed: false,
        is_sent: false,
      };
      
      if (isTestUser(userId)) {
        newAlert = await createLocalAlert(alertData);
      } else {
        newAlert = await createGuardianAlert(alertData);
      }
      set((state) => ({
        alerts: [...state.alerts, newAlert],
        unreadCount: state.unreadCount + 1,
      }));
    } catch (error) {
      // Silently fail for duplicate alerts
      console.warn('Failed to create alert:', error);
    }
  },

  // Dismiss a single alert
  dismissAlert: async (alertId: string) => {
    try {
      const { alerts } = get();
      const alert = alerts.find(a => a.id === alertId);
      
      if (alert && isTestUser(alert.user_id)) {
        await updateLocalAlert(alertId, { is_dismissed: true });
      } else {
        await dismissGuardianAlert(alertId);
      }
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === alertId ? { ...a, is_dismissed: true } : a
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to dismiss alert',
      });
    }
  },

  // Dismiss all alerts for an item (e.g., when marked as paid)
  dismissAlertsForItem: async (itemId: string) => {
    const { alerts } = get();
    const itemAlerts = alerts.filter(
      (a) => a.item_id === itemId && !a.is_dismissed
    );

    for (const alert of itemAlerts) {
      await get().dismissAlert(alert.id);
    }
  },

  // Group alerts by urgency
  getAlertsByUrgency: () => {
    const { alerts } = get();
    const now = new Date();
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
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));
