import { SegmentedControl } from '@expo/ui/community/segmented-control';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { elevation, radius, type } from '@/theme/tokens';

export type SegmentedProps = {
  /** Labels, 2-3 options (use FilterChips for more). */
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Two/three-option switch. iOS: the native segmented control. Android: the @expo/ui control only
 * exposes an active-container tint (no track, label or shape theming), so a JS pill switch is
 * rendered instead: quiet track, selected pill on the card surface with elevation, tint label.
 */
export function Segmented({ values, selectedIndex, onChange, style }: SegmentedProps) {
  if (Platform.OS === 'ios') {
    return (
      <SegmentedControl
        values={values}
        selectedIndex={selectedIndex}
        onChange={(event) => onChange(event.nativeEvent.selectedSegmentIndex)}
        style={style}
      />
    );
  }
  return (
    <PillSegmented
      values={values}
      selectedIndex={selectedIndex}
      onChange={onChange}
      style={style}
    />
  );
}

function PillSegmented({ values, selectedIndex, onChange, style }: SegmentedProps) {
  const colors = useColors();
  const dark = useColorScheme() === 'dark';
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.track, { backgroundColor: colors.secondarySystemBackground }, style]}
    >
      {values.map((label, index) => {
        const selected = index === selectedIndex;
        return (
          <PressableScale
            key={`${index}-${label}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(index)}
            style={[
              styles.segment,
              selected && {
                backgroundColor: dark ? colors.tintSoft : colors.secondarySystemGroupedBackground,
              },
              selected && !dark && elevation.card,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, { color: selected ? colors.tint : colors.secondaryLabel }]}
            >
              {label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.control,
    borderCurve: 'continuous',
  },
  segment: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control - 3,
    borderCurve: 'continuous',
  },
  label: { ...type.label },
});
