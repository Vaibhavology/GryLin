import { Item, ItemCategory } from '../types';

/**
 * Validates email format
 * @param email - The email string to validate
 * @returns true if email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return false;
  }
  
  // Basic email regex: must have @ with characters before and after, and a domain with a dot
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Validates password meets minimum requirements
 * @param password - The password string to validate
 * @returns true if password is valid, false otherwise
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  // Check if password is composed entirely of whitespace
  if (password.trim().length === 0) {
    return false;
  }
  
  // Password must be at least 4 characters
  return password.length >= 4;
}

/**
 * Checks if an item is overdue based on its due_date
 * @param dueDate - The due date string (ISO format) or null
 * @returns true if the item is overdue, false otherwise
 */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) {
    return false;
  }
  
  const due = new Date(dueDate);
  const now = new Date();
  
  // Set both dates to start of day for accurate comparison
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  return due < now;
}

/**
 * Calculates the number of days until an item is due
 * @param dueDate - The due date string (ISO format) or null
 * @returns Number of days until due (negative if overdue), or null if no due date
 */
export function getDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) {
    return null;
  }
  
  const due = new Date(dueDate);
  const now = new Date();
  
  // Set both dates to start of day for accurate day calculation
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}


/**
 * Filters items by category
 * @param items - Array of items to filter
 * @param category - Category to filter by, or 'All' for no filtering
 * @returns Filtered array of items
 */
export function filterByCategory(items: Item[], category: ItemCategory | 'All'): Item[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  
  if (category === 'All') {
    return items;
  }
  
  return items.filter(item => item.category === category);
}

/**
 * Filters items by search query (matches title or category)
 * @param items - Array of items to filter
 * @param query - Search query string
 * @returns Filtered array of items matching the query
 */
export function filterBySearch(items: Item[], query: string): Item[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return items;
  }
  
  const lowerQuery = query.toLowerCase();
  
  return items.filter(item => 
    item.title.toLowerCase().includes(lowerQuery) ||
    item.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sorts items by due date in ascending order (nearest dates first, nulls last)
 * @param items - Array of items to sort
 * @returns New sorted array of items
 */
export function sortByDueDate(items: Item[]): Item[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  
  return [...items].sort((a, b) => {
    // Nulls go last
    if (a.due_date === null && b.due_date === null) {
      return 0;
    }
    if (a.due_date === null) {
      return 1;
    }
    if (b.due_date === null) {
      return -1;
    }
    
    // Sort by date ascending (nearest first)
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
}
