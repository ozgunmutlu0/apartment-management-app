import { useState, type Ref } from 'react';
import { StyleSheet, TextInput, type TextInputInstance, type TextInputProps } from 'react-native';

import { useColors } from '@/theme/colors';
import { radius, type } from '@/theme/tokens';

/**
 * Filled text field: quiet fill, no border at rest, 1.5pt accent border on focus. Also exported as
 * `TextField` for non-auth forms.
 */
export function AuthField({
  style,
  ref,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps & { ref?: Ref<TextInputInstance> }) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.tertiaryLabel}
      selectionColor={colors.tint as string}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.input,
        {
          color: colors.label,
          backgroundColor: colors.secondarySystemBackground,
          borderColor: focused ? colors.tint : 'transparent',
        },
        style,
      ]}
      {...rest}
    />
  );
}

export const TextField = AuthField;

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: radius.control,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    ...type.body,
  },
});
