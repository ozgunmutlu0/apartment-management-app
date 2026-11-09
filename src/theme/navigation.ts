import type { NativeStackNavigationOptions } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';

import { hexColors } from '@/theme/colors';
import { fonts } from '@/theme/tokens';

/**
 * Shared native-stack options so every tab group's header looks the same.
 *
 * - iOS: untouched native behavior (large titles, transparent iOS 26 headers, search bars); only the
 *   title font family and tint are themed.
 * - Android: header blends with the screen (ground color, no shadow), left-aligned Outfit title,
 *   tint on the back arrow and header buttons, status bar icons matching the scheme.
 *
 * Usage:
 *   const { screenOptions, sheetOptions } = useStackOptions();
 *   <Stack screenOptions={screenOptions}>
 *     <Stack.Screen name="new" options={{ title, ...sheetOptions([0.6, 1]) }} />
 *   </Stack>
 */
export function useStackOptions(): {
  screenOptions: NativeStackNavigationOptions;
  /** Options for a `formSheet` screen, with card background and the given detents. */
  sheetOptions: (detents: number[]) => NativeStackNavigationOptions;
} {
  const scheme = useColorScheme();
  const c = hexColors(scheme);
  const statusBarStyle = scheme === 'dark' ? 'light' : 'dark';

  const screenOptions: NativeStackNavigationOptions =
    Platform.OS === 'ios'
      ? {
          headerLargeTitleEnabled: true,
          headerLargeTitleShadowVisible: false,
          headerTintColor: c.tint,
          headerTitleStyle: { fontFamily: fonts.semibold },
          headerLargeTitleStyle: { fontFamily: fonts.semibold },
        }
      : {
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.systemGroupedBackground },
          headerTintColor: c.tint,
          headerTitleAlign: 'left',
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 22, color: c.label },
          contentStyle: { backgroundColor: c.systemGroupedBackground },
          statusBarStyle,
          statusBarBackgroundColor: c.systemGroupedBackground,
          navigationBarColor: c.systemGroupedBackground,
        };

  const sheetOptions = (detents: number[]): NativeStackNavigationOptions => ({
    presentation: 'formSheet',
    headerLargeTitleEnabled: false,
    sheetAllowedDetents: detents,
    sheetGrabberVisible: true,
    sheetCornerRadius: 28,
    ...(Platform.OS === 'android'
      ? {
          headerStyle: { backgroundColor: c.secondarySystemGroupedBackground },
          contentStyle: { backgroundColor: c.secondarySystemGroupedBackground },
        }
      : null),
  });

  return { screenOptions, sheetOptions };
}
