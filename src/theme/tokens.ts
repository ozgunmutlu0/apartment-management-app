/**
 * Layout and type tokens. One spacing scale, one radius family, one hairline, one type scale:
 * screens use these instead of inventing numbers.
 */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Soft family: cards and frames 14, controls and buttons 10. */
export const radius = { card: 14, control: 10 } as const;

/** Weights stay at 500/600; 700+ reads as a template. Headlines track tight. */
export const type = {
  display: { fontSize: 32, fontWeight: '600', letterSpacing: -0.8 },
  title: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  stat: { fontSize: 28, fontWeight: '600', letterSpacing: -0.5 },
  body: { fontSize: 16, fontWeight: '400' },
  bodyStrong: { fontSize: 16, fontWeight: '600' },
  small: { fontSize: 14, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '500' },
} as const;
