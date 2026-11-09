import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { hitTarget, type } from '@/theme/tokens';

export type PressableRowProps = {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  subtitle?: string;
  /** Right-aligned secondary text. */
  value?: string;
  /** Trailing chevron. */
  chevron?: boolean;
  /** Title color. Default 'accent' (kept for existing callers); `destructive` implies 'destructive'. */
  tone?: 'default' | 'accent' | 'destructive';
  destructive?: boolean;
  last?: boolean;
};

/** Tappable row for grouped lists (spring press feedback, hairline separator). */
export function PressableRow({
  title,
  onPress,
  icon,
  subtitle,
  value,
  chevron,
  tone = 'accent',
  destructive,
  last,
}: PressableRowProps) {
  const colors = useColors();
  const resolved = destructive ? 'destructive' : tone;
  const titleColor =
    resolved === 'destructive' ? colors.red : resolved === 'default' ? colors.label : colors.tint;
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.row,
        !last && {
          borderBottomColor: colors.separator,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.text}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>{subtitle}</Text>
        ) : null}
      </View>
      {value ? <Text style={[styles.value, { color: colors.secondaryLabel }]}>{value}</Text> : null}
      {chevron ? <Icon name="chevron" size={14} color={colors.tertiaryLabel} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: hitTarget + 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: { minWidth: 26, alignItems: 'center' },
  text: { flex: 1 },
  title: { ...type.body },
  subtitle: { ...type.small },
  value: { ...type.body },
});
