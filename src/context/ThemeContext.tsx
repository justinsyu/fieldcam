import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BUILTIN_THEME_GROUPS,
  DEFAULT_THEME_ID,
  DEFAULT_COLOR_MODE,
  buildCustomThemeGroup,
  resolveTheme,
  type ThemeColors,
  type ThemeDefinition,
  type ThemeGroup,
  type ColorMode,
  type CustomThemeData,
} from '../theme/themes';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const THEME_STORAGE_KEY = 'fieldcam_theme';
const MODE_STORAGE_KEY = 'fieldcam_color_mode';
const CUSTOM_THEMES_KEY = 'fieldcam_custom_themes';

// ---------------------------------------------------------------------------
// Context value type
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  /** Resolved colors for the active theme + mode. */
  colors: ThemeColors;
  /** The active theme id. */
  themeId: string;
  /** The active color mode ('light' or 'dark'). */
  colorMode: ColorMode;
  /** Switch to a different theme. Persists the choice. */
  setThemeId: (id: string) => void;
  /** Switch color mode. Persists the choice. */
  setColorMode: (mode: ColorMode) => void;
  /** Full resolved definition of the active theme. */
  theme: ThemeDefinition;
  /** All available theme groups (built-in + custom). */
  allThemeGroups: ThemeGroup[];
  /** Save (create or update) a custom theme. */
  saveCustomTheme: (data: CustomThemeData) => void;
  /** Delete a custom theme by id. Falls back to default if it was active. */
  deleteCustomTheme: (id: string) => void;
  /** Get the CustomThemeData for an existing custom theme (for editing). */
  getCustomThemeData: (id: string) => CustomThemeData | undefined;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(DEFAULT_THEME_ID);
  const [colorMode, setColorModeState] = useState<ColorMode>(DEFAULT_COLOR_MODE);
  const [customThemeDataList, setCustomThemeDataList] = useState<CustomThemeData[]>([]);

  // Derived map of custom ThemeGroups built from serialised data.
  const customThemeGroups = useMemo<Record<string, ThemeGroup>>(
    () =>
      Object.fromEntries(
        customThemeDataList.map((d) => [d.id, buildCustomThemeGroup(d)]),
      ),
    [customThemeDataList],
  );

  // Merged lookup: built-in + custom.
  const allThemesMap = useMemo<Record<string, ThemeGroup>>(
    () => ({ ...BUILTIN_THEME_GROUPS, ...customThemeGroups }),
    [customThemeGroups],
  );

  // Load persisted preferences on mount.
  useEffect(() => {
    (async () => {
      try {
        const [storedTheme, storedMode, storedCustom] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(MODE_STORAGE_KEY),
          AsyncStorage.getItem(CUSTOM_THEMES_KEY),
        ]);

        // Restore custom themes first so the active themeId can resolve against them.
        if (storedCustom) {
          try {
            const parsed: CustomThemeData[] = JSON.parse(storedCustom);
            if (Array.isArray(parsed)) setCustomThemeDataList(parsed);
          } catch { /* ignore corrupt data */ }
        }

        if (storedTheme) {
          // We'll validate against allThemesMap after custom themes are loaded.
          setThemeIdState(storedTheme);
        }
        if (storedMode === 'light' || storedMode === 'dark') {
          setColorModeState(storedMode);
        }
      } catch {
        // Silently fall back to defaults.
      }
    })();
  }, []);

  // Persist custom theme data whenever it changes (skip initial mount).
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    AsyncStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemeDataList)).catch(() => {});
  }, [customThemeDataList]);

  const setThemeId = useCallback(
    (id: string) => {
      const resolvedId = allThemesMap[id] ? id : DEFAULT_THEME_ID;
      setThemeIdState(resolvedId);
      AsyncStorage.setItem(THEME_STORAGE_KEY, resolvedId).catch(() => {});
    },
    [allThemesMap],
  );

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    AsyncStorage.setItem(MODE_STORAGE_KEY, mode).catch(() => {});
  }, []);

  const saveCustomTheme = useCallback((data: CustomThemeData) => {
    setCustomThemeDataList((prev) => {
      const filtered = prev.filter((d) => d.id !== data.id);
      return [...filtered, data];
    });
  }, []);

  const deleteCustomTheme = useCallback(
    (id: string) => {
      setCustomThemeDataList((prev) => prev.filter((d) => d.id !== id));
      // If the deleted theme was active, fall back to default.
      setThemeIdState((prev) => (prev === id ? DEFAULT_THEME_ID : prev));
      AsyncStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID).catch(() => {});
    },
    [],
  );

  const getCustomThemeData = useCallback(
    (id: string): CustomThemeData | undefined =>
      customThemeDataList.find((d) => d.id === id),
    [customThemeDataList],
  );

  // Resolve colors from merged map.
  const activeGroup = allThemesMap[themeId] ?? allThemesMap[DEFAULT_THEME_ID];
  const colors = useMemo(() => activeGroup[colorMode], [activeGroup, colorMode]);
  const theme = useMemo(() => resolveTheme(activeGroup, colorMode), [activeGroup, colorMode]);
  const allThemeGroups = useMemo(
    () => [
      ...Object.values(BUILTIN_THEME_GROUPS),
      ...customThemeDataList.map((d) => buildCustomThemeGroup(d)),
    ],
    [customThemeDataList],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      themeId,
      colorMode,
      setThemeId,
      setColorMode,
      theme,
      allThemeGroups,
      saveCustomTheme,
      deleteCustomTheme,
      getCustomThemeData,
    }),
    [
      colors, themeId, colorMode, setThemeId, setColorMode,
      theme, allThemeGroups, saveCustomTheme, deleteCustomTheme, getCustomThemeData,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}
