import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { radius, space, type } from '@/theme/tokens';

export type FilterChipOption = { key: string; label: string; count?: number };

export type FilterChipsProps = {
  /** Chips in order. `count` is shown after the label when defined. */
  options: FilterChipOption[];
  /** Key of the selected option. */
  value: string;
  onChange: (key: string) => void;
  /**
   * Horizontal padding at both ends of the scroll content (the screen gutter). Pass the same
   * number the surrounding list uses and give the row a negative margin of it, so chips scroll
   * under the screen edge. Default `space.lg`; use 0 when the parent has no padding.
   */
  inset?: number;
};

/**
 * Horizontally scrolling row of pill filter chips. Selected = tint fill + onTint text; unselected =
 * card surface + hairline + secondary text. A single-select filter, not a segmented control.
 *
 * Place it inside a padded container and let it bleed: `<View style={{ marginHorizontal: -inset }}>`
 * (the component does this itself when `inset` is given).
 */
export function FilterChips({ options, value, onChange, inset = space.lg }: FilterChipsProps) {
  const colors = useColors();
  return (
    <View style={{ marginHorizontal: -inset }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
      >
        {options.map((option) => {
          const selected = option.key === value;
          const fg = selected ? colors.onTint : colors.secondaryLabel;
          return (
            <PressableScale
              key={option.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={
                option.count === undefined ? option.label : `${option.label}, ${option.count}`
              }
              onPress={() => onChange(option.key)}
              style={[
                styles.chip,
                selected
                  ? { backgroundColor: colors.tint, borderColor: colors.tint }
                  : {
                      backgroundColor: colors.secondarySystemGroupedBackground,
                      borderColor: colors.separator,
                    },
              ]}
            >
              <Text numberOfLines={1} style={[styles.label, { color: fg }]}>
                {option.label}
              </Text>
              {option.count === undefined ? null : (
                <Text
                  numberOfLines={1}
                  style={[styles.count, { color: fg, opacity: selected ? 0.8 : 0.7 }]}
                >
                  {option.count}
                </Text>
              )}
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, alignItems: 'center' },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { ...type.label },
  count: { ...type.label, fontVariant: ['tabular-nums'] },
});
