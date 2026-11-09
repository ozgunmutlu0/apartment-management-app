import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/theme/colors';
import { fonts } from '@/theme/tokens';

export type AvatarProps = {
  /** Full name; the first letters of the first and last word become the initials. */
  name?: string | null;
  /** Diameter. Default 40. */
  size?: 40 | 56 | 72;
  /** For use on a `tint` surface (HeroCard): onHero-tinted fill and onHero text. */
  inverted?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Initials derived with locale-aware uppercase (Turkish i -> İ). */
export function initialsOf(name: string | null | undefined, locale?: string): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = Array.from(words[0] ?? '')[0] ?? '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1] ?? '')[0] ?? '') : '';
  return (first + last).toLocaleUpperCase(locale);
}

/** Circle with initials, or a person glyph when there is no name. Decorative (hidden from a11y). */
export function Avatar({ name, size = 40, inverted = false, style }: AvatarProps) {
  const colors = useColors();
  const { i18n } = useTranslation();
  const initials = initialsOf(name, i18n.language);
  const fg = inverted ? colors.onHero : colors.tint;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: inverted ? 'transparent' : colors.tintSoft,
        },
        style,
      ]}
    >
      {inverted ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.onHero, opacity: 0.2 }]} />
      ) : null}
      {initials ? (
        <Text style={{ fontFamily: fonts.semibold, fontSize: Math.round(size * 0.38), color: fg }}>
          {initials}
        </Text>
      ) : (
        <SymbolView
          name={{ ios: 'person.fill', android: 'person' }}
          size={Math.round(size * 0.5)}
          tintColor={fg}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
