import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';

import { useColors } from '@/theme/colors';
import { elevation, radius, space, type } from '@/theme/tokens';

export type HeroCardProps = {
  children: ReactNode;
  /** Large low-opacity watermark glyph in the top-right corner. */
  symbol?: { ios: SFSymbol; android: AndroidSymbol };
  style?: StyleProp<ViewStyle>;
};

/**
 * Accent hero surface: solid tint base (no gradient) with depth from large decorative onTint
 * circles (6-10% opacity) clipped by the card, plus an optional watermark symbol. Children render
 * above the decoration. Put `HeroEyebrow` / `HeroFigure` / `HeroCaption` / `HeroProgress` inside.
 * Padding is `space.xl`; radius `radius.card + 4`.
 */
export function HeroCard({ children, symbol, style }: HeroCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.hero }, style]}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        <View style={[styles.circle, styles.circleA, { backgroundColor: colors.onHero }]} />
        <View style={[styles.circle, styles.circleB, { backgroundColor: colors.onHero }]} />
        <View style={[styles.circle, styles.circleC, { backgroundColor: colors.onHero }]} />
        {symbol ? (
          <View style={styles.watermark}>
            <SymbolView name={symbol} size={80} tintColor={colors.onHero} />
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** Small uppercase-style label on a hero (onTint at 75%). Pass already-uppercased text if wanted. */
export function HeroEyebrow({ style, ...rest }: TextProps) {
  const colors = useColors();
  return <Text style={[type.overline, { color: colors.onHero, opacity: 0.75 }, style]} {...rest} />;
}

/** Big figure on a hero (`type.hero`, tabular numerals). */
export function HeroFigure({ style, ...rest }: TextProps) {
  const colors = useColors();
  return (
    <Text
      style={[type.hero, { color: colors.onHero, fontVariant: ['tabular-nums'] }, style]}
      {...rest}
    />
  );
}

/** Supporting line on a hero (`type.small`, onTint at 85%). */
export function HeroCaption({ style, ...rest }: TextProps) {
  const colors = useColors();
  return <Text style={[type.small, { color: colors.onHero, opacity: 0.85 }, style]} {...rest} />;
}

export type HeroProgressProps = {
  /** 0..1, clamped. */
  value: number;
  /** Screen-reader label, e.g. "Collected". The percentage is announced as the value. */
  accessibilityLabel?: string;
};

/** Thin progress bar for use on a HeroCard: onTint fill over a low-opacity onTint track. */
export function HeroProgress({ value, accessibilityLabel }: HeroProgressProps) {
  const colors = useColors();
  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={styles.trackWrap}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.onHero, opacity: 0.2 }]} />
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: colors.onHero,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card + 4,
    borderCurve: 'continuous',
    padding: space.xl,
    overflow: 'hidden',
    ...elevation.raised,
  },
  circle: { position: 'absolute' },
  circleA: { width: 220, height: 220, borderRadius: 110, top: -90, right: -60, opacity: 0.1 },
  circleB: { width: 140, height: 140, borderRadius: 70, bottom: -70, left: -40, opacity: 0.06 },
  circleC: { width: 90, height: 90, borderRadius: 28, top: 40, right: 70, opacity: 0.06 },
  watermark: { position: 'absolute', right: space.lg, top: space.lg, opacity: 0.08 },
  trackWrap: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: space.lg,
  },
});
