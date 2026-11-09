import { Link, type Href } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { IconName } from '@/components/Icon';
import { IconTile, type Tone } from '@/components/IconTile';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { elevation, radius, space, type } from '@/theme/tokens';

export type StatTileProps = {
  /** The number/short value, shown large with tabular numerals. */
  value: string | number;
  /** What the value counts. */
  label: string;
  /** Tone of the icon tile; state tones (green/orange/red/blue) are allowed, they are states. */
  tone?: Tone;
  /** Named icon. Ignored when `symbol` is given. */
  icon?: IconName;
  symbol?: { ios: SFSymbol; android: AndroidSymbol };
  /** Makes the tile a link (shows the trailing chevron). */
  href?: Href;
  /** Makes the tile pressable (shows the trailing chevron). Ignored if `href` is set. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Surface card: tone IconTile (28) top-left, figure in `type.stat`, label in `type.label`.
 * Flexes (`flex: 1`) so two or three can sit in a row.
 */
export function StatTile({
  value,
  label,
  tone = 'tint',
  icon,
  symbol,
  href,
  onPress,
  style,
}: StatTileProps) {
  const colors = useColors();
  const dark = useColorScheme() === 'dark';
  const interactive = !!href || !!onPress;

  const content = (
    <>
      <View style={styles.top}>
        <IconTile name={icon} symbol={symbol} size={28} tone={tone} />
        {interactive ? (
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right' }}
            size={14}
            tintColor={colors.tertiaryLabel}
          />
        ) : null}
      </View>
      <Text style={[styles.value, { color: colors.label }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.secondaryLabel }]} numberOfLines={2}>
        {label}
      </Text>
    </>
  );

  const cardStyle = StyleSheet.flatten([
    styles.card,
    { backgroundColor: colors.secondarySystemGroupedBackground },
    dark
      ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }
      : elevation.card,
    style,
  ]);

  if (href) {
    return (
      <Link href={href} asChild>
        <PressableScale
          accessibilityRole="link"
          accessibilityLabel={`${value}, ${label}`}
          style={cardStyle}
        >
          {content}
        </PressableScale>
      </Link>
    );
  }
  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${value}, ${label}`}
        onPress={onPress}
        style={cardStyle}
      >
        {content}
      </PressableScale>
    );
  }
  return (
    <View accessible accessibilityLabel={`${value}, ${label}`} style={cardStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    padding: space.md,
    gap: 2,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { ...type.stat, lineHeight: 32, fontVariant: ['tabular-nums'] },
  label: { ...type.label },
});
