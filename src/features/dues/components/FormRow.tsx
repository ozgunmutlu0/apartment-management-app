import { Children, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

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

/** Raised surface card for FormRows (or any rows); hairline separators sit between children only. */
export function FormGroup({ children }: { children: ReactNode }) {
  const colors = useColors();
  const items = Children.toArray(children);
  return (
    <GlassCard padding={0} style={styles.group}>
      {items.map((child, i) => (
        <View
          key={i}
          style={
            i > 0 && {
              borderTopColor: colors.separator,
              borderTopWidth: StyleSheet.hairlineWidth,
            }
          }
        >
          {child}
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  group: { paddingHorizontal: space.lg },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  label: { ...type.body },
  control: { flexShrink: 1, alignItems: 'flex-end' },
});
