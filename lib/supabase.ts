import { createClient, AuthResponse, Session, Subscription, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Types
export type ItemCategory = 'Finance' | 'Education' | 'Shopping' | 'Health' | 'Career' | 'Other';
export type ItemStatus = 'new' | 'paid' | 'archived';
export type SourceType = 'scan' | 'email' | 'manual';
export type AccountType = 'personal' | 'work' | 'business';
export type GuardianAlertType = 'deadline_7day' | 'deadline_1day' | 'overdue' | 'scam_warning';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_premium: boolean;
  push_notifications_enabled: boolean;
  reminder_7day_enabled: boolean;
  reminder_1day_enabled: boolean;
  created_at: string;
}

export interface NotificationSettings {
  push_notifications_enabled: boolean;
  reminder_7day_enabled: boolean;
  reminder_1day_enabled: boolean;
}

export interface Item {
  id: string;
  user_id: string;
  title: string;
  category: ItemCategory;
  amount: number | null;
  due_date: string | null;
  summary: string[];
  status: ItemStatus;
  image_url: string | null;
  is_scam: boolean;
  folder_id: string | null;
  source_type: SourceType;
  email_id: string | null;
  email_account_id: string | null;
  life_stack_id: string | null;
  risk_score: number;
  created_at: string;
}

export interface VaultFolder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  item_count?: number;
}

export interface EmailAccount {
  id: string;
  user_id: string;
  email: string;
  account_type: AccountType;
  access_token: string;
  refresh_token: string;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LifeStack {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  created_at: string;
  item_count?: number;
}

export interface GuardianAlert {
  id: string;
  user_id: string;
  item_id: string;
  alert_type: GuardianAlertType;
  trigger_date: string;
  is_dismissed: boolean;
  is_sent: boolean;
  created_at: string;
}

// Secure storage adapter for Supabase auth
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};


// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================
// AUTHENTICATION METHODS
// ============================================

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(
  callback: (session: Session | null) => void
): Subscription {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
}

// ============================================
// PROFILE METHODS
// ============================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'is_premium' | 'push_notifications_enabled' | 'reminder_7day_enabled' | 'reminder_1day_enabled'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNotificationSettings(
  userId: string,
  settings: NotificationSettings
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      push_notifications_enabled: settings.push_notifications_enabled,
      reminder_7day_enabled: settings.reminder_7day_enabled,
      reminder_1day_enabled: settings.reminder_1day_enabled,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}


// ============================================
// ITEMS METHODS
// ============================================

// Pagination configuration
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(keyPattern?: string): void {
  if (keyPattern) {
    for (const key of cache.keys()) {
      if (key.includes(keyPattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

export async function getItems(
  userId: string,
  category?: ItemCategory | 'All'
): Promise<Item[]> {
  let query = supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get items with pagination support for large datasets
 */
export async function getItemsPaginated(
  userId: string,
  category?: ItemCategory | 'All',
  options: PaginationOptions = {}
): Promise<PaginatedResult<Item>> {
  const { page = 1, pageSize = 20 } = options;
  const offset = (page - 1) * pageSize;

  // Build count query
  let countQuery = supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (category && category !== 'All') {
    countQuery = countQuery.eq('category', category);
  }

  const { count: totalCount, error: countError } = await countQuery;
  if (countError) throw countError;

  // Build data query with pagination
  let dataQuery = supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true, nullsFirst: false })
    .range(offset, offset + pageSize - 1);

  if (category && category !== 'All') {
    dataQuery = dataQuery.eq('category', category);
  }

  const { data, error } = await dataQuery;
  if (error) throw error;

  const total = totalCount || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: data || [],
    totalCount: total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

export async function getUpcomingItems(
  userId: string,
  daysAhead: number = 3
): Promise<Item[]> {
  // Check cache first
  const cacheKey = `upcoming_${userId}_${daysAhead}`;
  const cached = getCached<Item[]>(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .not('due_date', 'is', null)
    .gte('due_date', now.toISOString())
    .lte('due_date', futureDate.toISOString())
    .order('due_date', { ascending: true });

  if (error) throw error;
  
  const result = data || [];
  setCache(cacheKey, result);
  return result;
}

export async function createItem(
  item: Omit<Item, 'id' | 'created_at'>
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  
  // Invalidate relevant caches
  clearCache(`upcoming_${item.user_id}`);
  clearCache(`folders_${item.user_id}`);
  clearCache(`lifestacks_${item.user_id}`);
  
  return data;
}

export async function updateItem(
  itemId: string,
  updates: Partial<Omit<Item, 'id' | 'user_id' | 'created_at'>>
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  
  // Invalidate caches (we don't know user_id here, so clear all item-related caches)
  clearCache('upcoming_');
  clearCache('folders_');
  clearCache('lifestacks_');
  
  return data;
}

export async function updateItemStatus(
  itemId: string,
  status: ItemStatus
): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ status })
    .eq('id', itemId);

  if (error) throw error;
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
  
  // Invalidate caches
  clearCache('upcoming_');
  clearCache('folders_');
  clearCache('lifestacks_');
}


// ============================================
// VAULT FOLDER METHODS
// ============================================

export async function getFolders(userId: string): Promise<VaultFolder[]> {
  // Check cache first
  const cacheKey = `folders_${userId}`;
  const cached = getCached<VaultFolder[]>(cacheKey);
  if (cached) return cached;

  // Fetch folders with item counts in a single optimized query
  const { data: folders, error: foldersError } = await supabase
    .from('vault_folders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (foldersError) throw foldersError;
  if (!folders || folders.length === 0) return [];

  // Get all item counts in a single query using group by
  const folderIds = folders.map(f => f.id);
  const { data: itemCounts, error: countError } = await supabase
    .from('items')
    .select('folder_id')
    .in('folder_id', folderIds);

  if (countError) throw countError;

  // Count items per folder
  const countMap = new Map<string, number>();
  (itemCounts || []).forEach(item => {
    const count = countMap.get(item.folder_id) || 0;
    countMap.set(item.folder_id, count + 1);
  });

  const foldersWithCounts = folders.map(folder => ({
    ...folder,
    item_count: countMap.get(folder.id) || 0,
  }));

  setCache(cacheKey, foldersWithCounts);
  return foldersWithCounts;
}

export async function createFolder(
  name: string,
  userId: string
): Promise<VaultFolder> {
  const { data, error } = await supabase
    .from('vault_folders')
    .insert({ name, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return { ...data, item_count: 0 };
}

export async function updateFolder(
  folderId: string,
  name: string
): Promise<VaultFolder> {
  const { data, error } = await supabase
    .from('vault_folders')
    .update({ name })
    .eq('id', folderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('vault_folders')
    .delete()
    .eq('id', folderId);

  if (error) throw error;
}

export async function getItemsByFolder(folderId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('folder_id', folderId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// STORAGE METHODS
// ============================================

export async function uploadImage(
  bucket: string,
  path: string,
  file: Blob | ArrayBuffer
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Allow overwriting for retries
    });

  if (error) throw error;
  return data.path;
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get a signed URL for private bucket access
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL string
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  if (!data?.signedUrl) throw new Error('Failed to generate signed URL');
  return data.signedUrl;
}

export async function deleteImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

// Re-export types for convenience
export type { AuthResponse, Session, User, Subscription };


// ============================================
// EMAIL ACCOUNT METHODS
// ============================================

export async function getEmailAccounts(userId: string): Promise<EmailAccount[]> {
  const { data, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createEmailAccount(
  account: Omit<EmailAccount, 'id' | 'created_at' | 'last_sync_at'>
): Promise<EmailAccount> {
  const { data, error } = await supabase
    .from('email_accounts')
    .insert(account)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmailAccount(
  accountId: string,
  updates: Partial<Omit<EmailAccount, 'id' | 'user_id' | 'created_at'>>
): Promise<EmailAccount> {
  const { data, error } = await supabase
    .from('email_accounts')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEmailAccount(accountId: string): Promise<void> {
  const { error } = await supabase
    .from('email_accounts')
    .delete()
    .eq('id', accountId);

  if (error) throw error;
}


// ============================================
// LIFE STACK METHODS
// ============================================

export async function getLifeStacks(userId: string): Promise<LifeStack[]> {
  // Check cache first
  const cacheKey = `lifestacks_${userId}`;
  const cached = getCached<LifeStack[]>(cacheKey);
  if (cached) return cached;

  const { data: stacks, error: stacksError } = await supabase
    .from('life_stacks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (stacksError) throw stacksError;
  if (!stacks || stacks.length === 0) return [];

  // Get all item counts in a single query
  const stackIds = stacks.map(s => s.id);
  const { data: itemCounts, error: countError } = await supabase
    .from('items')
    .select('life_stack_id')
    .in('life_stack_id', stackIds);

  if (countError) throw countError;

  // Count items per stack
  const countMap = new Map<string, number>();
  (itemCounts || []).forEach(item => {
    const count = countMap.get(item.life_stack_id) || 0;
    countMap.set(item.life_stack_id, count + 1);
  });

  const stacksWithCounts = stacks.map(stack => ({
    ...stack,
    item_count: countMap.get(stack.id) || 0,
  }));

  setCache(cacheKey, stacksWithCounts);
  return stacksWithCounts;
}

export async function createLifeStack(
  stack: Omit<LifeStack, 'id' | 'created_at' | 'item_count'>
): Promise<LifeStack> {
  const { data, error } = await supabase
    .from('life_stacks')
    .insert(stack)
    .select()
    .single();

  if (error) throw error;
  return { ...data, item_count: 0 };
}

export async function updateLifeStack(
  stackId: string,
  updates: Partial<Omit<LifeStack, 'id' | 'user_id' | 'created_at'>>
): Promise<LifeStack> {
  const { data, error } = await supabase
    .from('life_stacks')
    .update(updates)
    .eq('id', stackId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLifeStack(stackId: string): Promise<void> {
  const { error } = await supabase
    .from('life_stacks')
    .delete()
    .eq('id', stackId);

  if (error) throw error;
}

export async function getItemsByLifeStack(stackId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('life_stack_id', stackId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data || [];
}


// ============================================
// GUARDIAN ALERT METHODS
// ============================================

export async function getGuardianAlerts(userId: string): Promise<GuardianAlert[]> {
  const { data, error } = await supabase
    .from('guardian_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('trigger_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createGuardianAlert(
  alert: Omit<GuardianAlert, 'id' | 'created_at'>
): Promise<GuardianAlert> {
  const { data, error } = await supabase
    .from('guardian_alerts')
    .insert(alert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGuardianAlert(
  alertId: string,
  updates: Partial<Omit<GuardianAlert, 'id' | 'user_id' | 'created_at'>>
): Promise<GuardianAlert> {
  const { data, error } = await supabase
    .from('guardian_alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function dismissGuardianAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('guardian_alerts')
    .update({ is_dismissed: true })
    .eq('id', alertId);

  if (error) throw error;
}

export async function deleteGuardianAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('guardian_alerts')
    .delete()
    .eq('id', alertId);

  if (error) throw error;
}

export async function dismissAlertsForItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('guardian_alerts')
    .update({ is_dismissed: true })
    .eq('item_id', itemId)
    .eq('is_dismissed', false);

  if (error) throw error;
}
