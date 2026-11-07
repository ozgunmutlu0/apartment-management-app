import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/theme/colors';

export type PressableRowProps = {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  last?: boolean;
};

/** Tappable row for grouped lists (system press feedback, hairline separator). */
export function PressableRow({ title, onPress, icon, destructive, last }: PressableRowProps) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={{ color: colors.separator }}
      style={({ pressed }) => [
        styles.row,
        !last && {
          borderBottomColor: colors.separator,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.title, { color: destructive ? colors.red : colors.tint }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: { width: 26, alignItems: 'center' },
  title: { fontSize: 17 },
  pressed: { opacity: 0.6 },
});
