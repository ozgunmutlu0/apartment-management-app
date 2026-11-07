import { Platform, PlatformColor, useColorScheme, type ColorValue } from 'react-native';

/**
 * Semantic colors. iOS uses dynamic system colors via PlatformColor (auto light/dark).
 * Android uses a fixed light/dark palette resolved through useColorScheme().
 *
 * Use `useColors()` in components. `Colors` is the iOS-dynamic / Android-light static
 * snapshot for places where hooks cannot be used (not reactive to dark mode on Android).
 */
export type SemanticColors = {
  label: ColorValue;
  secondaryLabel: ColorValue;
  systemBackground: ColorValue;
  secondarySystemBackground: ColorValue;
  systemGroupedBackground: ColorValue;
  secondarySystemGroupedBackground: ColorValue;
  tint: ColorValue;
  green: ColorValue;
  orange: ColorValue;
  red: ColorValue;
  indigo: ColorValue;
  purple: ColorValue;
  teal: ColorValue;
  separator: ColorValue;
};

const ios: SemanticColors = {
  label: PlatformColor('label'),
  secondaryLabel: PlatformColor('secondaryLabel'),
  systemBackground: PlatformColor('systemBackground'),
  secondarySystemBackground: PlatformColor('secondarySystemBackground'),
  systemGroupedBackground: PlatformColor('systemGroupedBackground'),
  secondarySystemGroupedBackground: PlatformColor('secondarySystemGroupedBackground'),
  tint: PlatformColor('systemBlue'),
  green: PlatformColor('systemGreen'),
  orange: PlatformColor('systemOrange'),
  red: PlatformColor('systemRed'),
  indigo: PlatformColor('systemIndigo'),
  purple: PlatformColor('systemPurple'),
  teal: PlatformColor('systemTeal'),
  separator: PlatformColor('separator'),
};

const androidLight: SemanticColors = {
  label: '#1B1B1F',
  secondaryLabel: '#5E5E66',
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tint: '#0A6CFF',
  green: '#1E8E3E',
  orange: '#E8710A',
  red: '#D93025',
  indigo: '#3F51B5',
  purple: '#8E24AA',
  teal: '#00897B',
  separator: '#D1D1D6',
};

const androidDark: SemanticColors = {
  label: '#E4E2E6',
  secondaryLabel: '#A9A9B2',
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  systemGroupedBackground: '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',
  tint: '#7CACFF',
  green: '#81C995',
  orange: '#FDA85A',
  red: '#F28B82',
  indigo: '#9FA8DA',
  purple: '#CE93D8',
  teal: '#4DB6AC',
  separator: '#38383A',
};

export function useColors(): SemanticColors {
  const scheme = useColorScheme();
  if (Platform.OS === 'ios') return ios;
  return scheme === 'dark' ? androidDark : androidLight;
}

export const Colors: SemanticColors = Platform.OS === 'ios' ? ios : androidLight;

export type TicketStatus = 'pending' | 'in_review' | 'in_progress' | 'resolved';

/** Status colors: grey waiting, blue reviewing, orange working, green done. Reactive version. */
export function useStatusColors(): Record<TicketStatus, ColorValue> {
  const c = useColors();
  return {
    pending: c.secondaryLabel,
    in_review: c.tint,
    in_progress: c.orange,
    resolved: c.green,
  };
}

/** Static version (see note on `Colors`). */
export const statusColors: Record<TicketStatus, ColorValue> = {
  pending: Colors.secondaryLabel,
  in_review: Colors.tint,
  in_progress: Colors.orange,
  resolved: Colors.green,
};
