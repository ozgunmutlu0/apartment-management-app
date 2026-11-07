import type { Ref } from 'react';
import { StyleSheet, TextInput, type TextInputInstance, type TextInputProps } from 'react-native';

import { useColors } from '@/theme/colors';

/** Native text input styled with system colors (used by the auth screens). */
export function AuthField({
  style,
  ref,
  ...rest
}: TextInputProps & { ref?: Ref<TextInputInstance> }) {
  const colors = useColors();
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.secondaryLabel}
      style={[
        styles.input,
        { color: colors.label, backgroundColor: colors.secondarySystemBackground },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    fontSize: 17,
  },
});
