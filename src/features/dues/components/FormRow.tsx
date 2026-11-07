import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/theme/colors';

/** Label on the left, native control on the right (grouped-form look). */
export function FormRow({ label, children }: { label: string; children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.label }]}>{label}</Text>
      <View style={styles.control}>{children}</View>
    </View>
  );
}

/** Rounded grouped container for FormRows. */
export function FormGroup({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.group, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 16, borderCurve: 'continuous', paddingHorizontal: 16 },
  row: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: { fontSize: 17 },
  control: { flexShrink: 1, alignItems: 'flex-end' },
});
