import { MenuView } from '@expo/ui/community/menu';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/theme/colors';
import { radius, space, type } from '@/theme/tokens';

export type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  title?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

/** Single-choice field: themed trigger that opens the native menu (Material dropdown on Android). */
export function SelectField({ title, value, options, onChange }: SelectFieldProps) {
  const colors = useColors();
  const selected = options.find((o) => o.value === value);
  return (
    <MenuView
      title={title}
      onPressAction={({ nativeEvent }) => onChange(nativeEvent.event)}
      actions={options.map((o) => ({
        id: o.value,
        title: o.label,
        state: o.value === value ? 'on' : 'off',
      }))}
    >
      <View style={[styles.row, { backgroundColor: colors.secondarySystemBackground }]}>
        <Text numberOfLines={1} style={[styles.text, { color: colors.label }]}>
          {selected?.label ?? ''}
        </Text>
        <SymbolView
          name={{ ios: 'chevron.up.chevron.down', android: 'unfold_more' }}
          size={14}
          tintColor={colors.secondaryLabel}
        />
      </View>
    </MenuView>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.control,
  },
  text: { ...type.body, flex: 1 },
});
