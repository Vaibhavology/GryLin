import { create } from 'zustand';
import { LifeStack, Item } from '../types';
import {
  getLifeStacks,
  createLifeStack,
  updateLifeStack as updateLifeStackDb,
  deleteLifeStack as deleteLifeStackDb,
  getItemsByLifeStack,
  updateItem,
} from '../lib/supabase';
import { isTestUser } from './authStore';
import {
  getLocalLifeStacks,
  createLocalLifeStack,
  updateLocalLifeStack,
  deleteLocalLifeStack,
  getLocalItems,
  updateLocalItem,
} from '../lib/localStorage';

interface LifeStackState {
  stacks: LifeStack[];
  isLoading: boolean;
  error: string | null;
}

interface LifeStackActions {
  fetchStacks: (userId: string) => Promise<void>;
  createStack: (
    userId: string,
    name: string,
    icon: string,
    color: string,
    keywords: string[]
  ) => Promise<LifeStack>;
  updateStack: (stackId: string, updates: Partial<LifeStack>) => Promise<void>;
  deleteStack: (stackId: string) => Promise<void>;
  assignItemToStack: (itemId: string, stackId: string) => Promise<void>;
  getStackItems: (stackId: string) => Promise<Item[]>;
  autoRouteItem: (item: Item) => Promise<string | null>;
  clearError: () => void;
}

type LifeStackStore = LifeStackState & LifeStackActions;

export const useLifeStackStore = create<LifeStackStore>((set, get) => ({
  // Initial state
  stacks: [],
  isLoading: false,
  error: null,

  // Fetch all life stacks for a user
  fetchStacks: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      let stacks: LifeStack[];
      if (isTestUser(userId)) {
        stacks = await getLocalLifeStacks(userId);
      } else {
        stacks = await getLifeStacks(userId);
      }
      set({ stacks, isLoading: false });
    } catch (error: any) {
      // Silently handle UUID errors
      if (!error?.message?.includes('uuid') && !error?.code?.includes('22P02')) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch life stacks',
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  // Create a new life stack
  createStack: async (
    userId: string,
    name: string,
    icon: string,
    color: string,
    keywords: string[]
  ) => {
    set({ isLoading: true, error: null });
    try {
      let newStack: LifeStack;
      if (isTestUser(userId)) {
        newStack = await createLocalLifeStack({
          user_id: userId,
          name,
          icon,
          color,
          keywords,
        });
      } else {
        newStack = await createLifeStack({
          user_id: userId,
          name,
          icon,
          color,
          keywords,
        });
      }
      set((state) => ({
        stacks: [...state.stacks, newStack],
        isLoading: false,
      }));
      return newStack;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create life stack',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update an existing life stack
  updateStack: async (stackId: string, updates: Partial<LifeStack>) => {
    set({ isLoading: true, error: null });
    try {
      const { stacks } = get();
      const stack = stacks.find(s => s.id === stackId);
      
      if (stack && isTestUser(stack.user_id)) {
        await updateLocalLifeStack(stackId, updates);
      } else {
        await updateLifeStackDb(stackId, updates);
      }
      set((state) => ({
        stacks: state.stacks.map((s) =>
          s.id === stackId ? { ...s, ...updates } : s
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update life stack',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete a life stack
  deleteStack: async (stackId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { stacks } = get();
      const stack = stacks.find(s => s.id === stackId);
      
      if (stack && isTestUser(stack.user_id)) {
        await deleteLocalLifeStack(stackId);
      } else {
        await deleteLifeStackDb(stackId);
      }
      set((state) => ({
        stacks: state.stacks.filter((s) => s.id !== stackId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete life stack',
        isLoading: false,
      });
      throw error;
    }
  },

  // Assign an item to a life stack
  assignItemToStack: async (itemId: string, stackId: string) => {
    try {
      // For test user, we need to check the item's user_id
      // This is a simplified version - in production you'd want to pass userId
      await updateItem(itemId, { life_stack_id: stackId });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to assign item to stack',
      });
      throw error;
    }
  },

  // Get all items in a life stack
  getStackItems: async (stackId: string) => {
    try {
      const { stacks } = get();
      const stack = stacks.find(s => s.id === stackId);
      
      if (stack && isTestUser(stack.user_id)) {
        const allItems = await getLocalItems(stack.user_id);
        return allItems.filter(item => item.life_stack_id === stackId);
      }
      return await getItemsByLifeStack(stackId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch stack items',
      });
      return [];
    }
  },

  // Auto-route an item to a matching life stack based on keywords
  autoRouteItem: async (item: Item) => {
    const { stacks } = get();
    const itemText = `${item.title} ${item.category}`.toLowerCase();

    for (const stack of stacks) {
      const hasMatch = stack.keywords.some((keyword) =>
        itemText.includes(keyword.toLowerCase())
      );

      if (hasMatch) {
        try {
          await updateItem(item.id, { life_stack_id: stack.id });
          return stack.id;
        } catch {
          // Continue to next stack if assignment fails
        }
      }
    }

    return null; // No matching stack found
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));
