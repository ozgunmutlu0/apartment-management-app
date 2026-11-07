import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useColors } from '@/theme/colors';

export type GlassCardProps = ViewProps & { padding?: number };

/** Liquid Glass surface on iOS 26+, plain system-colored card elsewhere. */
export function GlassCard({ style, padding = 16, children, ...rest }: GlassCardProps) {
  const colors = useColors();
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView glassEffectStyle="regular" style={[styles.card, { padding }, style]} {...rest}>
        {children}
      </GlassView>
    );
  }
  return (
    <View
      style={[
        styles.card,
        { padding, backgroundColor: colors.secondarySystemGroupedBackground },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderCurve: 'continuous', overflow: 'hidden' },
});
