/**
 * Theme definitions for FieldCam.
 *
 * Each theme provides light and dark color variants. The active variant is
 * resolved by combining the selected theme id with the chosen color mode.
 */

import { lighten, mix } from './colorUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Every color key a theme must provide. */
export interface ThemeColors {
  accent: string;
  accentLight: string;
  navy: string;
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  border: string;
  borderLight: string;
  orange: string;
  orangeLight: string;
  black: string;
  white: string;
}

export type ColorMode = 'light' | 'dark';

/** A theme group with light and dark variants. */
export interface ThemeGroup {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
  light: ThemeColors;
  dark: ThemeColors;
}

/** Resolved theme for use by components (matches the old ThemeDefinition shape). */
export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  isLight: boolean;
  colors: ThemeColors;
}

/** Serialisable data for a user-created custom theme. */
export interface CustomThemeData {
  id: string;
  name: string;
  accent: string;
  /** Optional secondary color used to tint backgrounds and surfaces. */
  secondary?: string;
}

// ---------------------------------------------------------------------------
// Minimal theme palettes
// ---------------------------------------------------------------------------

const minimalLight: ThemeColors = {
  accent: '#10a37f',
  accentLight: '#1ac99a',
  navy: '#202123',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#f7f7f8',
  bgCard: '#FFFFFF',
  bgElevated: '#f7f7f8',
  textPrimary: '#202123',
  textSecondary: '#6e6e80',
  textMuted: '#8e8ea0',
  success: '#10a37f',
  error: '#ef4146',
  warning: '#f5a623',
  info: '#10a37f',
  border: '#ececf1',
  borderLight: '#d9d9e3',
  orange: '#10a37f',
  orangeLight: '#1ac99a',
  black: '#000000',
  white: '#FFFFFF',
};

const minimalDark: ThemeColors = {
  accent: '#10a37f',
  accentLight: '#1ac99a',
  navy: '#e5e5e5',
  bgPrimary: '#0d0d0d',
  bgSecondary: '#171717',
  bgCard: '#1e1e1e',
  bgElevated: '#262626',
  textPrimary: '#ececf1',
  textSecondary: '#9a9aab',
  textMuted: '#6e6e80',
  success: '#10a37f',
  error: '#ef4146',
  warning: '#f5a623',
  info: '#10a37f',
  border: '#2e2e2e',
  borderLight: '#3e3e3e',
  orange: '#10a37f',
  orangeLight: '#1ac99a',
  black: '#000000',
  white: '#FFFFFF',
};

// ---------------------------------------------------------------------------
// Coral theme palettes
// ---------------------------------------------------------------------------

const coralLight: ThemeColors = {
  accent: '#FF7759',
  accentLight: '#FF9A85',
  navy: '#1a1a1a',
  bgPrimary: '#FFFAF8',
  bgSecondary: '#FFF3EF',
  bgCard: '#FFFFFF',
  bgElevated: '#FFF3EF',
  textPrimary: '#1a1a1a',
  textSecondary: '#6b6b6b',
  textMuted: '#9a9a9a',
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  border: '#f0e0da',
  borderLight: '#e8d0c8',
  orange: '#FF7759',
  orangeLight: '#FF9A85',
  black: '#000000',
  white: '#FFFFFF',
};

const coralDark: ThemeColors = {
  accent: '#FF7759',
  accentLight: '#FF9A85',
  navy: '#0a0a0a',
  bgPrimary: '#0a0a0a',
  bgSecondary: '#141414',
  bgCard: '#1a1a1a',
  bgElevated: '#242424',
  textPrimary: '#FFFFFF',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  border: '#262626',
  borderLight: '#3a3a3a',
  orange: '#FF7759',
  orangeLight: '#FF9A85',
  black: '#000000',
  white: '#FFFFFF',
};

// ---------------------------------------------------------------------------
// Custom theme builder
// ---------------------------------------------------------------------------

/**
 * Build a full `ThemeGroup` from user input (name + primary accent + optional
 * secondary color). When a secondary color is provided the background surfaces
 * are tinted with it, giving the theme a unique character. Without a secondary
 * the backgrounds stay neutral.
 */
export function buildCustomThemeGroup(data: CustomThemeData): ThemeGroup {
  const { id, name, accent, secondary } = data;
  const accentLight = lighten(accent, 0.25);

  // Light backgrounds — optionally tinted by secondary
  const lBgBase = '#FFFFFF';
  const lBgOff = '#f7f7f8';
  const lBgPrimary = secondary ? mix(lBgBase, secondary, 0.04) : lBgBase;
  const lBgSecondary = secondary ? mix(lBgOff, secondary, 0.07) : lBgOff;
  const lBgCard = secondary ? mix(lBgBase, secondary, 0.02) : lBgBase;
  const lBgElevated = secondary ? mix(lBgOff, secondary, 0.07) : lBgOff;
  const lBorder = secondary ? mix('#ececf1', secondary, 0.10) : '#ececf1';
  const lBorderLight = secondary ? mix('#d9d9e3', secondary, 0.10) : '#d9d9e3';

  const light: ThemeColors = {
    accent,
    accentLight,
    navy: '#202123',
    bgPrimary: lBgPrimary,
    bgSecondary: lBgSecondary,
    bgCard: lBgCard,
    bgElevated: lBgElevated,
    textPrimary: '#202123',
    textSecondary: '#6e6e80',
    textMuted: '#8e8ea0',
    success: '#10a37f',
    error: '#ef4146',
    warning: '#f5a623',
    info: '#3b82f6',
    border: lBorder,
    borderLight: lBorderLight,
    orange: accent,
    orangeLight: accentLight,
    black: '#000000',
    white: '#FFFFFF',
  };

  // Dark backgrounds — optionally tinted by secondary
  const dBgBase = '#0d0d0d';
  const dBgOff = '#171717';
  const dBgPrimary = secondary ? mix(dBgBase, secondary, 0.06) : dBgBase;
  const dBgSecondary = secondary ? mix(dBgOff, secondary, 0.07) : dBgOff;
  const dBgCard = secondary ? mix('#1e1e1e', secondary, 0.06) : '#1e1e1e';
  const dBgElevated = secondary ? mix('#262626', secondary, 0.07) : '#262626';
  const dBorder = secondary ? mix('#2e2e2e', secondary, 0.08) : '#2e2e2e';
  const dBorderLight = secondary ? mix('#3e3e3e', secondary, 0.08) : '#3e3e3e';

  const dark: ThemeColors = {
    accent,
    accentLight,
    navy: '#e5e5e5',
    bgPrimary: dBgPrimary,
    bgSecondary: dBgSecondary,
    bgCard: dBgCard,
    bgElevated: dBgElevated,
    textPrimary: '#ececf1',
    textSecondary: '#9a9aab',
    textMuted: '#6e6e80',
    success: '#4ade80',
    error: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
    border: dBorder,
    borderLight: dBorderLight,
    orange: accent,
    orangeLight: accentLight,
    black: '#000000',
    white: '#FFFFFF',
  };

  return { id, name, description: 'Custom theme', isCustom: true, light, dark };
}

// ---------------------------------------------------------------------------
// Built-in themes
// ---------------------------------------------------------------------------

/** Built-in theme groups keyed by id. */
export const BUILTIN_THEME_GROUPS: Record<string, ThemeGroup> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean theme with green accents',
    light: minimalLight,
    dark: minimalDark,
  },
  coral: {
    id: 'coral',
    name: 'Coral',
    description: 'Warm theme with coral highlights',
    light: coralLight,
    dark: coralDark,
  },
};

/** The theme id used when no persisted preference exists. */
export const DEFAULT_THEME_ID = 'minimal';

/** The color mode used when no persisted preference exists. */
export const DEFAULT_COLOR_MODE: ColorMode = 'light';

/**
 * Resolve a `ThemeColors` object for the given theme id and color mode.
 * Only looks at built-in themes — the context layer handles custom themes.
 */
export function getThemeColors(themeId: string, mode: ColorMode): ThemeColors {
  const group = BUILTIN_THEME_GROUPS[themeId] ?? BUILTIN_THEME_GROUPS[DEFAULT_THEME_ID];
  return group[mode];
}

/**
 * Build a resolved `ThemeDefinition` from a group + mode.
 */
export function resolveTheme(group: ThemeGroup, mode: ColorMode): ThemeDefinition {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    isLight: mode === 'light',
    colors: group[mode],
  };
}

// Legacy compat
export const THEME_GROUPS = BUILTIN_THEME_GROUPS;
export const THEMES: Record<string, ThemeDefinition> = Object.fromEntries(
  Object.values(BUILTIN_THEME_GROUPS).map((g) => [g.id, resolveTheme(g, 'light')]),
);
