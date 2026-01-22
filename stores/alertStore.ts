import { create } from 'zustand';
import { Alert, AlertType } from '../types';

interface AlertState {
  alerts: Alert[];
}

interface AlertActions {
  showAlert: (message: string, type: AlertType) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
}

type AlertStore = AlertState & AlertActions;

// Generate unique ID for alerts
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useAlertStore = create<AlertStore>((set) => ({
  // State
  alerts: [],

  // Actions
  showAlert: (message: string, type: AlertType) => {
    const newAlert: Alert = {
      id: generateId(),
      message,
      type,
    };
    set((state) => ({
      alerts: [...state.alerts, newAlert],
    }));
  },

  dismissAlert: (id: string) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    }));
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },
}));
