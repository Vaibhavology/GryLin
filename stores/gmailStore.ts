import { create } from 'zustand';
import { EmailAccount, AccountType } from '../types';
import { GoogleAuthResult } from '../lib/gmail';
import {
  getEmailAccounts,
  createEmailAccount,
  updateEmailAccount,
  deleteEmailAccount,
} from '../lib/supabase';
import { getUserFriendlyMessage } from '../lib/errorHandler';
import { isTestUser } from './authStore';
import { getLocalEmailAccounts, createLocalEmailAccount, deleteLocalEmailAccount } from '../lib/localStorage';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface GmailState {
  accounts: EmailAccount[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncError: string | null;
  isLoading: boolean;
}

interface GmailActions {
  // Account management
  fetchAccounts: (userId: string) => Promise<void>;
  addAccount: (
    userId: string,
    authResult: GoogleAuthResult,
    accountType: AccountType
  ) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  
  // Sync operations
  syncEmails: (accountId: string) => Promise<void>;
  syncAllAccounts: () => Promise<void>;
  
  // Helpers
  getAccountStatus: (accountId: string) => SyncStatus;
  clearError: () => void;
}

type GmailStore = GmailState & GmailActions;

export const useGmailStore = create<GmailStore>((set, get) => ({
  // Initial state
  accounts: [],
  isSyncing: false,
  lastSyncAt: null,
  syncError: null,
  isLoading: false,

  // Fetch all linked accounts for a user
  fetchAccounts: async (userId: string) => {
    set({ isLoading: true });
    try {
      let accounts: EmailAccount[];
      if (isTestUser(userId)) {
        accounts = await getLocalEmailAccounts(userId);
      } else {
        accounts = await getEmailAccounts(userId);
      }
      set({ accounts, isLoading: false, syncError: null });
    } catch (error: any) {
      // Silently handle UUID errors
      if (!error?.message?.includes('uuid') && !error?.code?.includes('22P02')) {
        const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
        set({
          syncError: message,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  // Add a new Gmail account
  addAccount: async (
    userId: string,
    authResult: GoogleAuthResult,
    accountType: AccountType
  ) => {
    const { accounts } = get();
    
    // Check max accounts limit (3)
    if (accounts.length >= 3) {
      set({ syncError: 'You can only link up to 3 Gmail accounts.' });
      return;
    }

    // Check if account already exists
    if (accounts.some((a) => a.email === authResult.email)) {
      set({ syncError: 'This email account is already linked.' });
      return;
    }

    try {
      let newAccount: EmailAccount;
      const accountData = {
        user_id: userId,
        email: authResult.email,
        account_type: accountType,
        access_token: authResult.accessToken,
        refresh_token: authResult.refreshToken,
        is_active: true,
      };
      
      if (isTestUser(userId)) {
        newAccount = await createLocalEmailAccount(accountData);
      } else {
        newAccount = await createEmailAccount(accountData);
      }

      set({ accounts: [...accounts, newAccount], syncError: null });
    } catch (error) {
      const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
      set({ syncError: message });
    }
  },

  // Remove a linked account
  removeAccount: async (accountId: string) => {
    try {
      const { accounts } = get();
      const account = accounts.find(a => a.id === accountId);
      
      if (account && isTestUser(account.user_id)) {
        await deleteLocalEmailAccount(accountId);
      } else {
        await deleteEmailAccount(accountId);
      }
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== accountId),
        syncError: null,
      }));
    } catch (error) {
      const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
      set({ syncError: message });
    }
  },

  // Sync emails for a single account
  syncEmails: async (accountId: string) => {
    const { accounts } = get();
    const account = accounts.find((a) => a.id === accountId);
    
    if (!account) {
      set({ syncError: 'Account not found. Please try again.' });
      return;
    }

    set({ isSyncing: true, syncError: null });

    try {
      // Update last sync timestamp
      await updateEmailAccount(accountId, {
        last_sync_at: new Date().toISOString(),
      });

      // Update local state
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === accountId
            ? { ...a, last_sync_at: new Date().toISOString() }
            : a
        ),
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
      }));
    } catch (error) {
      const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
      set({
        isSyncing: false,
        syncError: message,
      });
    }
  },

  // Sync all accounts
  syncAllAccounts: async () => {
    const { accounts, syncEmails } = get();
    
    set({ isSyncing: true, syncError: null });

    for (const account of accounts) {
      if (account.is_active) {
        await syncEmails(account.id);
      }
    }

    set({ isSyncing: false });
  },

  // Get sync status for an account
  getAccountStatus: (accountId: string): SyncStatus => {
    const { accounts, isSyncing, syncError } = get();
    const account = accounts.find((a) => a.id === accountId);
    
    if (!account) return 'idle';
    if (isSyncing) return 'syncing';
    if (syncError) return 'error';
    if (account.last_sync_at) return 'success';
    return 'idle';
  },

  // Clear error state
  clearError: () => {
    set({ syncError: null });
  },
}));
