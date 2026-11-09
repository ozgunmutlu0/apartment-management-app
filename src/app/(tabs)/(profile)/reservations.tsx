import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { IconTile } from '@/components/IconTile';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionLabel } from '@/components/SectionLabel';
import { Skeleton } from '@/components/Skeleton';
import {
  useCancelReservation,
  useCommonAreas,
  useMyReservations,
  type MyReservation,
} from '@/features/reservations/api';
import { useReservationFormat } from '@/features/reservations/format';
import { parseTime } from '@/features/reservations/time';
import { useColors } from '@/theme/colors';
import { space, type, scrollProps } from '@/theme/tokens';

function CardSkeleton() {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.head}>
        <Skeleton width={44} height={44} />
        <View style={styles.headText}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={14} />
        </View>
      </View>
    </GlassCard>
  );
}

export default function ReservationsScreen() {
  const { t } = useTranslation('reservations');
  const { t: tc } = useTranslation('common');
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

  const goReserve = (areaId?: string) =>
    router.push({
      pathname: '/(tabs)/(profile)/new-reservation',
      params: areaId ? { areaId } : {},
    });

  const renderReservation = (r: MyReservation, upcoming: boolean) => (
    <GlassCard key={r.id} style={styles.card}>
      <View style={styles.head}>
        <IconTile name="reservation" />
        <View style={styles.headText}>
          <Text style={[styles.cardTitle, { color: colors.label }]}>{r.areaName}</Text>
          <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
            {fmt.range(r.starts_at, r.ends_at)}
          </Text>
        </View>
      </View>
      <Badge
        label={
          r.status === 'cancelled'
            ? t('mine.cancelled')
            : upcoming
              ? t('mine.upcoming')
              : t('mine.past')
        }
        tone={r.status === 'cancelled' ? 'red' : upcoming ? 'tint' : 'neutral'}
        dot
      />
      {upcoming ? (
        <PrimaryButton
          variant="tonal"
          title={t('mine.cancel')}
          disabled={cancel.isPending}
          onPress={() => confirmCancel(r)}
        />
      ) : null}
    </GlassCard>
  );

  return (
    <ScrollView
      {...scrollProps}
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={styles.section}>
        <SectionLabel>{t('areas.title')}</SectionLabel>
        {areas.isPending ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : areas.isError ? (
          <EmptyState
            icon="error"
            title={t('areas.error')}
            action={{ title: tc('buttons.retry'), onPress: () => void areas.refetch() }}
          />
        ) : areas.data.length === 0 ? (
          <EmptyState icon="reservation" title={t('areas.empty')} />
        ) : (
          areas.data.map((area) => (
            <GlassCard key={area.id} style={styles.card}>
              <View style={styles.head}>
                <IconTile name="reservation" />
                <View style={styles.headText}>
                  <Text style={[styles.cardTitle, { color: colors.label }]}>{area.name}</Text>
                  <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
                    {t('areas.hours', {
                      open: fmt.minutes(parseTime(area.open_time)),
                      close: fmt.minutes(parseTime(area.close_time)),
                    })}
                    {area.capacity ? `  ·  ${t('areas.capacity', { count: area.capacity })}` : ''}
                  </Text>
                </View>
              </View>
              {area.description ? (
                <Text style={[styles.body, { color: colors.secondaryLabel }]}>
                  {area.description}
                </Text>
              ) : null}
              <PrimaryButton title={t('areas.reserve')} onPress={() => goReserve(area.id)} />
            </GlassCard>
          ))
        )}
      </View>

      <View style={styles.section}>
        <SectionLabel>{t('mine.title')}</SectionLabel>
        {mine.isPending ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : mine.isError ? (
          <EmptyState
            icon="error"
            title={t('mine.error')}
            action={{ title: tc('buttons.retry'), onPress: () => void mine.refetch() }}
          />
        ) : (
          <>
            <Text style={[styles.sub, { color: colors.label }]}>{t('mine.upcoming')}</Text>
            {mine.data.upcoming.length === 0 ? (
              <EmptyState
                icon="reservation"
                title={t('mine.noUpcoming')}
                action={
                  areas.data && areas.data.length > 0
                    ? { title: t('areas.reserve'), onPress: () => goReserve() }
                    : undefined
                }
              />
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl + space.xl },
  section: { gap: space.md },
  sub: { ...type.headline, marginTop: space.xs },
  card: { gap: space.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headText: { flex: 1, gap: 2 },
  cardTitle: { ...type.headline },
  body: { ...type.small },
  secondary: { ...type.small },
});
