import { StyleSheet, Text, View, type ColorValue } from 'react-native';

import { useColors } from '@/theme/colors';

export type BarRowProps = {
  label: string;
  value: number;
  /** Value that corresponds to a full-width bar. */
  max: number;
  color: ColorValue;
  /** Text shown at the right; defaults to the number. */
  valueLabel?: string;
};

/** Horizontal bar made of two Views (track + fill) with system colors. */
export function BarRow({ label, value, max, color, valueLabel }: BarRowProps) {
  const colors = useColors();
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View accessible accessibilityLabel={`${label}: ${valueLabel ?? value}`} style={styles.row}>
      <View style={styles.top}>
        <Text style={[styles.label, { color: colors.label }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.secondaryLabel }]}>{valueLabel ?? value}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.secondarySystemBackground }]}>
        <View style={[styles.fill, { backgroundColor: color, width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 5 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 15 },
  value: { fontSize: 15, fontVariant: ['tabular-nums'] },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
});
