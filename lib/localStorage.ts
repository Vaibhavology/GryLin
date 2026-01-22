import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item, VaultFolder, LifeStack, GuardianAlert, EmailAccount } from '../types';

// Storage keys
const STORAGE_KEYS = {
  ITEMS: 'grylin_test_items',
  FOLDERS: 'grylin_test_folders',
  LIFE_STACKS: 'grylin_test_life_stacks',
  ALERTS: 'grylin_test_alerts',
  EMAIL_ACCOUNTS: 'grylin_test_email_accounts',
};

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// ITEMS
// ============================================

export async function getLocalItems(userId: string): Promise<Item[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!data) return [];
    const items: Item[] = JSON.parse(data);
    return items.filter(item => item.user_id === userId);
  } catch {
    return [];
  }
}

export async function createLocalItem(item: Omit<Item, 'id' | 'created_at'>): Promise<Item> {
  const newItem: Item = {
    ...item,
    id: generateUUID(),
    created_at: new Date().toISOString(),
  };
  
  const items = await getAllLocalItems();
  items.push(newItem);
  await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  return newItem;
}

export async function updateLocalItem(itemId: string, updates: Partial<Item>): Promise<Item> {
  const items = await getAllLocalItems();
  const index = items.findIndex(i => i.id === itemId);
  if (index === -1) throw new Error('Item not found');
  
  items[index] = { ...items[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  return items[index];
}

export async function deleteLocalItem(itemId: string): Promise<void> {
  const items = await getAllLocalItems();
  const filtered = items.filter(i => i.id !== itemId);
  await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(filtered));
}

async function getAllLocalItems(): Promise<Item[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ============================================
// FOLDERS
// ============================================

export async function getLocalFolders(userId: string): Promise<VaultFolder[]> {
  console.log('[localStorage] getLocalFolders called for user:', userId);
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (!data) return [];
    const folders: VaultFolder[] = JSON.parse(data);
    const userFolders = folders.filter(f => f.user_id === userId);
    console.log('[localStorage] User folders:', userFolders.length);
    return await addItemCountsToFolders(userFolders, userId);
  } catch (error) {
    console.error('[localStorage] Error getting folders:', error);
    return [];
  }
}

// Add item counts to folders
async function addItemCountsToFolders(folders: VaultFolder[], userId: string): Promise<VaultFolder[]> {
  const items = await getLocalItems(userId);
  return folders.map(folder => ({
    ...folder,
    item_count: items.filter(item => item.folder_id === folder.id).length,
  }));
}

export async function createLocalFolder(name: string, userId: string): Promise<VaultFolder> {
  console.log('[localStorage] createLocalFolder called:', { name, userId });
  const newFolder: VaultFolder = {
    id: generateUUID(),
    name,
    user_id: userId,
    created_at: new Date().toISOString(),
    item_count: 0,
  };
  
  const folders = await getAllLocalFolders();
  folders.push(newFolder);
  await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  console.log('[localStorage] Folder created:', newFolder.name);
  return newFolder;
}

export async function updateLocalFolder(folderId: string, name: string): Promise<VaultFolder> {
  const folders = await getAllLocalFolders();
  const index = folders.findIndex(f => f.id === folderId);
  if (index === -1) throw new Error('Folder not found');
  
  folders[index] = { ...folders[index], name };
  await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  return folders[index];
}

export async function deleteLocalFolder(folderId: string): Promise<void> {
  const folders = await getAllLocalFolders();
  const filtered = folders.filter(f => f.id !== folderId);
  await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(filtered));
  
  // Also remove folder_id from items in this folder
  const items = await getAllLocalItems();
  const updatedItems = items.map(item => 
    item.folder_id === folderId ? { ...item, folder_id: null } : item
  );
  await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(updatedItems));
}

export async function deleteAllLocalFolders(userId: string): Promise<void> {
  console.log('[localStorage] Deleting all folders for user:', userId);
  const folders = await getAllLocalFolders();
  const filtered = folders.filter(f => f.user_id !== userId);
  await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(filtered));
  
  // Also remove folder_id from all user's items
  const items = await getAllLocalItems();
  const updatedItems = items.map(item => 
    item.user_id === userId ? { ...item, folder_id: null } : item
  );
  await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(updatedItems));
  console.log('[localStorage] All folders deleted');
}

// Find or create folder by name (for auto-folder feature)
export async function findOrCreateFolder(name: string, userId: string): Promise<VaultFolder> {
  const folders = await getLocalFolders(userId);
  const existing = folders.find(f => f.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  return createLocalFolder(name, userId);
}

async function getAllLocalFolders(): Promise<VaultFolder[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FOLDERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ============================================
// LIFE STACKS
// ============================================

export async function getLocalLifeStacks(userId: string): Promise<LifeStack[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LIFE_STACKS);
    if (!data) return [];
    const stacks: LifeStack[] = JSON.parse(data);
    return stacks.filter(s => s.user_id === userId);
  } catch {
    return [];
  }
}

export async function createLocalLifeStack(stack: Omit<LifeStack, 'id' | 'created_at' | 'item_count'>): Promise<LifeStack> {
  const newStack: LifeStack = {
    ...stack,
    id: generateUUID(),
    created_at: new Date().toISOString(),
    item_count: 0,
  };
  
  const stacks = await getAllLocalLifeStacks();
  stacks.push(newStack);
  await AsyncStorage.setItem(STORAGE_KEYS.LIFE_STACKS, JSON.stringify(stacks));
  return newStack;
}

export async function updateLocalLifeStack(stackId: string, updates: Partial<LifeStack>): Promise<LifeStack> {
  const stacks = await getAllLocalLifeStacks();
  const index = stacks.findIndex(s => s.id === stackId);
  if (index === -1) throw new Error('Life stack not found');
  
  stacks[index] = { ...stacks[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.LIFE_STACKS, JSON.stringify(stacks));
  return stacks[index];
}

export async function deleteLocalLifeStack(stackId: string): Promise<void> {
  const stacks = await getAllLocalLifeStacks();
  const filtered = stacks.filter(s => s.id !== stackId);
  await AsyncStorage.setItem(STORAGE_KEYS.LIFE_STACKS, JSON.stringify(filtered));
}

async function getAllLocalLifeStacks(): Promise<LifeStack[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LIFE_STACKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ============================================
// GUARDIAN ALERTS
// ============================================

export async function getLocalAlerts(userId: string): Promise<GuardianAlert[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
    if (!data) return [];
    const alerts: GuardianAlert[] = JSON.parse(data);
    return alerts.filter(a => a.user_id === userId);
  } catch {
    return [];
  }
}

export async function createLocalAlert(alert: Omit<GuardianAlert, 'id' | 'created_at'>): Promise<GuardianAlert> {
  const newAlert: GuardianAlert = {
    ...alert,
    id: generateUUID(),
    created_at: new Date().toISOString(),
  };
  
  const alerts = await getAllLocalAlerts();
  alerts.push(newAlert);
  await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  return newAlert;
}

export async function updateLocalAlert(alertId: string, updates: Partial<GuardianAlert>): Promise<GuardianAlert> {
  const alerts = await getAllLocalAlerts();
  const index = alerts.findIndex(a => a.id === alertId);
  if (index === -1) throw new Error('Alert not found');
  
  alerts[index] = { ...alerts[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  return alerts[index];
}

async function getAllLocalAlerts(): Promise<GuardianAlert[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ============================================
// EMAIL ACCOUNTS
// ============================================

export async function getLocalEmailAccounts(userId: string): Promise<EmailAccount[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EMAIL_ACCOUNTS);
    if (!data) return [];
    const accounts: EmailAccount[] = JSON.parse(data);
    return accounts.filter(a => a.user_id === userId);
  } catch {
    return [];
  }
}

export async function createLocalEmailAccount(account: Omit<EmailAccount, 'id' | 'created_at' | 'last_sync_at'>): Promise<EmailAccount> {
  const newAccount: EmailAccount = {
    ...account,
    id: generateUUID(),
    created_at: new Date().toISOString(),
    last_sync_at: null,
  };
  
  const accounts = await getAllLocalEmailAccounts();
  accounts.push(newAccount);
  await AsyncStorage.setItem(STORAGE_KEYS.EMAIL_ACCOUNTS, JSON.stringify(accounts));
  return newAccount;
}

export async function deleteLocalEmailAccount(accountId: string): Promise<void> {
  const accounts = await getAllLocalEmailAccounts();
  const filtered = accounts.filter(a => a.id !== accountId);
  await AsyncStorage.setItem(STORAGE_KEYS.EMAIL_ACCOUNTS, JSON.stringify(filtered));
}

async function getAllLocalEmailAccounts(): Promise<EmailAccount[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EMAIL_ACCOUNTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ============================================
// CLEAR ALL DATA
// ============================================

export async function clearAllLocalData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}
