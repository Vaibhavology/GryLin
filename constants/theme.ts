// GryLin Premium Design System
// Inspired by: Apple, Google Pay, Revolut, Wise - Ultra Premium, Clean, Sophisticated

export const Colors = {
  // Core
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Primary Brand - Deep Blue (Premium feel)
  primary: '#0066FF',
  primaryDark: '#0052CC',
  primaryLight: '#E6F0FF',
  primarySoft: '#F0F6FF',
  
  // Accent - Vibrant Gradient Colors
  accent: '#6366F1',
  accentLight: '#EEF2FF',
  
  // Premium Surfaces
  background: '#FAFBFC',
  backgroundDark: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  surfaceTertiary: '#F1F5F9',
  
  // Text Hierarchy - Sharp Contrast
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textMuted: '#CBD5E1',
  textInverse: '#FFFFFF',
  
  // Semantic - Refined
  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#059669',
  
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#D97706',
  
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#DC2626',
  
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoDark: '#2563EB',
  
  // Premium Accents
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  
  teal: '#14B8A6',
  tealLight: '#CCFBF1',
  
  orange: '#F97316',
  orangeLight: '#FFEDD5',
  
  pink: '#EC4899',
  pinkLight: '#FCE7F3',
  
  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
  divider: '#F1F5F9',
  
  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.1)',
  
  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#0066FF', '#0052CC'],
  gradientAccent: ['#6366F1', '#8B5CF6'],
  gradientSuccess: ['#10B981', '#059669'],
  gradientSunrise: ['#F59E0B', '#F97316'],
  gradientPremium: ['#0F172A', '#1E293B'],
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const Font = {
  // Sizes - Premium Typography Scale
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
  '7xl': 48,
  
  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  
  // Letter Spacing
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
};

export const Shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Animation
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: { damping: 15, stiffness: 150 },
};

// Category Colors - Premium Palette
export const categoryColors = {
  Finance: { 
    primary: '#0066FF', 
    light: '#E6F0FF', 
    gradient: ['#0066FF', '#0052CC'] 
  },
  Shopping: { 
    primary: '#F97316', 
    light: '#FFEDD5', 
    gradient: ['#F97316', '#EA580C'] 
  },
  Health: { 
    primary: '#10B981', 
    light: '#D1FAE5', 
    gradient: ['#10B981', '#059669'] 
  },
  Education: { 
    primary: '#8B5CF6', 
    light: '#EDE9FE', 
    gradient: ['#8B5CF6', '#7C3AED'] 
  },
  Career: { 
    primary: '#EC4899', 
    light: '#FCE7F3', 
    gradient: ['#EC4899', '#DB2777'] 
  },
  Other: { 
    primary: '#64748B', 
    light: '#F1F5F9', 
    gradient: ['#64748B', '#475569'] 
  },
};

// Status Colors
export const statusColors = {
  new: { bg: Colors.primaryLight, text: Colors.primary, border: '#CCE0FF' },
  paid: { bg: Colors.successLight, text: Colors.success, border: '#A7F3D0' },
  archived: { bg: Colors.surfaceTertiary, text: Colors.textTertiary, border: Colors.border },
};

// Legacy exports
export const colors = Colors;
export const spacing = Spacing;
export const borderRadius = Radius;
export const shadows = Shadow;
