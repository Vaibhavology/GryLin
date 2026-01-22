import { create } from 'zustand';
import { Item, ItemCategory, VaultFolder, DocumentAnalysis, GuardianAlertType } from '../types';
import {
  getItems,
  getItemsPaginated,
  getUpcomingItems,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  getItemsByFolder,
  uploadImage,
  supabase,
  PaginatedResult,
  PaginationOptions,
} from '../lib/supabase';
import { analyzeDocument, analyzeDocumentText } from '../lib/ai';
import { extractTextFromImage, OCRResult } from '../lib/ocr';
import { getUserFriendlyMessage } from '../lib/errorHandler';
import { isTestUser } from './authStore';
import {
  getLocalItems,
  createLocalItem,
  updateLocalItem,
  deleteLocalItem,
  getLocalFolders,
  createLocalFolder,
  updateLocalFolder,
  deleteLocalFolder,
  createLocalAlert,
} from '../lib/localStorage';

// Result type for the enhanced scan flow
export interface ScanResult {
  analysis: DocumentAnalysis;
  imageUrl: string;
  autoAssignedFolderId: string | null;
  autoAssignedFolderName: string | null;
  alertCreated: boolean;
  alertType: GuardianAlertType | null;
}

interface ItemsState {
  items: Item[];
  upcomingItems: Item[];
  folders: VaultFolder[];
  selectedItem: Item | null;
  selectedFolder: VaultFolder | null;
  isLoading: boolean;
  isScanning: boolean;
  scanProgress: string;
  error: string | null;
  // Pagination state
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface ItemsActions {
  // Fetch actions
  fetchItems: (userId: string, category?: ItemCategory | 'All') => Promise<void>;
  fetchItemsPaginated: (
    userId: string,
    category?: ItemCategory | 'All',
    options?: PaginationOptions
  ) => Promise<void>;
  loadMoreItems: (userId: string, category?: ItemCategory | 'All') => Promise<void>;
  fetchUpcomingItems: (userId: string, daysAhead?: number) => Promise<void>;
  fetchFolders: (userId: string) => Promise<void>;
  fetchFolderItems: (folderId: string) => Promise<Item[]>;
  
  // Item CRUD
  addItem: (item: Omit<Item, 'id' | 'created_at'>) => Promise<Item>;
  editItem: (itemId: string, updates: Partial<Item>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  markAsPaid: (itemId: string) => Promise<void>;
  archiveItem: (itemId: string) => Promise<void>;
  
  // Folder CRUD
  addFolder: (name: string, userId: string) => Promise<VaultFolder>;
  renameFolder: (folderId: string, name: string) => Promise<void>;
  removeFolder: (folderId: string) => Promise<void>;
  
  // Scan & AI (Enhanced)
  scanDocument: (
    imageUri: string,
    userId: string
  ) => Promise<ScanResult>;
  
  // Auto-assignment helpers
  findMatchingFolder: (category: ItemCategory, folders: VaultFolder[]) => VaultFolder | null;
  determineFolderName: (title: string, category: ItemCategory) => string;
  createAlertForItem: (item: Item, userId: string) => Promise<{ created: boolean; alertType: GuardianAlertType | null }>;
  
  // Selection
  selectItem: (item: Item | null) => void;
  selectFolder: (folder: VaultFolder | null) => void;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

type ItemsStore = ItemsState & ItemsActions;

const initialState: ItemsState = {
  items: [],
  upcomingItems: [],
  folders: [],
  selectedItem: null,
  selectedFolder: null,
  isLoading: false,
  isScanning: false,
  scanProgress: '',
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  },
};

export const useItemsStore = create<ItemsStore>((set, get) => ({
  ...initialState,

  // ============================================
  // FETCH ACTIONS
  // ============================================

  fetchItems: async (userId: string, category?: ItemCategory | 'All') => {
    set({ isLoading: true, error: null });
    try {
      // Use local storage for test user, Supabase for real users
      let items: Item[];
      if (isTestUser(userId)) {
        items = await getLocalItems(userId);
        if (category && category !== 'All') {
          items = items.filter(item => item.category === category);
        }
      } else {
        items = await getItems(userId, category);
      }
      set({ 
        items, 
        isLoading: false,
        pagination: {
          page: 1,
          pageSize: items.length,
          totalCount: items.length,
          totalPages: 1,
          hasMore: false,
        },
      });
    } catch (error) {
      const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchItemsPaginated: async (
    userId: string,
    category?: ItemCategory | 'All',
    options?: PaginationOptions
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getItemsPaginated(userId, category, options);
      set({
        items: result.data,
        isLoading: false,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  loadMoreItems: async (userId: string, category?: ItemCategory | 'All') => {
    const { pagination, items } = get();
    if (!pagination.hasMore || get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const result = await getItemsPaginated(userId, category, {
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
      });
      set({
        items: [...items, ...result.data],
        isLoading: false,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchUpcomingItems: async (userId: string, daysAhead = 7) => {
    try {
      let upcomingItems: Item[];
      if (isTestUser(userId)) {
        const allItems = await getLocalItems(userId);
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + daysAhead);
        
        upcomingItems = allItems.filter(item => {
          if (!item.due_date) return false;
          const dueDate = new Date(item.due_date);
          return dueDate >= now && dueDate <= futureDate;
        }).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
      } else {
        upcomingItems = await getUpcomingItems(userId, daysAhead);
      }
      set({ upcomingItems });
    } catch (error: any) {
      // Silently handle UUID errors - these occur when user is not properly authenticated
      if (!error?.message?.includes('uuid') && !error?.code?.includes('22P02')) {
        console.error('Failed to fetch upcoming items:', error);
      }
    }
  },

  fetchFolders: async (userId: string) => {
    console.log('[itemsStore] fetchFolders called:', { userId, isTest: isTestUser(userId) });
    try {
      let folders: VaultFolder[];
      if (isTestUser(userId)) {
        console.log('[itemsStore] Fetching folders from local storage');
        folders = await getLocalFolders(userId);
      } else {
        console.log('[itemsStore] Fetching folders from Supabase');
        folders = await getFolders(userId);
      }
      console.log('[itemsStore] Folders fetched:', folders.length);
      set({ folders });
    } catch (error: any) {
      console.error('[itemsStore] Failed to fetch folders:', error);
      // Silently handle UUID errors
      if (!error?.message?.includes('uuid') && !error?.code?.includes('22P02')) {
        console.error('Failed to fetch folders:', error);
      }
    }
  },

  fetchFolderItems: async (folderId: string) => {
    try {
      return await getItemsByFolder(folderId);
    } catch (error) {
      console.error('Failed to fetch folder items:', error);
      return [];
    }
  },

  // ============================================
  // ITEM CRUD
  // ============================================

  addItem: async (item) => {
    set({ isLoading: true, error: null });
    try {
      let newItem: Item;
      if (isTestUser(item.user_id)) {
        newItem = await createLocalItem(item);
      } else {
        newItem = await createItem(item);
      }
      set((state) => ({
        items: [newItem, ...state.items],
        isLoading: false,
      }));
      return newItem;
    } catch (error) {
      const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  editItem: async (itemId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { items } = get();
      const existingItem = items.find(i => i.id === itemId);
      let updatedItem: Item;
      
      if (existingItem && isTestUser(existingItem.user_id)) {
        updatedItem = await updateLocalItem(itemId, updates);
      } else {
        updatedItem = await updateItem(itemId, updates);
      }
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? updatedItem : item
        ),
        selectedItem: state.selectedItem?.id === itemId ? updatedItem : state.selectedItem,
        isLoading: false,
      }));
    } catch (error) {
      const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  removeItem: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      const { items } = get();
      const existingItem = items.find(i => i.id === itemId);
      
      if (existingItem && isTestUser(existingItem.user_id)) {
        await deleteLocalItem(itemId);
      } else {
        await deleteItem(itemId);
      }
      set((state) => ({
        items: state.items.filter((item) => item.id !== itemId),
        selectedItem: state.selectedItem?.id === itemId ? null : state.selectedItem,
        isLoading: false,
      }));
    } catch (error) {
      const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  markAsPaid: async (itemId) => {
    try {
      const { items } = get();
      const existingItem = items.find(i => i.id === itemId);
      
      if (existingItem && isTestUser(existingItem.user_id)) {
        await updateLocalItem(itemId, { status: 'paid' });
      } else {
        await updateItemStatus(itemId, 'paid');
      }
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, status: 'paid' as const } : item
        ),
        upcomingItems: state.upcomingItems.filter((item) => item.id !== itemId),
      }));
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      throw error;
    }
  },

  archiveItem: async (itemId) => {
    try {
      const { items } = get();
      const existingItem = items.find(i => i.id === itemId);
      
      if (existingItem && isTestUser(existingItem.user_id)) {
        await updateLocalItem(itemId, { status: 'archived' });
      } else {
        await updateItemStatus(itemId, 'archived');
      }
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, status: 'archived' as const } : item
        ),
      }));
    } catch (error) {
      console.error('Failed to archive item:', error);
      throw error;
    }
  },

  // ============================================
  // FOLDER CRUD
  // ============================================

  addFolder: async (name, userId) => {
    console.log('[itemsStore] addFolder called:', { name, userId, isTest: isTestUser(userId) });
    try {
      let newFolder: VaultFolder;
      if (isTestUser(userId)) {
        console.log('[itemsStore] Using local storage for folder');
        newFolder = await createLocalFolder(name, userId);
      } else {
        console.log('[itemsStore] Using Supabase for folder');
        newFolder = await createFolder(name, userId);
      }
      console.log('[itemsStore] Folder created:', newFolder);
      set((state) => ({
        folders: [...state.folders, newFolder],
      }));
      return newFolder;
    } catch (error) {
      console.error('[itemsStore] Failed to create folder:', error);
      throw error;
    }
  },

  renameFolder: async (folderId, name) => {
    try {
      const { folders } = get();
      const folder = folders.find(f => f.id === folderId);
      
      let updatedFolder: VaultFolder;
      if (folder && isTestUser(folder.user_id)) {
        updatedFolder = await updateLocalFolder(folderId, name);
      } else {
        updatedFolder = await updateFolder(folderId, name);
      }
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === folderId ? updatedFolder : f
        ),
        selectedFolder: state.selectedFolder?.id === folderId ? updatedFolder : state.selectedFolder,
      }));
    } catch (error) {
      console.error('Failed to rename folder:', error);
      throw error;
    }
  },

  removeFolder: async (folderId) => {
    try {
      const { folders } = get();
      const folder = folders.find(f => f.id === folderId);
      
      if (folder && isTestUser(folder.user_id)) {
        await deleteLocalFolder(folderId);
      } else {
        await deleteFolder(folderId);
      }
      set((state) => ({
        folders: state.folders.filter((folder) => folder.id !== folderId),
        selectedFolder: state.selectedFolder?.id === folderId ? null : state.selectedFolder,
      }));
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  },

  // ============================================
  // AUTO-ASSIGNMENT HELPERS
  // ============================================

  // Determine folder name from document title
  determineFolderName: (title: string, category: ItemCategory) => {
    // Extract document type from title (e.g., "Driving Licence - John Doe" → "Driving Licence")
    const titleLower = title.toLowerCase();
    
    // Document type mappings to folder names
    const documentFolderMap: Record<string, string> = {
      'driving licence': 'Driving Licence',
      'driving license': 'Driving Licence',
      'learner\'s licence': 'Driving Licence',
      'pan card': 'PAN Card',
      'permanent account': 'PAN Card',
      'aadhaar': 'Aadhaar Card',
      'aadhar': 'Aadhaar Card',
      'passport': 'Passport',
      'voter id': 'Voter ID',
      'election': 'Voter ID',
      'vehicle rc': 'Vehicle RC',
      'registration certificate': 'Vehicle RC',
      'credit card': 'Credit Cards',
      'debit card': 'Bank Cards',
      'bank statement': 'Bank Statements',
      'electricity bill': 'Utility Bills',
      'water bill': 'Utility Bills',
      'gas bill': 'Utility Bills',
      'phone bill': 'Utility Bills',
      'mobile bill': 'Utility Bills',
      'internet bill': 'Utility Bills',
      'insurance': 'Insurance',
      'policy': 'Insurance',
      'medical': 'Medical Records',
      'hospital': 'Medical Records',
      'prescription': 'Medical Records',
      'invoice': 'Invoices & Receipts',
      'receipt': 'Invoices & Receipts',
      'certificate': 'Certificates',
      'marksheet': 'Education',
      'degree': 'Education',
      'salary slip': 'Salary & Income',
      'payslip': 'Salary & Income',
      'tax': 'Tax Documents',
      'itr': 'Tax Documents',
      'form 16': 'Tax Documents',
    };
    
    // Check for document type matches
    for (const [keyword, folderName] of Object.entries(documentFolderMap)) {
      if (titleLower.includes(keyword)) {
        return folderName;
      }
    }
    
    // Fallback to category-based folder
    const categoryFolderMap: Record<ItemCategory, string> = {
      Finance: 'Finance Documents',
      Health: 'Medical Records',
      Shopping: 'Shopping & Orders',
      Education: 'Education',
      Career: 'Career & Work',
      Other: 'Other Documents',
    };
    
    return categoryFolderMap[category] || 'Other Documents';
  },

  // Find a folder that matches the document category
  findMatchingFolder: (category: ItemCategory, folders: VaultFolder[]) => {
    // Category to folder name mapping (case-insensitive matching)
    const categoryFolderMap: Record<ItemCategory, string[]> = {
      Finance: ['finance', 'financial', 'bills', 'payments', 'banking', 'money', 'credit', 'debit', 'bank'],
      Health: ['health', 'medical', 'healthcare', 'hospital', 'doctor', 'medicine', 'prescription'],
      Shopping: ['shopping', 'purchases', 'orders', 'receipts', 'amazon', 'flipkart', 'retail'],
      Education: ['education', 'school', 'college', 'university', 'course', 'learning', 'academic'],
      Career: ['career', 'work', 'job', 'employment', 'salary', 'office', 'professional'],
      Other: ['other', 'misc', 'miscellaneous', 'general'],
    };

    const searchTerms = categoryFolderMap[category] || [];
    
    // Find folder whose name contains any of the search terms
    for (const folder of folders) {
      const folderNameLower = folder.name.toLowerCase();
      for (const term of searchTerms) {
        if (folderNameLower.includes(term)) {
          return folder;
        }
      }
    }
    
    // Also check if folder name exactly matches category
    const exactMatch = folders.find(f => f.name.toLowerCase() === category.toLowerCase());
    if (exactMatch) return exactMatch;
    
    return null;
  },

  // Create alert for an item if it has a due date
  createAlertForItem: async (item: Item, userId: string) => {
    if (!item.due_date) {
      return { created: false, alertType: null };
    }

    try {
      const dueDate = new Date(item.due_date);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let alertType: GuardianAlertType;
      
      if (daysUntilDue < 0) {
        alertType = 'overdue';
      } else if (daysUntilDue <= 1) {
        alertType = 'deadline_1day';
      } else if (daysUntilDue <= 7) {
        alertType = 'deadline_7day';
      } else {
        // Due date is more than 7 days away, create 7-day reminder
        alertType = 'deadline_7day';
      }

      const alertData = {
        user_id: userId,
        item_id: item.id,
        alert_type: alertType,
        trigger_date: dueDate.toISOString(),
        is_dismissed: false,
        is_sent: false,
      };

      if (isTestUser(userId)) {
        await createLocalAlert(alertData);
      } else {
        // Import and use Supabase function
        const { createGuardianAlert } = await import('../lib/supabase');
        await createGuardianAlert(alertData);
      }

      console.log('[itemsStore] Auto-created alert:', alertType, 'for item:', item.title);
      return { created: true, alertType };
    } catch (error) {
      console.error('[itemsStore] Failed to create auto-alert:', error);
      return { created: false, alertType: null };
    }
  },

  // ============================================
  // SCAN & AI (ML Kit OCR + Groq Text Analysis)
  // ============================================

  scanDocument: async (imageUri, userId) => {
    set({ isScanning: true, scanProgress: 'Extracting text...', error: null });
    
    try {
      let analysis: DocumentAnalysis;
      let { folders } = get();
      
      console.log('[itemsStore] ========================================');
      console.log('[itemsStore] Starting document scan...');
      console.log('[itemsStore] Image URI:', imageUri);
      
      // Step 1: Extract ALL text using ML Kit OCR
      console.log('[itemsStore] Step 1: ML Kit OCR...');
      let ocrResult: OCRResult | null = null;
      
      try {
        ocrResult = await extractTextFromImage(imageUri);
        console.log('[itemsStore] OCR SUCCESS - Text extracted');
        console.log('[itemsStore] Text length:', ocrResult.fullText.length);
        console.log('[itemsStore] Lines:', ocrResult.lines.length);
      } catch (ocrError: any) {
        console.error('[itemsStore] ML Kit OCR FAILED:', ocrError?.message);
      }
      
      // Step 2: Send ALL text to Groq AI for analysis
      set({ scanProgress: 'AI analyzing...' });
      console.log('[itemsStore] Step 2: Groq AI Analysis...');
      
      if (ocrResult && ocrResult.fullText.length > 10) {
        // Send full OCR text to AI - let AI figure out everything
        console.log('[itemsStore] Sending full OCR text to Groq AI...');
        analysis = await analyzeDocumentText(ocrResult.fullText);
      } else {
        // Fallback: Try vision API or use mock
        console.log('[itemsStore] OCR failed/empty, trying vision API...');
        
        let useVisionAPI = false;
        let publicImageUrl = '';
        
        try {
          const response = await fetch(imageUri);
          if (response.ok) {
            const blob = await response.blob();
            
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            
            const formData = new FormData();
            formData.append('source', base64);
            formData.append('type', 'base64');
            formData.append('action', 'upload');
            
            const uploadResponse = await fetch('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5', {
              method: 'POST',
              body: formData,
            });
            
            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              if (uploadData.status_code === 200 && uploadData.image?.url) {
                publicImageUrl = uploadData.image.url;
                useVisionAPI = true;
              }
            }
          }
        } catch (e: any) {
          console.warn('[itemsStore] Image upload failed:', e?.message);
        }
        
        if (useVisionAPI && publicImageUrl) {
          analysis = await analyzeDocument(publicImageUrl, false);
        } else {
          analysis = await analyzeDocument(imageUri, true);
        }
      }

      // Step 3: Auto-create/find folder based on document type
      set({ scanProgress: 'Organizing...' });
      console.log('[itemsStore] Step 3: Auto-folder assignment...');
      
      // Determine folder name from document title (e.g., "Driving Licence - Name" → "Driving Licence")
      const folderName = get().determineFolderName(analysis.title, analysis.category);
      console.log('[itemsStore] Determined folder name:', folderName);
      
      // Find existing folder or create new one
      let targetFolder = folders.find(f => f.name.toLowerCase() === folderName.toLowerCase());
      
      if (!targetFolder && folderName) {
        console.log('[itemsStore] Creating new folder:', folderName);
        try {
          targetFolder = await get().addFolder(folderName, userId);
          // Refresh folders list
          folders = get().folders;
        } catch (e) {
          console.warn('[itemsStore] Failed to create folder:', e);
        }
      }
      
      console.log('[itemsStore] ========== SCAN COMPLETE ==========');
      console.log('[itemsStore] Title:', analysis.title);
      console.log('[itemsStore] Category:', analysis.category);
      console.log('[itemsStore] Amount:', analysis.amount);
      console.log('[itemsStore] Due Date:', analysis.due_date);
      console.log('[itemsStore] Auto-Folder:', targetFolder?.name || 'None');
      console.log('[itemsStore] =====================================');
      
      set({ isScanning: false, scanProgress: '' });
      
      return { 
        analysis, 
        imageUrl: imageUri,
        autoAssignedFolderId: targetFolder?.id || null,
        autoAssignedFolderName: targetFolder?.name || null,
        alertCreated: false,
        alertType: null,
      };
    } catch (error) {
      console.error('[itemsStore] SCAN ERROR:', error);
      const message = getUserFriendlyMessage(error instanceof Error ? error : String(error));
      set({ isScanning: false, scanProgress: '', error: message });
      throw error;
    }
  },

  // ============================================
  // SELECTION
  // ============================================

  selectItem: (item) => {
    set({ selectedItem: item });
  },

  selectFolder: (folder) => {
    set({ selectedFolder: folder });
  },

  // ============================================
  // UTILITY
  // ============================================

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
