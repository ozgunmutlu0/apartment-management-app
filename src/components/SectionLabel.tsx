import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { useColors } from '@/theme/colors';
import { type } from '@/theme/tokens';

/** Uppercase overline label for grouped sections (locale-aware: Turkish i becomes İ). */
export function SectionLabel({ children, style, ...rest }: TextProps & { children: string }) {
  const colors = useColors();
  const { i18n } = useTranslation();
  return (
    <Text
      accessibilityRole="header"
      style={[styles.label, { color: colors.secondaryLabel }, style]}
      {...rest}
    >
      {children.toLocaleUpperCase(i18n.language)}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: { ...type.overline, paddingHorizontal: 4, paddingBottom: 8 },
});
