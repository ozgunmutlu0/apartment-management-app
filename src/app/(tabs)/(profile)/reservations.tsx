import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  useCancelReservation,
  useCommonAreas,
  useMyReservations,
  type MyReservation,
} from '@/features/reservations/api';
import { useReservationFormat } from '@/features/reservations/format';
import { parseTime } from '@/features/reservations/time';
import { useColors } from '@/theme/colors';

export default function ReservationsScreen() {
  const { t } = useTranslation('reservations');
  const colors = useColors();
  const router = useRouter();
  const fmt = useReservationFormat();
  const areas = useCommonAreas();
  const mine = useMyReservations();
  const cancel = useCancelReservation();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([areas.refetch(), mine.refetch()]);
    setRefreshing(false);
  };

  const confirmCancel = (reservation: MyReservation) => {
    Alert.alert(
      t('mine.cancelTitle'),
      t('mine.cancelMessage', {
        area: reservation.areaName,
        when: fmt.range(reservation.starts_at, reservation.ends_at),
      }),
      [
        { text: t('mine.keep'), style: 'cancel' },
        {
          text: t('mine.cancelConfirm'),
          style: 'destructive',
          onPress: () =>
            cancel.mutate(reservation.id, {
              onError: () => Alert.alert(t('mine.cancelError')),
            }),
        },
      ],
    );
  };

  const renderReservation = (r: MyReservation, canCancel: boolean) => (
    <GlassCard key={r.id} style={styles.card}>
      <Text style={[styles.cardTitle, { color: colors.label }]}>{r.areaName}</Text>
      <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
        {fmt.range(r.starts_at, r.ends_at)}
      </Text>
      {r.status === 'cancelled' ? (
        <Text style={[styles.secondary, { color: colors.red }]}>{t('mine.cancelled')}</Text>
      ) : null}
      {canCancel ? (
        <PrimaryButton
          variant="plain"
          title={t('mine.cancel')}
          disabled={cancel.isPending}
          onPress={() => confirmCancel(r)}
        />
      ) : null}
    </GlassCard>
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <Text style={[styles.section, { color: colors.secondaryLabel }]}>{t('areas.title')}</Text>
      {areas.isPending ? (
        <ActivityIndicator />
      ) : areas.isError ? (
        <EmptyState icon="error" title={t('areas.error')} />
      ) : areas.data.length === 0 ? (
        <EmptyState icon="reservation" title={t('areas.empty')} />
      ) : (
        areas.data.map((area) => (
          <GlassCard key={area.id} style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.label }]}>{area.name}</Text>
            {area.description ? (
              <Text style={[styles.body, { color: colors.secondaryLabel }]}>
                {area.description}
              </Text>
            ) : null}
            <View style={styles.meta}>
              <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
                {t('areas.hours', {
                  open: fmt.minutes(parseTime(area.open_time)),
                  close: fmt.minutes(parseTime(area.close_time)),
                })}
              </Text>
              {area.capacity ? (
                <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
                  {t('areas.capacity', { count: area.capacity })}
                </Text>
              ) : null}
            </View>
            <PrimaryButton
              title={t('areas.reserve')}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/(profile)/new-reservation',
                  params: { areaId: area.id },
                })
              }
            />
          </GlassCard>
        ))
      )}

      <Text style={[styles.section, { color: colors.secondaryLabel }]}>{t('mine.title')}</Text>
      {mine.isPending ? (
        <ActivityIndicator />
      ) : mine.isError ? (
        <EmptyState icon="error" title={t('mine.error')} />
      ) : (
        <>
          <Text style={[styles.sub, { color: colors.label }]}>{t('mine.upcoming')}</Text>
          {mine.data.upcoming.length === 0 ? (
            <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
              {t('mine.noUpcoming')}
            </Text>
          ) : (
            mine.data.upcoming.map((r) => renderReservation(r, true))
          )}
          <Text style={[styles.sub, { color: colors.label }]}>{t('mine.past')}</Text>
          {mine.data.past.length === 0 ? (
            <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
              {t('mine.noPast')}
            </Text>
          ) : (
            mine.data.past.map((r) => renderReservation(r, false))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  section: { fontSize: 13, textTransform: 'uppercase', marginLeft: 4, marginTop: 8 },
  sub: { fontSize: 17, fontWeight: '600', marginTop: 4 },
  card: { gap: 6 },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15 },
  meta: { gap: 2, marginBottom: 6 },
  secondary: { fontSize: 14 },
});
