import { create } from 'zustand';
import { Profile, NotificationSettings } from '../types';
import * as SecureStore from 'expo-secure-store';

// Keys for secure storage
const USER_EMAIL_KEY = 'grylin_user_email';
const USER_NAME_KEY = 'grylin_user_name';
const IS_LOGGED_IN_KEY = 'grylin_is_logged_in';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  refreshProfile: () => Promise<void>;
  initAuthListener: () => { unsubscribe: () => void };
  updateNotificationSettings: (settings: NotificationSettings) => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// Generate a deterministic user ID from email
function generateUserId(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-a${hex.slice(1, 4)}-${hex.padEnd(12, '0').slice(0, 12)}`;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      // Simple validation - accept any valid email with password >= 4 chars
      // For demo: test@gmail.com / 9900
      if (password.length < 4) {
        throw new Error('Password must be at least 4 characters');
      }
      
      const userId = generateUserId(email);
      const name = email.split('@')[0];
      
      const user: User = {
        id: userId,
        email: email,
        name: name,
      };
      
      const profile: Profile = {
        id: userId,
        email: email,
        full_name: name,
        is_premium: false,
        push_notifications_enabled: true,
        reminder_7day_enabled: true,
        reminder_1day_enabled: true,
        created_at: new Date().toISOString(),
      };
      
      // Store session
      await SecureStore.setItemAsync(USER_EMAIL_KEY, email);
      await SecureStore.setItemAsync(USER_NAME_KEY, name);
      await SecureStore.setItemAsync(IS_LOGGED_IN_KEY, 'true');
      
      set({
        user,
        profile,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    
    try {
      await SecureStore.deleteItemAsync(USER_EMAIL_KEY);
      await SecureStore.deleteItemAsync(USER_NAME_KEY);
      await SecureStore.deleteItemAsync(IS_LOGGED_IN_KEY);
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadSession: async () => {
    set({ isLoading: true });
    
    try {
      const isLoggedIn = await SecureStore.getItemAsync(IS_LOGGED_IN_KEY);
      const email = await SecureStore.getItemAsync(USER_EMAIL_KEY);
      const name = await SecureStore.getItemAsync(USER_NAME_KEY);
      
      if (isLoggedIn === 'true' && email) {
        const userId = generateUserId(email);
        
        const user: User = {
          id: userId,
          email: email,
          name: name || undefined,
        };
        
        const profile: Profile = {
          id: userId,
          email: email,
          full_name: name || email.split('@')[0],
          is_premium: false,
          push_notifications_enabled: true,
          reminder_7day_enabled: true,
          reminder_1day_enabled: true,
          created_at: new Date().toISOString(),
        };
        
        set({
          user,
          profile,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
      
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Load session error:', error);
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setProfile: (profile: Profile | null) => {
    set({ profile });
  },

  refreshProfile: async () => {
    // No-op for simple auth
  },

  updateNotificationSettings: async (settings: NotificationSettings) => {
    const { profile } = get();
    if (!profile) throw new Error('User not authenticated');
    
    const updatedProfile = { ...profile, ...settings };
    set({ profile: updatedProfile });
  },

  initAuthListener: () => {
    return { unsubscribe: () => {} };
  },
}));

export const signOut = async () => {
  return useAuthStore.getState().signOut();
};

// Store a flag to track if user is from local auth (not Supabase)
let isLocalAuthUser = false;

export function setLocalAuthUser(isLocal: boolean): void {
  isLocalAuthUser = isLocal;
}

/**
 * Check if the user is a test/demo user (not authenticated via Supabase)
 * Test users use local storage instead of Supabase database
 */
export function isTestUser(userId: string): boolean {
  // If we know this is a local auth user, return true
  if (isLocalAuthUser) {
    return true;
  }
  
  // For safety, always use local storage for now since we're using simple auth
  // This ensures the app works without Supabase being fully configured
  return true;
}
