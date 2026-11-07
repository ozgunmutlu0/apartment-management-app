import { StyleSheet, View, type ViewProps } from 'react-native';

import { useColors } from '@/theme/colors';
import { radius } from '@/theme/tokens';

export type GlassCardProps = ViewProps & { padding?: number };

/**
 * Flat card: one surface, one hairline, no shadow. (Name kept for the existing importers; glass is
 * reserved for system chrome, content cards stay opaque so text keeps its contrast.)
 */
export function GlassCard({ style, padding = 16, children, ...rest }: GlassCardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          padding,
          backgroundColor: colors.secondarySystemGroupedBackground,
          borderColor: colors.separator,
        },
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
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
