import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useColors } from '@/theme/colors';

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
        <ActivityIndicator color={filled ? '#FFFFFF' : undefined} />
      ) : (
        <Text style={[styles.title, { color: filled ? '#FFFFFF' : colors.tint }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: { fontSize: 17, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
