import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { hexColors } from '@/theme/colors';

/**
 * The native stack header, card and formSheet backgrounds come from the React Navigation theme,
 * which defaults to the stock iOS blue / light palette. Feed it our palette (as plain hex, the
 * navigation library parses colors) on every platform so accent, ground and dark mode stay one
 * system.
 */
export function NavigationTheme({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const c = hexColors(scheme);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: c.tint,
      background: c.systemGroupedBackground,
      card: c.systemBackground,
      text: c.label,
      border: c.separator,
    },
  };
  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}
