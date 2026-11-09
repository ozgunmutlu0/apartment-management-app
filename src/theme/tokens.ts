/**
 * Layout and type tokens. One spacing scale, one radius family, one hairline, one type scale:
 * screens use these instead of inventing numbers.
 */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Soft family (pair with `borderCurve: 'continuous'`): cards 20, controls/buttons/fields 14, icon tiles 12, pills full. */
export const radius = { card: 20, control: 14, tile: 12, pill: 999 } as const;

/** Minimum touch target (pt). */
export const hitTarget = 44;

/**
 * Outfit font families. Custom fonts on RN select weight by family name, so never combine these
 * with `fontWeight`. Loaded in src/app/_layout.tsx.
 */
export const fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
} as const;

/**
 * Hero/display/stat are semibold, headings and labels medium, body regular. Headlines track
 * slightly negative. Spread a token into a style; do not add `fontWeight`.
 * `overline` is for uppercase section labels (see SectionLabel); `hero` for big home figures.
 */
export const type = {
  hero: { fontFamily: fonts.semibold, fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  display: { fontFamily: fonts.semibold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  stat: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  title: { fontFamily: fonts.medium, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  headline: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
} as const;

/**
 * Soft cool-tinted shadows (RN `boxShadow` string syntax). `card` for resting cards, `raised` for
 * floating things. Invisible on dark grounds by design: in dark mode elevation is a lighter surface.
 */
export const elevation = {
  card: { boxShadow: '0 1px 2px rgba(15,30,29,0.04), 0 8px 24px rgba(15,30,29,0.06)' },
  raised: { boxShadow: '0 2px 4px rgba(15,30,29,0.06), 0 14px 36px rgba(15,30,29,0.12)' },
} as const;

/** Press feedback: one rule for every tappable surface. `spring` is a reanimated withSpring config. */
export const press = {
  opacity: 0.7,
  scale: 0.97,
  spring: { damping: 18, stiffness: 320, mass: 0.6 },
} as const;

/**
 * Shared scroll tuning. Android's default fling friction carries a short flick (~200px) for
 * 1500px+ of content, which feels like the page "jumps to the bottom"; 'fast' (friction 0.1 on
 * Android, a no-op for slow drags) keeps flicks proportional to the gesture.
 */
export const scrollProps = { decelerationRate: 'fast' } as const;
