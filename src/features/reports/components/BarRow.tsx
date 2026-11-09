import { StyleSheet, Text, View, type ColorValue } from 'react-native';

import { useColors } from '@/theme/colors';
import { radius, space, type } from '@/theme/tokens';

export type BarRowProps = {
  label: string;
  value: number;
  /** Value that corresponds to a full-width bar. */
  max: number;
  /** Fill color; screens pass the single accent (or green for a completion rate). */
  color: ColorValue;
  /** Text shown at the right; defaults to the number. */
  valueLabel?: string;
};

/** Horizontal bar made of two Views (quiet track + single-color fill). */
export function BarRow({ label, value, max, color, valueLabel }: BarRowProps) {
  const colors = useColors();
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View accessible accessibilityLabel={`${label}: ${valueLabel ?? value}`} style={styles.row}>
      <View style={styles.top}>
        <Text style={[styles.label, { color: colors.label }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.label }]}>{valueLabel ?? value}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.secondarySystemBackground }]}>
        <View style={[styles.fill, { backgroundColor: color, width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { ...type.small },
  value: { ...type.bodyStrong, fontVariant: ['tabular-nums'] },
  track: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: 10, borderRadius: radius.pill },
});
