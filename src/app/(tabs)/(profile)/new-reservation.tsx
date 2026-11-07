import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Picker } from '@expo/ui/community/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { FormGroup, FormRow } from '@/features/dues/components/FormRow';
import {
  reservationErrorKey,
  useAreaDayReservations,
  useCommonAreas,
  useCreateReservation,
} from '@/features/reservations/api';
import { useReservationFormat } from '@/features/reservations/format';
import {
  SLOT_MINUTES,
  dayFromPicker,
  endSlots,
  formatMinutes,
  minutesOfDay,
  parseTime,
  pickerDate,
  startSlots,
  todayIn,
  zonedInstant,
} from '@/features/reservations/time';
import { useColors } from '@/theme/colors';

/**
 * formSheet: book a common area. Param: areaId. All wall-clock values are interpreted in the
 * building timezone (see features/reservations/time.ts), independent of the device timezone.
 * Start/end are native pickers restricted to the 30-minute grid inside opening hours, so booked
 * and past slots cannot be chosen.
 */
export default function NewReservationScreen() {
  const { t } = useTranslation('reservations');
  const colors = useColors();
  const router = useRouter();
  const fmt = useReservationFormat();
  const timeZone = fmt.timeZone;
  const { areaId: areaParam } = useLocalSearchParams<{ areaId?: string }>();
  const areas = useCommonAreas();
  const [areaId, setAreaId] = useState<string | undefined>(areaParam);
  const area = areas.data?.find((a) => a.id === areaId) ?? areas.data?.[0];

  const today = todayIn(timeZone);
  const [pickedDay, setPickedDay] = useState<Date>(() => pickerDate(today));
  const day = dayFromPicker(pickedDay);
  const booked = useAreaDayReservations(area?.id, day, timeZone);
  const create = useCreateReservation();
  const [startChoice, setStartChoice] = useState<number | null>(null);
  const [endChoice, setEndChoice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = area ? parseTime(area.open_time) : 0;
  const close = area ? parseTime(area.close_time) : 0;
  const bookedIntervals = useMemo(
    () =>
      (booked.data ?? []).map((b) => ({
        start: minutesOfDay(new Date(b.starts_at), timeZone),
        // A booking ending at local midnight reads as 0; clamp to the end of the day.
        end: minutesOfDay(new Date(b.ends_at), timeZone) || 24 * 60,
      })),
    [booked.data, timeZone],
  );

  const isToday = day.year === today.year && day.month === today.month && day.day === today.day;
  const minStart = isToday
    ? Math.ceil((minutesOfDay(new Date(), timeZone) + 1) / SLOT_MINUTES) * SLOT_MINUTES
    : 0;
  const starts = area ? startSlots(open, close, bookedIntervals, minStart) : [];
  const start =
    startChoice !== null && starts.includes(startChoice) ? startChoice : (starts[0] ?? null);
  const ends = start !== null ? endSlots(start, close, bookedIntervals) : [];
  const end = endChoice !== null && ends.includes(endChoice) ? endChoice : (ends[0] ?? null);

  const submit = () => {
    if (!area || start === null || end === null) return;
    setError(null);
    create.mutate(
      {
        areaId: area.id,
        startsAt: zonedInstant(day, start, timeZone),
        endsAt: zonedInstant(day, end, timeZone),
      },
      {
        onSuccess: () => router.back(),
        onError: (e) => setError(t(`errors.${reservationErrorKey(e)}`)),
      },
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {areas.isSuccess && !area ? (
        <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
          {t('form.notFound')}
        </Text>
      ) : null}
      {area ? (
        <>
          <Text style={[styles.caption, { color: colors.secondaryLabel }]}>{t('form.area')}</Text>
          <Picker selectedValue={area.id} onValueChange={(v) => setAreaId(String(v))}>
            {(areas.data ?? []).map((a) => (
              <Picker.Item key={a.id} value={a.id} label={a.name} />
            ))}
          </Picker>
          <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
            {t('form.hours', { open: formatMinutes(open), close: formatMinutes(close) })}
          </Text>

          <FormGroup>
            <FormRow label={t('form.date')}>
              <DateTimePicker
                value={pickedDay}
                mode="date"
                display="compact"
                presentation="inline"
                minimumDate={pickerDate(today)}
                onValueChange={(_e, date) => setPickedDay(date)}
              />
            </FormRow>
          </FormGroup>

          <Text style={[styles.caption, { color: colors.secondaryLabel }]}>{t('form.booked')}</Text>
          <View
            style={[styles.booked, { backgroundColor: colors.secondarySystemGroupedBackground }]}
          >
            {booked.isPending ? (
              <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
                {t('form.loadingSlots')}
              </Text>
            ) : (booked.data ?? []).length === 0 ? (
              <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
                {t('form.noneBooked')}
              </Text>
            ) : (
              (booked.data ?? []).map((b) => (
                <Text key={b.id} style={[styles.bookedItem, { color: colors.red }]}>
                  {fmt.timeRange(b.starts_at, b.ends_at)}
                </Text>
              ))
            )}
          </View>

          {starts.length === 0 && !booked.isPending ? (
            <Text style={[styles.secondary, { color: colors.red }]}>{t('form.noSlots')}</Text>
          ) : (
            <>
              <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                {t('form.start')}
              </Text>
              <Picker selectedValue={start ?? 0} onValueChange={(v) => setStartChoice(Number(v))}>
                {starts.map((m) => (
                  <Picker.Item key={m} value={m} label={formatMinutes(m)} />
                ))}
              </Picker>
              <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                {t('form.end')}
              </Text>
              <Picker selectedValue={end ?? 0} onValueChange={(v) => setEndChoice(Number(v))}>
                {ends.map((m) => (
                  <Picker.Item key={m} value={m} label={formatMinutes(m)} />
                ))}
              </Picker>
            </>
          )}

          {error ? (
            <Text accessibilityRole="alert" style={[styles.secondary, { color: colors.red }]}>
              {error}
            </Text>
          ) : null}
          <PrimaryButton
            title={t('form.submit')}
            disabled={start === null || end === null}
            loading={create.isPending}
            onPress={submit}
          />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10 },
  caption: { fontSize: 13, marginLeft: 4, marginTop: 4 },
  secondary: { fontSize: 15 },
  booked: { borderRadius: 16, borderCurve: 'continuous', padding: 14, gap: 4 },
  bookedItem: { fontSize: 15, fontWeight: '500' },
});
