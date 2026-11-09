import { DynamicColorIOS, Platform, useColorScheme, type ColorValue } from 'react-native';

/**
 * Semantic colors, "teal on paper": cool-neutral paper grounds, deep teal ink/accent (#06525C, a
 * light teal in dark mode), "soft layered": raised white cards (`secondarySystemGroupedBackground`)
 * on a tinted ground (`systemGroupedBackground`), soft tinted fills (`*Soft`) behind same-hue text
 * and glyphs. The interface is almost entirely neutral; hue appears only for the accent and for
 * state (waiting, reviewing, working, done, urgent). No violet, no gradients, no pure black. In dark
 * mode elevation is a lighter surface, not a shadow.
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
  /** Hero surface fill (deep teal in both schemes) and content on it. */
  hero: ColorValue;
  onHero: ColorValue;
  green: ColorValue;
  orange: ColorValue;
  red: ColorValue;
  /** State only ("in review"); deliberately distinct from the teal accent. */
  blue: ColorValue;
  separator: ColorValue;
  /** Chevrons, placeholders, disabled glyphs. Decorative; below text contrast. */
  tertiaryLabel: ColorValue;
  /** Soft fills, used behind text/glyphs of the same hue (all pairs reach 4.5:1). */
  tintSoft: ColorValue;
  greenSoft: ColorValue;
  orangeSoft: ColorValue;
  redSoft: ColorValue;
  blueSoft: ColorValue;
};

type Pair = { light: string; dark: string };

const palette: Record<keyof SemanticColors, Pair> = {
  label: { light: '#0F1E1D', dark: '#E8F0EE' },
  secondaryLabel: { light: '#51625E', dark: '#9BAEA9' },
  tertiaryLabel: { light: '#8A9A96', dark: '#6B7D79' },
  systemBackground: { light: '#FFFFFF', dark: '#0C1413' },
  secondarySystemBackground: { light: '#E9EFED', dark: '#1D2927' },
  systemGroupedBackground: { light: '#F1F5F4', dark: '#0C1413' },
  secondarySystemGroupedBackground: { light: '#FFFFFF', dark: '#151F1D' },
  tint: { light: '#06525C', dark: '#7FC4CC' },
  onTint: { light: '#FFFFFF', dark: '#06252A' },
  hero: { light: '#06525C', dark: '#0F3D44' },
  onHero: { light: '#FFFFFF', dark: '#E8F0EE' },
  green: { light: '#2A6D37', dark: '#8FCB9B' },
  orange: { light: '#94561A', dark: '#E2A455' },
  red: { light: '#B3372B', dark: '#EE8D80' },
  blue: { light: '#2F5F9E', dark: '#8FB4E6' },
  separator: { light: '#D3DDDA', dark: '#2A3835' },
  tintSoft: { light: '#DCECEC', dark: '#12393E' },
  greenSoft: { light: '#DFEEE1', dark: '#1A3322' },
  orangeSoft: { light: '#F6E9D6', dark: '#3A2A14' },
  redSoft: { light: '#F7DEDA', dark: '#401F1B' },
  blueSoft: { light: '#DEE8F5', dark: '#1B2C45' },
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

// DynamicColorIOS throws off iOS, so it is only evaluated there.
const ios = (
  Platform.OS === 'ios'
    ? build((p) => DynamicColorIOS({ light: p.light, dark: p.dark }))
    : build((p) => p.light)
) as SemanticColors;
const androidLight = build((p) => p.light);
const androidDark = build((p) => p.dark);

export function useColors(): SemanticColors {
  const scheme = useColorScheme();
  if (Platform.OS === 'ios') return ios;
  return scheme === 'dark' ? androidDark : androidLight;
}

export const Colors: SemanticColors = Platform.OS === 'ios' ? ios : androidLight;

export type TicketStatus = 'pending' | 'in_review' | 'in_progress' | 'resolved';

/** Status colors: grey waiting, blue reviewing, amber working, green done. Reactive version. */
export function useStatusColors(): Record<TicketStatus, ColorValue> {
  const c = useColors();
  return {
    pending: c.secondaryLabel,
    in_review: c.blue,
    in_progress: c.orange,
    resolved: c.green,
  };
}

/** Soft fill per status, to sit behind the matching `useStatusColors()` text/glyph. */
export function useStatusSoftColors(): Record<TicketStatus, ColorValue> {
  const c = useColors();
  return {
    pending: c.secondarySystemBackground,
    in_review: c.blueSoft,
    in_progress: c.orangeSoft,
    resolved: c.greenSoft,
  };
}

/** Static version (see note on `Colors`). */
export const statusColors: Record<TicketStatus, ColorValue> = {
  pending: Colors.secondaryLabel,
  in_review: Colors.blue,
  in_progress: Colors.orange,
  resolved: Colors.green,
};
