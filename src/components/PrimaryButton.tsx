import { ActivityIndicator, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { radius, type } from '@/theme/tokens';

export type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  loading?: boolean;
  /** `filled` (primary), `tonal` (soft accent fill), `plain` (text only). */
  variant?: 'filled' | 'tonal' | 'plain';
  /** Optional leading glyph. */
  icon?: IconName;
};

export function PrimaryButton({
  title,
  loading,
  disabled,
  variant = 'filled',
  icon,
  ...rest
}: PrimaryButtonProps) {
  const colors = useColors();
  const fg = variant === 'filled' ? colors.onTint : colors.tint;
  const inactive = disabled || loading;
  return (
    <PressableScale
      accessibilityRole="button"
      disabled={inactive}
      style={[
        styles.button,
        variant === 'filled' && { backgroundColor: colors.tint },
        variant === 'tonal' && { backgroundColor: colors.tintSoft },
        inactive && styles.disabled,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'filled' ? (colors.onTint as string) : undefined} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.title, { color: fg }]}>{title}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.control,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...type.bodyStrong },
  disabled: { opacity: 0.5 },
});
