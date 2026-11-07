import { DynamicColorIOS, Platform, useColorScheme, type ColorValue } from 'react-native';

/**
 * Semantic colors: warm paper grounds, warm near-black ink, one accent (blueprint blue).
 * The interface is almost entirely neutral; hue appears only for the accent and for state
 * (waiting, working, done, urgent). No violet, no gradients, no pure black.
 *
 * iOS uses DynamicColorIOS so light/dark switch natively without re-rendering; Android resolves
 * the same pairs through useColorScheme().
 *
 * Use `useColors()` in components. `Colors` is the iOS-dynamic / Android-light static snapshot
 * for places where hooks cannot be used (not reactive to dark mode on Android).
 */
export type SemanticColors = {
  label: ColorValue;
  secondaryLabel: ColorValue;
  systemBackground: ColorValue;
  secondarySystemBackground: ColorValue;
  systemGroupedBackground: ColorValue;
  secondarySystemGroupedBackground: ColorValue;
  /** The one accent: primary button, links, focus, selected state. */
  tint: ColorValue;
  /** Text and glyphs placed on a `tint` fill. */
  onTint: ColorValue;
  green: ColorValue;
  orange: ColorValue;
  red: ColorValue;
  teal: ColorValue;
  separator: ColorValue;
};

type Pair = { light: string; dark: string };

const palette: Record<keyof SemanticColors, Pair> = {
  label: { light: '#1D1B17', dark: '#EEEBE3' },
  secondaryLabel: { light: '#5F5A50', dark: '#A8A397' },
  systemBackground: { light: '#FBFAF7', dark: '#151412' },
  secondarySystemBackground: { light: '#F0EDE5', dark: '#24221E' },
  systemGroupedBackground: { light: '#F4F1EA', dark: '#151412' },
  secondarySystemGroupedBackground: { light: '#FDFCF9', dark: '#1E1D19' },
  tint: { light: '#2C5AA0', dark: '#8DB1E8' },
  onTint: { light: '#FFFFFF', dark: '#0F1623' },
  green: { light: '#3F7A3A', dark: '#9BC48A' },
  orange: { light: '#A8641A', dark: '#E2A455' },
  red: { light: '#B3372B', dark: '#EE8D80' },
  teal: { light: '#2B7A74', dark: '#77C0B8' },
  separator: { light: '#DDD8CC', dark: '#34312B' },
};

function build(pick: (pair: Pair) => ColorValue): SemanticColors {
  const out = {} as Record<keyof SemanticColors, ColorValue>;
  for (const key of Object.keys(palette) as (keyof SemanticColors)[]) out[key] = pick(palette[key]);
  return out as SemanticColors;
}

/** Plain hex strings for libraries that parse colors (React Navigation theme). */
export function hexColors(
  scheme: 'light' | 'dark' | null | undefined,
): Record<keyof SemanticColors, string> {
  const key = scheme === 'dark' ? 'dark' : 'light';
  const out = {} as Record<keyof SemanticColors, string>;
  for (const name of Object.keys(palette) as (keyof SemanticColors)[])
    out[name] = palette[name][key];
  return out;
}

const ios = build((p) => DynamicColorIOS({ light: p.light, dark: p.dark }));
const androidLight = build((p) => p.light);
const androidDark = build((p) => p.dark);

export function useColors(): SemanticColors {
  const scheme = useColorScheme();
  if (Platform.OS === 'ios') return ios;
  return scheme === 'dark' ? androidDark : androidLight;
}

export const Colors: SemanticColors = Platform.OS === 'ios' ? ios : androidLight;

export type TicketStatus = 'pending' | 'in_review' | 'in_progress' | 'resolved';

/** Status colors: grey waiting, accent reviewing, amber working, green done. Reactive version. */
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
