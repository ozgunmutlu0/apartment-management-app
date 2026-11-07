import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { useColors } from '@/theme/colors';

/**
 * Android: the native stack header, card and formSheet backgrounds come from the React Navigation
 * theme, which defaults to light. Feed it our semantic palette so dark mode follows the system.
 * iOS resolves everything through PlatformColor / system chrome, so it is left untouched.
 */
export function NavigationTheme({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const c = useColors();
  if (Platform.OS !== 'android') return <>{children}</>;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: c.tint as string,
      background: c.systemGroupedBackground as string,
      card: c.systemBackground as string,
      text: c.label as string,
      border: c.separator as string,
    },
  };
  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}
