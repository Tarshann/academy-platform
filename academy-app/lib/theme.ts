/**
 * Academy App Design System — Theme Tokens
 *
 * Centralized color, spacing, radius, shadow, and typography tokens.
 * All screens import from here instead of declaring local constants.
 */

// ── Colors ──────────────────────────────────────────────────────────────
export const colors = {
  // Backgrounds
  background: '#0d0d1a',
  card: '#1a1a2e',
  cardElevated: '#242445',
  surface: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.10)',

  // Brand
  gold: '#CFB87C',
  goldLight: '#E8D5A3',
  goldDark: '#A88B5C',
  goldMuted: 'rgba(207,184,124,0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',

  // Semantic
  success: '#2ECC71',
  successDark: '#27ae60',
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498db',

  // Social platforms
  instagram: '#E4405F',
  tiktok: '#000000',
  twitter: '#1DA1F2',
  facebook: '#1877F2',
  youtube: '#FF0000',

  // Legacy aliases (for gradual migration)
  navy: '#1a1a2e',

  // Skeleton
  skeletonBase: 'rgba(255,255,255,0.06)',
  skeletonHighlight: 'rgba(255,255,255,0.12)',

  // Tab bar
  tabInactive: '#6B6B80',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ── Spacing ─────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

// ── Border Radii ────────────────────────────────────────────────────────
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 28,
  full: 9999,
} as const;

// ── Shadows ─────────────────────────────────────────────────────────────
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

// ── Font Families ───────────────────────────────────────────────────────
export const fonts = {
  display: 'BebasNeue',
  body: undefined, // system font
} as const;

// ── Typography Scale ────────────────────────────────────────────────────
export const typography = {
  display: {
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.textPrimary,
  },
  displaySmall: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.textPrimary,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.textPrimary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.gold,
  },
} as const;
