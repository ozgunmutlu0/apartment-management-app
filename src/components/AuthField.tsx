import type { Ref } from 'react';
import { StyleSheet, TextInput, type TextInputInstance, type TextInputProps } from 'react-native';

import { useColors } from '@/theme/colors';
import { radius } from '@/theme/tokens';

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
        {
          color: colors.label,
          backgroundColor: colors.systemBackground,
          borderColor: colors.separator,
        },
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
    borderRadius: radius.control,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
  },
});
