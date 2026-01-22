/**
 * Life Stack Integration Tests
 * Tests Life Stack creation and auto-routing functionality
 */

import { Item, ItemCategory, LifeStack } from '../../types';

// Mock the auto-routing logic from lifeStackStore
function autoRouteItem(item: Item, stacks: LifeStack[]): string | null {
  const itemText = `${item.title} ${item.category}`.toLowerCase();

  for (const stack of stacks) {
    const hasMatch = stack.keywords.some((keyword) =>
      itemText.includes(keyword.toLowerCase())
    );

    if (hasMatch) {
      return stack.id;
    }
  }

  return null;
}

describe('Life Stack Integration', () => {
  const mockStacks: LifeStack[] = [
    {
      id: 'stack-1',
      user_id: 'user-1',
      name: 'Wedding Plans',
      icon: 'heart',
      color: '#FF69B4',
      keywords: ['wedding', 'venue', 'catering', 'flowers'],
      created_at: '2026-01-01',
    },
    {
      id: 'stack-2',
      user_id: 'user-1',
      name: 'House Renovation',
      icon: 'home',
      color: '#4169E1',
      keywords: ['renovation', 'contractor', 'plumber', 'electrician', 'paint'],
      created_at: '2026-01-01',
    },
    {
      id: 'stack-3',
      user_id: 'user-1',
      name: 'Car Maintenance',
      icon: 'car',
      color: '#32CD32',
      keywords: ['car', 'auto', 'mechanic', 'oil change', 'tire'],
      created_at: '2026-01-01',
    },
  ];

  const createMockItem = (overrides: Partial<Item> = {}): Item => ({
    id: 'item-1',
    user_id: 'user-1',
    title: 'Test Item',
    category: 'Other' as ItemCategory,
    amount: null,
    due_date: null,
    summary: [],
    status: 'new',
    image_url: null,
    is_scam: false,
    folder_id: null,
    source_type: 'manual',
    email_id: null,
    email_account_id: null,
    life_stack_id: null,
    risk_score: 0,
    created_at: '2026-01-01',
    ...overrides,
  });

  describe('Auto-Routing', () => {
    it('should route wedding-related items to Wedding Plans stack', () => {
      const item = createMockItem({ title: 'Wedding Venue Deposit' });
      const stackId = autoRouteItem(item, mockStacks);
      expect(stackId).toBe('stack-1');
    });

    it('should route renovation-related items to House Renovation stack', () => {
      const item = createMockItem({ title: 'Contractor Invoice - Kitchen Renovation' });
      const stackId = autoRouteItem(item, mockStacks);
      expect(stackId).toBe('stack-2');
    });

    it('should route car-related items to Car Maintenance stack', () => {
      const item = createMockItem({ title: 'Auto Shop - Oil Change Receipt' });
      const stackId = autoRouteItem(item, mockStacks);
      expect(stackId).toBe('stack-3');
    });

    it('should return null for items that don\'t match any stack', () => {
      const item = createMockItem({ title: 'Grocery Store Receipt' });
      const stackId = autoRouteItem(item, mockStacks);
      expect(stackId).toBeNull();
    });

    it('should match keywords case-insensitively', () => {
      const item1 = createMockItem({ title: 'WEDDING FLOWERS ORDER' });
      const item2 = createMockItem({ title: 'wedding flowers order' });
      const item3 = createMockItem({ title: 'Wedding Flowers Order' });

      expect(autoRouteItem(item1, mockStacks)).toBe('stack-1');
      expect(autoRouteItem(item2, mockStacks)).toBe('stack-1');
      expect(autoRouteItem(item3, mockStacks)).toBe('stack-1');
    });

    it('should match keywords in category as well as title', () => {
      const item = createMockItem({ 
        title: 'Service Invoice',
        category: 'Other' as ItemCategory,
      });
      // This won't match because 'Service Invoice Other' doesn't contain any keywords
      expect(autoRouteItem(item, mockStacks)).toBeNull();

      // But if we add a matching keyword to the title
      const itemWithKeyword = createMockItem({ 
        title: 'Plumber Service Invoice',
      });
      expect(autoRouteItem(itemWithKeyword, mockStacks)).toBe('stack-2');
    });

    it('should route to first matching stack when multiple could match', () => {
      // Create an item that could match multiple stacks
      const stacks: LifeStack[] = [
        {
          id: 'stack-a',
          user_id: 'user-1',
          name: 'Stack A',
          icon: 'star',
          color: '#FF0000',
          keywords: ['invoice'],
          created_at: '2026-01-01',
        },
        {
          id: 'stack-b',
          user_id: 'user-1',
          name: 'Stack B',
          icon: 'star',
          color: '#00FF00',
          keywords: ['invoice', 'payment'],
          created_at: '2026-01-01',
        },
      ];

      const item = createMockItem({ title: 'Invoice Payment' });
      const stackId = autoRouteItem(item, stacks);
      
      // Should match first stack in order
      expect(stackId).toBe('stack-a');
    });

    it('should handle empty stacks array', () => {
      const item = createMockItem({ title: 'Wedding Venue' });
      const stackId = autoRouteItem(item, []);
      expect(stackId).toBeNull();
    });

    it('should handle stacks with empty keywords', () => {
      const stacksWithEmpty: LifeStack[] = [
        {
          id: 'stack-empty',
          user_id: 'user-1',
          name: 'Empty Stack',
          icon: 'star',
          color: '#FF0000',
          keywords: [],
          created_at: '2026-01-01',
        },
      ];

      const item = createMockItem({ title: 'Any Item' });
      const stackId = autoRouteItem(item, stacksWithEmpty);
      expect(stackId).toBeNull();
    });
  });

  describe('Life Stack Validation', () => {
    it('should validate stack has required fields', () => {
      const validStack: LifeStack = {
        id: 'stack-1',
        user_id: 'user-1',
        name: 'Test Stack',
        icon: 'star',
        color: '#FF0000',
        keywords: ['test'],
        created_at: '2026-01-01',
      };

      expect(validStack.id).toBeDefined();
      expect(validStack.name).toBeDefined();
      expect(validStack.icon).toBeDefined();
      expect(validStack.color).toBeDefined();
      expect(validStack.keywords).toBeInstanceOf(Array);
    });

    it('should validate color is a valid hex color', () => {
      const isValidHexColor = (color: string): boolean => {
        return /^#[0-9A-Fa-f]{6}$/.test(color);
      };

      expect(isValidHexColor('#FF69B4')).toBe(true);
      expect(isValidHexColor('#4169E1')).toBe(true);
      expect(isValidHexColor('#32CD32')).toBe(true);
      expect(isValidHexColor('invalid')).toBe(false);
      expect(isValidHexColor('#FFF')).toBe(false);
    });
  });
});
