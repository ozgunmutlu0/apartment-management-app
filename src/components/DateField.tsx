import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, useColorScheme } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { hexColors, useColors } from '@/theme/colors';
import { radius, space, type } from '@/theme/tokens';

type DateFieldProps = {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

/**
 * Date control. iOS: the native compact date picker. Android: a value chip that opens the native
 * Material date dialog (the inline Material calendar does not fit a form row and can loop in
 * layout inside a Host).
 */
export function DateField({ value, onChange, minimumDate, maximumDate }: DateFieldProps) {
  const colors = useColors();
  const { t, i18n } = useTranslation('common');
  const hex = hexColors(useColorScheme());
  const [open, setOpen] = useState(false);

  if (Platform.OS !== 'android') {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="compact"
        presentation="inline"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onValueChange={(_e, date) => onChange(date)}
      />
    );
  }

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.chip, { backgroundColor: colors.tintSoft }]}
      >
        <Text style={[styles.text, { color: colors.tint }]}>
          {value.toLocaleDateString(i18n.language, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </PressableScale>
      {open ? (
        <DateTimePicker
          value={value}
          mode="date"
          presentation="dialog"
          accentColor={hex.tint}
          positiveButton={{ label: t('buttons.ok') }}
          negativeButton={{ label: t('buttons.cancel') }}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={(_e, date) => {
            setOpen(false);
            onChange(date);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.control,
  },
  text: { ...type.body },
});
