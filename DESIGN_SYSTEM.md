# GryLin Design System - Premium Google Material Design 3

## Overview
GryLin follows Google's Material Design 3 principles, inspired by premium Google apps like Google Files, Gmail, and Google Pay. The design emphasizes clean layouts, generous spacing, subtle shadows, and professional typography.

## Key Design Principles

### 1. **Clean & Minimal**
- NO emojis in UI (icons only)
- Generous white space
- Clear visual hierarchy
- Subtle borders and dividers

### 2. **Typography**
- **Display**: 45px - Hero sections
- **XXL**: 32px - Page titles
- **XL**: 24px - Section headers
- **LG**: 20px - Card titles
- **MD**: 16px - Body text
- **SM**: 14px - Secondary text
- **XS**: 12px - Labels

Font weights:
- Regular (400) - Body text
- Medium (500) - Emphasis
- Semibold (600) - Headings
- Bold (700) - Display

### 3. **Spacing Scale**
- **XXS**: 2px - Micro adjustments
- **XS**: 4px - Tight spacing
- **SM**: 8px - Compact elements
- **MD**: 12px - Default spacing
- **LG**: 16px - Comfortable spacing
- **XL**: 20px - Section spacing
- **XXL**: 24px - Large gaps
- **XXXL**: 32px - Major sections
- **4XL**: 48px - Hero spacing
- **5XL**: 64px - Maximum spacing

### 4. **Color Palette**

#### Primary Colors
- **Blue**: #1A73E8 (Google Blue)
- **Blue Light**: #E8F0FE
- **Blue Container**: #D3E3FD

#### Semantic Colors
- **Red**: #EA4335 (Error/Danger)
- **Green**: #34A853 (Success)
- **Yellow**: #FBBC04 (Warning)
- **Orange**: #FF6D00 (Attention)
- **Purple**: #A142F4 (AI/Premium)

#### Surfaces
- **Background**: #FAFBFC (Off-white)
- **Surface**: #FFFFFF (Pure white)
- **Surface Variant**: #F5F5F5
- **Surface Container**: #F0F0F0

#### Text
- **Primary**: #202124 (Almost black)
- **Secondary**: #5F6368 (Medium gray)
- **Tertiary**: #80868B (Light gray)
- **Disabled**: #BDC1C6 (Very light gray)

#### Borders
- **Border**: #DADCE0
- **Border Light**: #E8EAED
- **Divider**: #E8EAED

### 5. **Border Radius**
- **XS**: 4px - Tight corners
- **SM**: 8px - Buttons
- **MD**: 12px - Cards (standard)
- **LG**: 16px - Large cards
- **XL**: 20px - Hero cards
- **Full**: 9999px - Pills/circles

### 6. **Shadows**
Subtle, realistic shadows following Material Design:

- **Card**: Minimal elevation (1dp)
- **Elevated**: Medium elevation (2-3dp)
- **FAB**: High elevation (6dp)
- **Button**: Colored shadow with primary color

### 7. **Component Patterns**

#### Cards
```
- Background: White
- Border: 1px solid #E8EAED
- Border Radius: 12px
- Padding: 20px
- Shadow: Card shadow
- Spacing between: 16px
```

#### Buttons
```
Primary:
- Background: #1A73E8
- Text: White
- Border Radius: 8px
- Padding: 16px 32px
- Shadow: Button shadow

Secondary:
- Background: #F5F5F5
- Text: #202124
- Border Radius: 8px
- Padding: 16px 32px
```

#### Icons
```
- Size: 20-24px (standard)
- Size: 48-56px (large containers)
- Container: 48-56px square
- Border Radius: 12px
- Background: Tinted color (15% opacity)
```

#### Headers
```
- Background: White
- Border Bottom: 1px solid divider
- Padding: 20px 24px
- Title: 32px Medium
- Subtitle: 14px Regular
```

### 8. **Layout Guidelines**

#### Screen Structure
```
1. Header (fixed)
   - Title + Actions
   - Border bottom
   
2. Content (scrollable)
   - Horizontal padding: 16px
   - Vertical spacing: 32px between sections
   
3. Bottom Navigation (fixed)
   - Height: 72px (Android) / 88px (iOS)
   - Border top
```

#### Card Layouts
```
- Horizontal padding: 20px
- Vertical padding: 20px
- Gap between elements: 12-16px
- Icon to content: 20px
```

### 9. **Animation**
- **Fast**: 150ms - Micro interactions
- **Normal**: 250ms - Standard transitions
- **Slow**: 350ms - Complex animations

### 10. **Accessibility**
- Minimum touch target: 48x48px
- Text contrast: WCAG AA compliant
- Focus indicators: Visible and clear
- Screen reader support: Proper labels

## Component Examples

### Home Screen
- Clean header with greeting
- Stats cards with icons (no emojis)
- Insights card with bullet points
- Document list with proper spacing

### Vault Screen
- Category grid with large icons
- File list with metadata
- Clean search bar
- Proper empty states

### Alerts Screen
- Grouped by urgency
- Clean alert cards
- Dismiss actions
- Status indicators

### Profile Screen
- Large avatar
- Stats row with dividers
- Grouped settings
- Clean sign-out button

## Best Practices

### DO ✓
- Use icons from lucide-react-native
- Follow spacing scale consistently
- Use semantic colors appropriately
- Add subtle borders to cards
- Maintain generous padding
- Use proper text hierarchy

### DON'T ✗
- Use emojis in UI
- Overcrowd elements
- Use bright, saturated colors
- Add heavy shadows
- Mix different border radius values
- Use inconsistent spacing

## Inspiration Sources
- **Google Files**: Clean file management, category cards
- **Gmail**: Email list, action buttons, search
- **Google Pay**: Transaction cards, stats, insights
- **Google Drive**: Grid/list views, empty states
- **Google Calendar**: Date formatting, event cards

## Implementation Notes
All design tokens are defined in `constants/theme.ts` and should be imported and used consistently across all components.
