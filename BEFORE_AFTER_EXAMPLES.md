# Before & After Code Examples

## Example 1: Alert Section Titles

### BEFORE ❌
```tsx
const renderSection = (title: string, sectionAlerts: GuardianAlert[], emoji: string) => {
  if (sectionAlerts.length === 0) return null;
  return (
    <View style={styles.alertSection}>
      <Text style={styles.sectionTitle}>{emoji} {title}</Text>  {/* 🔴 Emoji */}
      {sectionAlerts.map((alert) => renderAlertCard(alert))}
    </View>
  );
};

// Usage:
{renderSection('Overdue', groupedAlerts.overdue, '🔴')}
{renderSection('Today', groupedAlerts.today, '🟠')}
{renderSection('This Week', groupedAlerts.thisWeek, '🟡')}
```

### AFTER ✓
```tsx
const renderSection = (title: string, sectionAlerts: GuardianAlert[]) => {
  if (sectionAlerts.length === 0) return null;
  return (
    <View style={styles.alertSection}>
      <Text style={styles.sectionTitle}>{title}</Text>  {/* Clean text only */}
      {sectionAlerts.map((alert) => renderAlertCard(alert))}
    </View>
  );
};

// Usage:
{renderSection('Overdue', groupedAlerts.overdue)}
{renderSection('Today', groupedAlerts.today)}
{renderSection('This Week', groupedAlerts.thisWeek)}
```

**Why Better**: No emojis, cleaner code, professional appearance

---

## Example 2: Card Styling

### BEFORE ❌
```tsx
const styles = StyleSheet.create({
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,              // 16px - too tight
    borderRadius: Radius.xl,          // 20px - too round
    marginBottom: Spacing.md,         // 12px - too tight
    ...Shadow.sm,                     // Heavy shadow
    // No border
  },
  itemIcon: {
    width: 48,                        // Small
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

### AFTER ✓
```tsx
const styles = StyleSheet.create({
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.xl,              // 20px - comfortable
    borderRadius: Radius.card,        // 12px - Google standard
    marginBottom: Spacing.lg,         // 16px - better spacing
    ...Shadow.card,                   // Subtle shadow
    borderWidth: 1,                   // Added border
    borderColor: Colors.borderLight,  // Subtle border
  },
  itemIcon: {
    width: 56,                        // Larger
    height: 56,
    borderRadius: Radius.md,          // 12px
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

**Why Better**: Larger, cleaner, subtle border, better spacing

---

## Example 3: Typography

### BEFORE ❌
```tsx
const styles = StyleSheet.create({
  pageTitle: { 
    fontSize: Font.xxl,               // 22px - too small
    fontWeight: Font.semibold,        // 600 - too heavy
    color: Colors.textPrimary 
  },
  greeting: { 
    fontSize: Font.sm,                // 12px
    color: Colors.textTertiary,
    fontWeight: Font.medium,          // 500 - unnecessary
  },
  userName: { 
    fontSize: Font.xxl,               // 22px - too small
    fontWeight: Font.semibold,        // 600
    color: Colors.textPrimary,
    marginTop: 2,                     // Too tight
  },
});
```

### AFTER ✓
```tsx
const styles = StyleSheet.create({
  pageTitle: { 
    fontSize: Font.xxxl,              // 32px - Google scale
    fontWeight: Font.medium,          // 500 - lighter, cleaner
    color: Colors.textPrimary 
  },
  greeting: { 
    fontSize: Font.sm,                // 12px
    color: Colors.textTertiary,
    fontWeight: Font.regular,         // 400 - lighter
    letterSpacing: 0.2,               // Better readability
  },
  userName: { 
    fontSize: Font.xxxl,              // 32px - prominent
    fontWeight: Font.medium,          // 500 - Google style
    color: Colors.textPrimary,
    marginTop: Spacing.xs,            // 4px - proper spacing
  },
});
```

**Why Better**: Larger titles, lighter weights, better spacing, Google scale

---

## Example 4: Color Palette

### BEFORE ❌
```tsx
export const Colors = {
  background: '#F8FAFD',              // Too blue-tinted
  textPrimary: '#1F1F1F',             // Not Google standard
  red: '#D93025',                     // Not Google red
  green: '#1E8E3E',                   // Not Google green
  border: '#E0E0E0',                  // Generic gray
  surfaceTint: '#F0F4F9',             // Too blue
};
```

### AFTER ✓
```tsx
export const Colors = {
  background: '#FAFBFC',              // Google Files background
  textPrimary: '#202124',             // Google standard
  red: '#EA4335',                     // Google red
  green: '#34A853',                   // Google green
  border: '#DADCE0',                  // Google border
  surfaceVariant: '#F5F5F5',          // Neutral gray
};
```

**Why Better**: Matches Google's exact color palette

---

## Example 5: Spacing Scale

### BEFORE ❌
```tsx
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  '4xl': 40,                          // Inconsistent
  '5xl': 48,
};

// Usage:
paddingHorizontal: Spacing.xl,        // 20px
paddingVertical: Spacing.lg,          // 16px
marginBottom: Spacing.xl,             // 20px
```

### AFTER ✓
```tsx
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  '4xl': 48,                          // Consistent scale
  '5xl': 64,                          // Larger for hero sections
};

// Usage:
paddingHorizontal: Spacing.xxl,       // 24px - more generous
paddingVertical: Spacing.xl,          // 20px
marginBottom: Spacing.xxxl,           // 32px - better breathing room
```

**Why Better**: More generous, consistent scale, better hierarchy

---

## Example 6: Shadow System

### BEFORE ❌
```tsx
export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,              // Visible
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,              // Too dark
    shadowRadius: 6,
    elevation: 3,
  },
};
```

### AFTER ✓
```tsx
export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,              // Barely visible
    shadowRadius: 3,
    elevation: 1,                     // Minimal
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,              // Subtle
    shadowRadius: 4,
    elevation: 2,
  },
};
```

**Why Better**: Subtler, more realistic, Google-like

---

## Example 7: Button Design

### BEFORE ❌
```tsx
<TouchableOpacity 
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue,
    paddingVertical: Spacing.md,      // 12px - too small
    paddingHorizontal: Spacing.xl,    // 20px
    borderRadius: Radius.full,        // Pill shape
    gap: Spacing.sm,                  // 8px
  }}
>
  <Plus size={16} color={Colors.white} />  {/* Small icon */}
  <Text style={{
    fontSize: Font.md,                // 14px
    fontWeight: Font.semibold,        // 600
    color: Colors.white,
  }}>Scan Document</Text>
</TouchableOpacity>
```

### AFTER ✓
```tsx
<TouchableOpacity 
  style={{
    backgroundColor: Colors.blue,
    paddingVertical: Spacing.lg,      // 16px - better touch target
    paddingHorizontal: Spacing.xxxl,  // 32px - more prominent
    borderRadius: Radius.button,      // 8px - Google standard
    alignItems: 'center',
    ...Shadow.button,                 // Colored shadow
  }}
>
  <Text style={{
    fontSize: Font.lg,                // 16px - larger
    fontWeight: Font.medium,          // 500 - lighter
    color: Colors.white,
  }}>Scan Document</Text>
</TouchableOpacity>
```

**Why Better**: Larger, cleaner, no icon clutter, better shadow

---

## Example 8: Empty States

### BEFORE ❌
```tsx
<View style={styles.emptyState}>
  <View style={styles.emptyIcon}>
    <Bell size={40} color={Colors.green} />  {/* Small */}
  </View>
  <Text style={styles.emptyTitle}>All caught up!</Text>  {/* Emoji-like */}
  <Text style={styles.emptyText}>No upcoming payments</Text>
</View>

const styles = StyleSheet.create({
  emptyIcon: { 
    width: 88, 
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,         // 20px
  },
  emptyTitle: { 
    fontSize: Font.xl,                // 18px - too small
    fontWeight: Font.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
});
```

### AFTER ✓
```tsx
<View style={styles.emptyState}>
  <View style={styles.emptyIcon}>
    <Bell size={48} color={Colors.green} />  {/* Larger */}
  </View>
  <Text style={styles.emptyTitle}>All caught up</Text>  {/* Clean */}
  <Text style={styles.emptyText}>No upcoming payments or deadlines</Text>
</View>

const styles = StyleSheet.create({
  emptyIcon: { 
    width: 96,                        // Larger
    height: 96,
    borderRadius: Radius.full,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,        // 24px - more space
  },
  emptyTitle: { 
    fontSize: Font.xxl,               // 24px - prominent
    fontWeight: Font.medium,          // 500 - lighter
    color: Colors.textPrimary,
    marginBottom: Spacing.md,         // 12px
  },
});
```

**Why Better**: Larger icon, cleaner text, better spacing, no exclamation

---

## Example 9: Header Design

### BEFORE ❌
```tsx
<View style={styles.header}>
  <View style={styles.headerLeft}>
    <Text style={styles.greeting}>Good morning</Text>
    <Text style={styles.userName}>John Doe</Text>
  </View>
  <View style={styles.headerActions}>
    <TouchableOpacity style={styles.iconButton}>
      <Search size={22} color={Colors.textSecondary} />
    </TouchableOpacity>
  </View>
</View>

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,    // 20px
    paddingVertical: Spacing.lg,      // 16px
    backgroundColor: Colors.white,
    // No border
  },
  iconButton: {
    width: 44,                        // Small
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceTint,
  },
});
```

### AFTER ✓
```tsx
<View style={styles.header}>
  <View style={styles.headerLeft}>
    <Text style={styles.greeting}>Good morning</Text>
    <Text style={styles.userName}>John Doe</Text>
  </View>
  <View style={styles.headerActions}>
    <TouchableOpacity style={styles.iconButton}>
      <Search size={22} color={Colors.textSecondary} />
    </TouchableOpacity>
  </View>
</View>

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,   // 24px - more generous
    paddingVertical: Spacing.xl,      // 20px
    backgroundColor: Colors.white,
    borderBottomWidth: 1,             // Added border
    borderBottomColor: Colors.divider,
  },
  iconButton: {
    width: 48,                        // Larger touch target
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
  },
});
```

**Why Better**: More padding, border separator, larger touch targets

---

## Summary of Improvements

### Typography
- Larger titles (22px → 32px)
- Lighter weights (Semibold → Medium)
- Better line heights
- Proper letter spacing

### Spacing
- More generous padding (16px → 24px)
- Better gaps (12px → 32px)
- Comfortable breathing room

### Colors
- Google's exact palette
- Softer backgrounds
- Better contrast

### Shadows
- Subtler elevation
- Realistic depth
- Minimal opacity

### Components
- Larger touch targets (44px → 56px)
- Clean borders (1px)
- Better hierarchy
- No emojis

### Result
**Professional, premium, Google-quality mobile app UI**
