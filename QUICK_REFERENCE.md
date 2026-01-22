# Quick Reference Guide - GryLin Design System

## Import Design Tokens
```tsx
import { Colors, Spacing, Radius, Font, Shadow } from '../constants/theme';
```

---

## Common Patterns

### Card Component
```tsx
<View style={{
  backgroundColor: Colors.white,
  borderRadius: Radius.card,          // 12px
  padding: Spacing.xl,                // 20px
  marginBottom: Spacing.lg,           // 16px
  borderWidth: 1,
  borderColor: Colors.borderLight,
  ...Shadow.card,
}}>
  {/* Content */}
</View>
```

### Primary Button
```tsx
<TouchableOpacity style={{
  backgroundColor: Colors.blue,
  paddingVertical: Spacing.lg,        // 16px
  paddingHorizontal: Spacing.xxxl,    // 32px
  borderRadius: Radius.button,        // 8px
  alignItems: 'center',
  ...Shadow.button,
}}>
  <Text style={{
    fontSize: Font.lg,                // 16px
    fontWeight: Font.medium,          // 500
    color: Colors.white,
  }}>Button Text</Text>
</TouchableOpacity>
```

### Icon Container
```tsx
<View style={{
  width: 56,
  height: 56,
  borderRadius: Radius.md,            // 12px
  backgroundColor: `${Colors.blue}15`, // 15% opacity
  alignItems: 'center',
  justifyContent: 'center',
}}>
  <Icon size={24} color={Colors.blue} />
</View>
```

### Section Header
```tsx
<View style={{
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: Spacing.xl,           // 20px
}}>
  <Text style={{
    fontSize: Font.xl,                // 20px
    fontWeight: Font.medium,          // 500
    color: Colors.textPrimary,
  }}>Section Title</Text>
  <TouchableOpacity>
    <Text style={{
      fontSize: Font.md,              // 14px
      color: Colors.blue,
    }}>See all</Text>
  </TouchableOpacity>
</View>
```

### Page Header
```tsx
<View style={{
  paddingHorizontal: Spacing.xxl,     // 24px
  paddingVertical: Spacing.xl,        // 20px
  backgroundColor: Colors.white,
  borderBottomWidth: 1,
  borderBottomColor: Colors.divider,
}}>
  <Text style={{
    fontSize: Font.xxxl,              // 32px
    fontWeight: Font.medium,          // 500
    color: Colors.textPrimary,
  }}>Page Title</Text>
  <Text style={{
    fontSize: Font.md,                // 14px
    color: Colors.textTertiary,
    marginTop: Spacing.xs,            // 4px
  }}>Subtitle</Text>
</View>
```

### Empty State
```tsx
<View style={{
  alignItems: 'center',
  paddingVertical: Spacing['5xl'],    // 64px
  paddingHorizontal: Spacing.xxxl,    // 32px
}}>
  <View style={{
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,        // 24px
  }}>
    <Icon size={48} color={Colors.blue} />
  </View>
  <Text style={{
    fontSize: Font.xxl,               // 24px
    fontWeight: Font.medium,          // 500
    color: Colors.textPrimary,
    marginBottom: Spacing.md,         // 12px
  }}>Empty State Title</Text>
  <Text style={{
    fontSize: Font.md,                // 14px
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  }}>Description text goes here</Text>
</View>
```

### List Item
```tsx
<Pressable style={({ pressed }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: pressed ? Colors.surfaceTint : Colors.white,
  padding: Spacing.xl,                // 20px
  borderRadius: Radius.card,          // 12px
  marginBottom: Spacing.lg,           // 16px
  borderWidth: 1,
  borderColor: Colors.borderLight,
  ...Shadow.card,
})}>
  {/* Icon */}
  <View style={{
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: `${Colors.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Icon size={24} color={Colors.blue} />
  </View>
  
  {/* Content */}
  <View style={{ flex: 1, marginLeft: Spacing.xl }}>
    <Text style={{
      fontSize: Font.lg,              // 16px
      fontWeight: Font.medium,        // 500
      color: Colors.textPrimary,
    }}>Title</Text>
    <Text style={{
      fontSize: Font.md,              // 14px
      color: Colors.textSecondary,
      marginTop: Spacing.xs,          // 4px
    }}>Subtitle</Text>
  </View>
  
  {/* Chevron */}
  <ChevronRight size={20} color={Colors.textDisabled} />
</Pressable>
```

### Badge
```tsx
<View style={{
  backgroundColor: Colors.red,
  paddingHorizontal: Spacing.md,      // 12px
  paddingVertical: Spacing.sm,        // 8px
  borderRadius: Radius.full,
  minWidth: 24,
  alignItems: 'center',
}}>
  <Text style={{
    fontSize: Font.sm,                // 12px
    fontWeight: Font.semibold,        // 600
    color: Colors.white,
  }}>5</Text>
</View>
```

### Chip/Tag
```tsx
<View style={{
  paddingHorizontal: Spacing.lg,      // 16px
  paddingVertical: Spacing.md,        // 12px
  borderRadius: Radius.button,        // 8px
  backgroundColor: Colors.primaryContainer,
}}>
  <Text style={{
    fontSize: Font.md,                // 14px
    fontWeight: Font.medium,          // 500
    color: Colors.blue,
  }}>Chip Text</Text>
</View>
```

### Floating Action Button (FAB)
```tsx
<TouchableOpacity style={{
  width: 56,
  height: 56,
  borderRadius: Radius.full,
  backgroundColor: Colors.blue,
  alignItems: 'center',
  justifyContent: 'center',
  ...Shadow.fab,
}}>
  <Plus size={24} color={Colors.white} />
</TouchableOpacity>
```

---

## Color Usage Guide

### Backgrounds
```tsx
backgroundColor: Colors.background    // Page background
backgroundColor: Colors.white         // Cards, surfaces
backgroundColor: Colors.surfaceVariant // Subtle backgrounds
```

### Text
```tsx
color: Colors.textPrimary            // Main text
color: Colors.textSecondary          // Supporting text
color: Colors.textTertiary           // Subtle text
color: Colors.textDisabled           // Disabled text
```

### Semantic Colors
```tsx
// Success
backgroundColor: Colors.greenLight
color: Colors.green

// Error/Danger
backgroundColor: Colors.redLight
color: Colors.red

// Warning
backgroundColor: Colors.yellowLight
color: Colors.yellow

// Info
backgroundColor: Colors.blueLight
color: Colors.blue
```

### Borders
```tsx
borderColor: Colors.border           // Standard borders
borderColor: Colors.borderLight      // Subtle borders
borderColor: Colors.divider          // Dividers
```

---

## Spacing Guide

### Padding
```tsx
padding: Spacing.xl                  // 20px - Cards
padding: Spacing.xxl                 // 24px - Headers
padding: Spacing.xxxl                // 32px - Large sections
```

### Margins
```tsx
marginBottom: Spacing.lg             // 16px - Between cards
marginBottom: Spacing.xl             // 20px - Between sections
marginBottom: Spacing.xxxl           // 32px - Major sections
```

### Gaps
```tsx
gap: Spacing.md                      // 12px - Tight elements
gap: Spacing.lg                      // 16px - Standard gap
gap: Spacing.xl                      // 20px - Comfortable gap
```

---

## Typography Guide

### Headings
```tsx
// Page Title
fontSize: Font.xxxl                  // 32px
fontWeight: Font.medium              // 500

// Section Title
fontSize: Font.xl                    // 20px
fontWeight: Font.medium              // 500

// Card Title
fontSize: Font.lg                    // 16px
fontWeight: Font.medium              // 500
```

### Body Text
```tsx
// Primary
fontSize: Font.md                    // 14px
fontWeight: Font.regular             // 400

// Secondary
fontSize: Font.md                    // 14px
color: Colors.textSecondary
```

### Labels
```tsx
fontSize: Font.sm                    // 12px
fontWeight: Font.medium              // 500
color: Colors.textTertiary
letterSpacing: 0.5
```

---

## Shadow Guide

```tsx
...Shadow.card                       // Minimal (cards)
...Shadow.elevated                   // Medium (modals)
...Shadow.fab                        // High (FAB)
...Shadow.button                     // Colored (buttons)
```

---

## Border Radius Guide

```tsx
borderRadius: Radius.button          // 8px - Buttons
borderRadius: Radius.card            // 12px - Cards
borderRadius: Radius.md              // 12px - Icons
borderRadius: Radius.lg              // 16px - Large cards
borderRadius: Radius.full            // 9999px - Circles
```

---

## Icon Sizes

```tsx
size={20}                            // Small icons
size={24}                            // Standard icons
size={28}                            // Large icons
size={48}                            // Empty state icons
```

---

## Touch Targets

Minimum touch target: **48x48px**

```tsx
width: 48,
height: 48,
```

For larger targets:
```tsx
width: 56,
height: 56,
```

---

## Common Mistakes to Avoid

### ❌ DON'T
```tsx
// Using emojis
<Text>🔴 Overdue</Text>

// Inconsistent spacing
padding: 15,  // Use Spacing scale

// Heavy shadows
shadowOpacity: 0.3,

// No borders on cards
// Missing borderWidth

// Small touch targets
width: 32, height: 32,

// Wrong font weights
fontWeight: Font.bold  // Too heavy
```

### ✓ DO
```tsx
// Use icons
<AlertTriangle size={20} color={Colors.red} />

// Use spacing scale
padding: Spacing.xl,

// Subtle shadows
...Shadow.card,

// Add borders
borderWidth: 1,
borderColor: Colors.borderLight,

// Proper touch targets
width: 48, height: 48,

// Lighter weights
fontWeight: Font.medium
```

---

## Quick Checklist

When creating a new component:

- [ ] Use design tokens from `constants/theme.ts`
- [ ] No emojis, use icons instead
- [ ] Add subtle borders to cards (1px)
- [ ] Use proper spacing scale
- [ ] Minimum 48x48px touch targets
- [ ] Subtle shadows (card/elevated)
- [ ] Proper text hierarchy
- [ ] Consistent border radius
- [ ] Semantic colors
- [ ] Pressed states for touchables

---

## Resources

- Design System: `DESIGN_SYSTEM.md`
- Improvements: `UI_IMPROVEMENTS.md`
- Examples: `BEFORE_AFTER_EXAMPLES.md`
- Theme: `constants/theme.ts`
