import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { themes } from './themes';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';
import { createShadowTokens } from './tokens';

export type ThemeKey = 'light' | 'dark' | 'amoled' | 'midnight';

const isWeb = Platform.OS === 'web';
const THEME_FILE = isWeb ? '' : (FileSystem as any).documentDirectory + 'theme.txt';

async function loadTheme(): Promise<ThemeKey> {
  if (isWeb) {
    try {
      const saved = localStorage.getItem('motocar_theme');
      if (saved && ['light', 'dark', 'amoled', 'midnight'].includes(saved)) {
        return saved as ThemeKey;
      }
    } catch {}
    return 'light';
  }
  try {
    const info = await FileSystem.getInfoAsync(THEME_FILE);
    if (info.exists) {
      const content = await FileSystem.readAsStringAsync(THEME_FILE);
      const key = content.trim() as ThemeKey;
      if (['light', 'dark', 'amoled', 'midnight'].includes(key)) return key;
    }
  } catch {}
  return 'light';
}

function saveTheme(key: ThemeKey) {
  if (isWeb) {
    try {
      localStorage.setItem('motocar_theme', key);
    } catch {}
    return;
  }
  try {
    FileSystem.writeAsStringAsync(THEME_FILE, key);
  } catch {}
}

interface ThemeContextType {
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  colors: typeof themes.light;
  themeKeys: ThemeKey[];
}

export const ThemeContext = createContext<ThemeContextType>({
  themeKey: 'light',
  setTheme: () => {},
  colors: themes.light,
  themeKeys: ['light', 'dark', 'amoled', 'midnight'],
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('light');

  useEffect(() => {
    loadTheme().then(setThemeKey);
  }, []);

  const setTheme = (key: ThemeKey) => {
    setThemeKey(key);
    saveTheme(key);
  };

  const colors = useMemo(() => themes[themeKey] || themes.light, [themeKey]);

  const value = useMemo(() => ({
    themeKey,
    setTheme,
    colors,
    themeKeys: ['light', 'dark', 'amoled', 'midnight'] as ThemeKey[],
  }), [themeKey, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  const { colors } = useTheme();
  return colors;
}

export function useThemeTypography() {
  return typography;
}

export function useThemeSpacing() {
  return spacing;
}

export function useThemeBorderRadius() {
  return borderRadius;
}

export function useThemeShadows() {
  const { colors } = useTheme();
  return useMemo(() => createShadowTokens(colors), [colors]);
}
