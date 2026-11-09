import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { DateField } from '@/components/DateField';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SelectField } from '@/components/SelectField';
import { SectionLabel } from '@/components/SectionLabel';
import { Skeleton } from '@/components/Skeleton';
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
import { radius, space, type, scrollProps } from '@/theme/tokens';

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.formRow}>
      <Text style={[styles.formLabel, { color: colors.label }]}>{label}</Text>
      {children}
    </View>
  );
}

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
      {...scrollProps}
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {areas.isSuccess && !area ? <EmptyState icon="error" title={t('form.notFound')} /> : null}
      {area ? (
        <>
          <View>
            <SectionLabel>{t('form.area')}</SectionLabel>
            <GlassCard style={styles.card}>
              <SelectField
                value={area.id}
                onChange={setAreaId}
                options={(areas.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
              />
              <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
                {t('form.hours', { open: formatMinutes(open), close: formatMinutes(close) })}
              </Text>
            </GlassCard>
          </View>

          <View>
            <SectionLabel>{t('form.date')}</SectionLabel>
            <GlassCard style={styles.card}>
              <FormRow label={t('form.date')}>
                <DateField value={pickedDay} onChange={setPickedDay} minimumDate={pickerDate(today)} />
              </FormRow>
            </GlassCard>
          </View>

          <View>
            <SectionLabel>{t('form.booked')}</SectionLabel>
            <GlassCard variant="quiet" style={styles.card}>
              {booked.isPending ? (
                <View style={styles.bookedRow}>
                  <Skeleton width={96} height={24} radius={radius.pill} />
                  <Skeleton width={96} height={24} radius={radius.pill} />
                </View>
              ) : (booked.data ?? []).length === 0 ? (
                <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
                  {t('form.noneBooked')}
                </Text>
              ) : (
                <View style={styles.bookedRow}>
                  {(booked.data ?? []).map((b) => (
                    <Badge key={b.id} tone="red" label={fmt.timeRange(b.starts_at, b.ends_at)} />
                  ))}
                </View>
              )}
            </GlassCard>
          </View>

          {starts.length === 0 && !booked.isPending ? (
            <Text style={[styles.secondary, { color: colors.red }]}>{t('form.noSlots')}</Text>
          ) : (
            <View>
              <SectionLabel>{t('form.start')}</SectionLabel>
              <GlassCard style={styles.card}>
                <SelectField
                  value={String(start ?? 0)}
                  onChange={(v) => setStartChoice(Number(v))}
                  options={starts.map((m) => ({ value: String(m), label: formatMinutes(m) }))}
                />
              </GlassCard>
              <View style={styles.gap} />
              <SectionLabel>{t('form.end')}</SectionLabel>
              <GlassCard style={styles.card}>
                <SelectField
                  value={String(end ?? 0)}
                  onChange={(v) => setEndChoice(Number(v))}
                  options={ends.map((m) => ({ value: String(m), label: formatMinutes(m) }))}
                />
              </GlassCard>
            </View>
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
  content: { padding: space.lg, gap: space.xl },
  card: { gap: space.sm },
  gap: { height: space.lg },
  secondary: { ...type.small },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  formLabel: { ...type.body },
  bookedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
