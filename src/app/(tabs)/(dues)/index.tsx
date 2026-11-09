import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import {
  HeroCaption,
  HeroCard,
  HeroEyebrow,
  HeroFigure,
  HeroProgress,
} from '@/components/HeroCard';
import { Icon } from '@/components/Icon';
import { IconTile, type Tone } from '@/components/IconTile';
import { SectionLabel } from '@/components/SectionLabel';
import { Skeleton } from '@/components/Skeleton';
import { useResidentDues, useResidentSummary } from '@/features/dues/api';
import { DueStatusBadge } from '@/features/dues/components/DueStatusBadge';
import type { DueWithPayments } from '@/features/dues/types';
import { effectiveStatus, remainingOf, useDuesFormat } from '@/features/dues/utils';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

function SummaryCard({ dues }: { dues: DueWithPayments[] | undefined }) {
  const { t, i18n } = useTranslation('dues');
  const colors = useColors();
  const fmt = useDuesFormat();
  const { data } = useResidentSummary();

  const total = dues?.length ?? 0;
  const paidCount = (dues ?? []).filter((d) => d.status === 'paid').length;

  if (!data) {
    return (
      <HeroCard style={styles.summary}>
        <HeroEyebrow>{t('summary.outstanding').toLocaleUpperCase(i18n.language)}</HeroEyebrow>
        <View style={styles.heroSkeleton}>
          <Skeleton width={200} height={40} color={colors.onHero} />
          <Skeleton width="55%" height={14} color={colors.onHero} />
        </View>
      </HeroCard>
    );
  }
  const allPaid = data.outstanding === 0;
  return (
    <HeroCard symbol={{ ios: 'creditcard.fill', android: 'payments' }} style={styles.summary}>
      {allPaid ? (
        <View style={styles.paidRow}>
          <Icon name="check" size={32} color={colors.onHero} />
          <Text
            style={[styles.heroTitle, { color: colors.onHero }]}
            accessibilityRole="header"
            numberOfLines={2}
          >
            {t('summary.allPaid')}
          </Text>
        </View>
      ) : (
        <>
          <HeroEyebrow>{t('summary.outstanding').toLocaleUpperCase(i18n.language)}</HeroEyebrow>
          <HeroFigure
            style={styles.figure}
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {fmt.money(data.outstanding)}
          </HeroFigure>
          {data.overdueCount > 0 ? (
            <HeroCaption style={styles.overdue}>
              {t('summary.overdue', { count: data.overdueCount })}
            </HeroCaption>
          ) : null}
          {data.nextDueDate ? (
            <HeroCaption>{t('summary.nextDue', { date: fmt.date(data.nextDueDate) })}</HeroCaption>
          ) : null}
        </>
      )}
      {total > 0 ? (
        <>
          <HeroProgress value={paidCount / total} accessibilityLabel={t('summary.progress')} />
          <HeroCaption style={styles.progressText}>
            {t('summary.paidPeriods', { paid: paidCount, total })}
          </HeroCaption>
        </>
      ) : null}
    </HeroCard>
  );
}

function DueRow({ due }: { due: DueWithPayments }) {
  const { t } = useTranslation('dues');
  const colors = useColors();
  const fmt = useDuesFormat();
  const status = effectiveStatus(due);
  const lastPayment = due.payments[0];
  const remaining = remainingOf(due);
  const partial = status !== 'paid' && due.payments.length > 0 && remaining > 0;
  const tone: Tone =
    status === 'paid' ? 'green' : status === 'overdue' ? 'red' : partial ? 'orange' : 'neutral';
  return (
    <GlassCard style={styles.row}>
      <IconTile
        name={status === 'paid' ? 'check' : status === 'overdue' ? 'error' : 'clock'}
        tone={tone}
      />
      <View style={styles.rowMain}>
        <Text style={[styles.month, { color: colors.label }]} numberOfLines={1}>
          {fmt.month(due.period)}
        </Text>
        <Text style={[styles.detail, { color: colors.secondaryLabel }]}>
          {t('dueOn', { date: fmt.date(due.due_date) })}
        </Text>
        {status === 'paid' && lastPayment ? (
          <Text style={[styles.detail, { color: colors.secondaryLabel }]}>
            {t('paidOn', {
              date: fmt.date(lastPayment.paid_at),
              method: t(`method.${lastPayment.method as 'cash'}`),
            })}
          </Text>
        ) : null}
        {partial ? (
          <Text style={[styles.detail, { color: colors.orange }]}>
            {t('remaining', { amount: fmt.money(remaining) })}
          </Text>
        ) : null}
      </View>
      <View style={styles.rowEnd}>
        <Text style={[styles.amount, { color: colors.label }]}>
          {fmt.money(Number(due.amount))}
        </Text>
        <DueStatusBadge status={status} />
      </View>
    </GlassCard>
  );
}

export default function DuesScreen() {
  const { t } = useTranslation('dues');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
  const { profile } = useAuth();
  const { data, isLoading, isError, isRefetching, refetch } = useResidentDues();

  const sections = useMemo(() => {
    const byYear = new Map<string, DueWithPayments[]>();
    for (const due of data ?? []) {
      const year = due.period.slice(0, 4);
      byYear.set(year, [...(byYear.get(year) ?? []), due]);
    }
    return [...byYear].map(([title, items]) => ({ title, data: items }));
  }, [data]);

  if (!profile?.unit_id) {
    return (
      <View style={styles.center}>
        <EmptyState icon="dues" title={t('noUnit.title')} message={t('noUnit.message')} />
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="error"
          title={t('error')}
          action={{ title: tc('buttons.retry'), onPress: () => void refetch() }}
        />
      </View>
    );
  }

  return (
    <SectionList
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={<SummaryCard dues={data} />}
      ListFooterComponent={
        <Text style={[styles.info, { color: colors.secondaryLabel }]}>{t('info')}</Text>
      }
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.skeletons}>
            {[0, 1, 2].map((i) => (
              <GlassCard key={i} style={styles.row}>
                <Skeleton width={44} height={44} />
                <View style={styles.rowMain}>
                  <Skeleton width="50%" height={18} />
                  <Skeleton width="35%" height={14} />
                </View>
                <Skeleton width={72} height={18} />
              </GlassCard>
            ))}
          </View>
        ) : (
          <EmptyState icon="dues" title={t('empty.title')} message={t('empty.message')} />
        )
      }
      renderSectionHeader={({ section }) => (
        <SectionLabel style={styles.section}>{section.title}</SectionLabel>
      )}
      renderItem={({ item }) => <DueRow due={item} />}
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.md },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xxl + space.xl,
  },
  summary: { marginBottom: space.sm },
  heroSkeleton: { gap: space.md, marginTop: space.sm, opacity: 0.2 },
  figure: { marginTop: space.xs, marginBottom: space.xs },
  overdue: { fontFamily: type.bodyStrong.fontFamily },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  heroTitle: { ...type.title, flex: 1 },
  progressText: { marginTop: space.sm },
  section: { marginTop: space.xl, marginBottom: 0 },
  skeletons: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowMain: { flex: 1, gap: 2, flexShrink: 1 },
  rowEnd: { alignItems: 'flex-end', gap: space.sm },
  month: { ...type.headline },
  detail: { ...type.caption },
  amount: { ...type.bodyStrong, fontVariant: ['tabular-nums'] },
  info: { ...type.caption, textAlign: 'center', marginTop: space.xl, paddingHorizontal: space.sm },
});
