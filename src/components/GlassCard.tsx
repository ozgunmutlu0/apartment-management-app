import { StyleSheet, View, useColorScheme, type ViewProps } from 'react-native';

import { useColors } from '@/theme/colors';
import { elevation, radius } from '@/theme/tokens';

export type GlassCardProps = ViewProps & {
  padding?: number;
  /**
   * `surface` (default): raised card. `tint`: solid accent fill for hero cards, put `colors.onTint`
   * content on it. `quiet`: secondarySystemBackground fill, no shadow.
   */
  variant?: 'surface' | 'tint' | 'quiet';
};

/**
 * Card surface (name kept for existing importers; glass is reserved for system chrome). Light mode:
 * soft shadow, no border. Dark mode: lighter surface plus a hairline (shadows are invisible there).
 * boxShadow is drawn outside the border box and is not clipped by the view's own overflow.
 */
export function GlassCard({
  style,
  padding = 16,
  variant = 'surface',
  children,
  ...rest
}: GlassCardProps) {
  const colors = useColors();
  const dark = useColorScheme() === 'dark';
  return (
    <View
      style={[
        styles.card,
        { padding },
        variant === 'tint' && { backgroundColor: colors.tint },
        variant === 'quiet' && { backgroundColor: colors.secondarySystemBackground },
        variant === 'surface' && [
          { backgroundColor: colors.secondarySystemGroupedBackground },
          dark
            ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }
            : elevation.card,
        ],
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
});
