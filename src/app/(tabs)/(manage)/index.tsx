import { useRouter } from 'expo-router';
import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import {
  HeroCaption,
  HeroCard,
  HeroEyebrow,
  HeroFigure,
  HeroProgress,
} from '@/components/HeroCard';
import { IconTile } from '@/components/IconTile';
import { PressableRow } from '@/components/PressableRow';
import { SectionLabel } from '@/components/SectionLabel';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { useManagerDues } from '@/features/dues/api';
import { effectiveStatus, paidTotal, periodOf, useDuesFormat } from '@/features/dues/utils';
import { Enter } from '@/features/manage/components/Enter';
import { useTickets } from '@/features/tickets/api';
import { useColors } from '@/theme/colors';
import { space, scrollProps } from '@/theme/tokens';

type Destination = {
  key: string;
  title: string;
  subtitle: string;
  symbol: { ios: SFSymbol; android: AndroidSymbol };
  onPress: () => void;
};

const NO_FILTER = { status: null, category: null } as const;

export default function ManageScreen() {
  const { t, i18n } = useTranslation('manage');
  const colors = useColors();
  const router = useRouter();
  const fmt = useDuesFormat();
  const period = useMemo(() => periodOf(new Date()), []);
  const dues = useManagerDues(period);
  const tickets = useTickets(NO_FILTER);

  const stats = useMemo(() => {
    const rows = dues.data ?? [];
    let expected = 0;
    let collected = 0;
    let paid = 0;
    let overdue = 0;
    for (const d of rows) {
      expected += Number(d.amount);
      collected += paidTotal(d.payments);
      const status = effectiveStatus(d);
      if (status === 'paid') paid += 1;
      else if (status === 'overdue') overdue += 1;
    }
    return { expected, collected, paid, overdue, waiting: rows.length - paid - overdue };
  }, [dues.data]);

  const openTickets = useMemo(
    () => (tickets.data ?? []).filter((x) => x.status !== 'resolved'),
    [tickets.data],
  );
  const unassigned = openTickets.filter((x) => x.assigned_to === null).length;

  const rate = stats.expected > 0 ? Math.min(1, stats.collected / stats.expected) : 0;
  const percent = Math.round(rate * 100);
  const hasDues = (dues.data?.length ?? 0) > 0;

  const refreshing = dues.isRefetching || tickets.isRefetching;
  const refresh = () => {
    void dues.refetch();
    void tickets.refetch();
  };

  const destinations: Destination[] = [
    {
      key: 'dues',
      title: t('dues'),
      subtitle: t('duesSubtitle'),
      symbol: { ios: 'creditcard.fill', android: 'payments' },
      onPress: () => router.push('/(tabs)/(manage)/dues'),
    },
    {
      key: 'generate',
      title: t('generate'),
      subtitle: t('generateSubtitle'),
      symbol: { ios: 'plus.circle.fill', android: 'add_circle' },
      onPress: () => router.push({ pathname: '/generate-dues', params: { period } }),
    },
    {
      key: 'reports',
      title: t('reports'),
      subtitle: t('reportsSubtitle'),
      symbol: { ios: 'chart.bar.fill', android: 'bar_chart' },
      onPress: () => router.push('/(tabs)/(manage)/reports'),
    },
  ];

  return (
    <ScrollView
      {...scrollProps}
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <Enter index={0}>
        <HeroCard symbol={{ ios: 'creditcard.fill', android: 'payments' }}>
          <HeroEyebrow>
            {t('hero.eyebrow', { month: fmt.month(period) }).toLocaleUpperCase(i18n.language)}
          </HeroEyebrow>
          {dues.isPending ? (
            <View style={styles.heroSkeleton}>
              <View style={styles.ghost}>
                <Skeleton width={200} height={40} color={colors.onHero} />
              </View>
              <View style={styles.ghost}>
                <Skeleton width="60%" height={14} color={colors.onHero} />
              </View>
            </View>
          ) : (
            <>
              <HeroFigure style={styles.figure} numberOfLines={1} adjustsFontSizeToFit>
                {fmt.money(stats.collected)}
              </HeroFigure>
              {hasDues ? (
                <>
                  <HeroCaption>{t('hero.of', { amount: fmt.money(stats.expected) })}</HeroCaption>
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <HeroProgress value={rate} accessibilityLabel={t('hero.progress')} />
                    </View>
                    <HeroCaption style={styles.percent}>
                      {t('hero.percent', { value: percent })}
                    </HeroCaption>
                  </View>
                  <HeroCaption style={styles.breakdown}>
                    {t('hero.breakdown', {
                      paid: stats.paid,
                      waiting: stats.waiting,
                      overdue: stats.overdue,
                    })}
                  </HeroCaption>
                </>
              ) : (
                <HeroCaption>{t('hero.empty')}</HeroCaption>
              )}
            </>
          )}
        </HeroCard>
      </Enter>

      <Enter index={1}>
        <View>
          <SectionLabel>{t('overview')}</SectionLabel>
          <View style={styles.tiles}>
            <StatTile
              icon="statusResolved"
              tone="green"
              value={dues.isPending ? '-' : stats.paid}
              label={t('stats.paid')}
              href="/(tabs)/(manage)/dues"
            />
            <StatTile
              icon="clock"
              tone={stats.overdue > 0 ? 'red' : 'neutral'}
              value={dues.isPending ? '-' : stats.overdue}
              label={t('stats.overdue')}
              href="/(tabs)/(manage)/dues"
            />
          </View>
          <View style={[styles.tiles, styles.tilesGap]}>
            <StatTile
              icon="ticket"
              tone="tint"
              value={tickets.isPending ? '-' : openTickets.length}
              label={t('stats.open')}
              href="/(tabs)/(tickets)"
            />
            <StatTile
              icon="unassigned"
              tone={unassigned > 0 ? 'orange' : 'neutral'}
              value={tickets.isPending ? '-' : unassigned}
              label={t('stats.unassigned')}
              href="/(tabs)/(tickets)"
            />
          </View>
        </View>
      </Enter>

      <Enter index={2}>
        <View>
          <SectionLabel>{t('tools')}</SectionLabel>
          <GlassCard padding={0}>
            {destinations.map((item, index) => (
              <PressableRow
                key={item.key}
                title={item.title}
                subtitle={item.subtitle}
                icon={<IconTile symbol={item.symbol} size={44} />}
                tone="default"
                chevron
                onPress={item.onPress}
                last={index === destinations.length - 1}
              />
            ))}
          </GlassCard>
        </View>
      </Enter>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl + space.xl },
  figure: { marginTop: space.xs },
  heroSkeleton: { gap: space.md, marginTop: space.sm },
  ghost: { opacity: 0.2, alignSelf: 'flex-start', width: '100%' },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  progressTrack: { flex: 1 },
  percent: { fontVariant: ['tabular-nums'], minWidth: 36, textAlign: 'right', marginTop: space.lg - 4 },
  breakdown: { marginTop: space.sm },
  tiles: { flexDirection: 'row', gap: space.md },
  tilesGap: { marginTop: space.md },
});
