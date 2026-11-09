import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Icon } from '@/components/Icon';
import { SectionLabel } from '@/components/SectionLabel';
import { Skeleton } from '@/components/Skeleton';
import { useResidentDues, useResidentSummary } from '@/features/dues/api';
import { DueStatusBadge } from '@/features/dues/components/DueStatusBadge';
import type { DueWithPayments } from '@/features/dues/types';
import { effectiveStatus, remainingOf, useDuesFormat } from '@/features/dues/utils';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

function SummaryCard() {
  const { t } = useTranslation('dues');
  const colors = useColors();
  const fmt = useDuesFormat();
  const { data } = useResidentSummary();
  if (!data) {
    return (
      <GlassCard variant="tint" style={styles.summary}>
        <Skeleton width={120} height={14} />
        <Skeleton width={180} height={40} />
      </GlassCard>
    );
  }
  const allPaid = data.outstanding === 0;
  return (
    <GlassCard variant="tint" padding={space.xl} style={styles.summary}>
      {allPaid ? (
        <>
          <Icon name="check" size={32} color={colors.onTint} />
          <Text style={[styles.heroTitle, { color: colors.onTint }]} accessibilityRole="header">
            {t('summary.allPaid')}
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.heroCaption, { color: colors.onTint }]}>
            {t('summary.outstanding')}
          </Text>
          <Text style={[styles.total, { color: colors.onTint }]} accessibilityRole="header">
            {fmt.money(data.outstanding)}
          </Text>
          {data.overdueCount > 0 ? (
            <Text style={[styles.heroLine, { color: colors.onTint }]}>
              {t('summary.overdue', { count: data.overdueCount })}
            </Text>
          ) : null}
          {data.nextDueDate ? (
            <Text style={[styles.heroCaption, { color: colors.onTint }]}>
              {t('summary.nextDue', { date: fmt.date(data.nextDueDate) })}
            </Text>
          ) : null}
        </>
      )}
    </GlassCard>
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
  return (
    <GlassCard style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={[styles.month, { color: colors.label }]}>{fmt.month(due.period)}</Text>
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
          <Text style={[styles.detail, { color: colors.secondaryLabel }]}>
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
      ListHeaderComponent={<SummaryCard />}
      ListFooterComponent={
        <Text style={[styles.info, { color: colors.secondaryLabel }]}>{t('info')}</Text>
      }
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.skeletons}>
            {[0, 1, 2].map((i) => (
              <GlassCard key={i} style={styles.row}>
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
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  summary: { gap: space.xs, marginTop: space.sm, marginBottom: space.sm },
  heroCaption: { ...type.small },
  heroLine: { ...type.bodyStrong },
  heroTitle: { ...type.title, marginTop: space.xs },
  total: { ...type.hero, fontVariant: ['tabular-nums'] },
  section: { marginTop: space.xl, marginBottom: 0 },
  skeletons: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.md, justifyContent: 'space-between' },
  rowMain: { flex: 1, gap: space.xs },
  rowEnd: { alignItems: 'flex-end', gap: space.sm },
  month: { ...type.headline },
  detail: { ...type.caption },
  amount: { ...type.bodyStrong, fontVariant: ['tabular-nums'] },
  info: { ...type.caption, textAlign: 'center', marginTop: space.xl, paddingHorizontal: space.sm },
});
