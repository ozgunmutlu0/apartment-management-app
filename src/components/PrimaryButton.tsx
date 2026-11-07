import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useColors } from '@/theme/colors';
import { radius } from '@/theme/tokens';

export type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  loading?: boolean;
  variant?: 'filled' | 'plain';
};

export function PrimaryButton({
  title,
  loading,
  disabled,
  variant = 'filled',
  ...rest
}: PrimaryButtonProps) {
  const colors = useColors();
  const filled = variant === 'filled';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        filled && { backgroundColor: colors.tint },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={filled ? (colors.onTint as string) : undefined} />
      ) : (
        <Text style={[styles.title, { color: filled ? colors.onTint : colors.tint }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.control,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: { fontSize: 16, fontWeight: '600', letterSpacing: -0.1 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
