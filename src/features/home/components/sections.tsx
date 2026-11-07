import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { useLatestAnnouncements } from '@/features/announcements/api';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';
import { useResidentSummary, useManagerDues } from '@/features/dues/api';
import { paidTotal, periodOf, useDuesFormat } from '@/features/dues/utils';
import { useNextReservation } from '@/features/reservations/api';
import { useReservationFormat } from '@/features/reservations/format';
import { useTickets, type TicketListItem } from '@/features/tickets/api';
import { TicketRow } from '@/features/tickets/components/TicketRow';
import { TICKET_STATUSES, type TicketStatus } from '@/features/tickets/types';
import { useAuth } from '@/lib/auth';
import { useColors, useStatusColors } from '@/theme/colors';

import { Muted, SectionHeader, StatTiles, type Tile } from './parts';

const ALL_TICKETS = { status: null, category: null } as const;

function countByStatus(tickets: TicketListItem[]): Record<TicketStatus, number> {
  const counts: Record<TicketStatus, number> = {
    pending: 0,
    in_review: 0,
    in_progress: 0,
    resolved: 0,
  };
  for (const ticket of tickets) counts[ticket.status] += 1;
  return counts;
}

function TicketList({ tickets, showUnit }: { tickets: TicketListItem[]; showUnit: boolean }) {
  const router = useRouter();
  return (
    <View style={styles.list}>
      {tickets.map((ticket) => (
        <TicketRow
          key={ticket.id}
          ticket={ticket}
          showUnit={showUnit}
          onPress={() =>
            router.push({ pathname: '/(tabs)/(tickets)/[id]', params: { id: ticket.id } })
          }
        />
      ))}
    </View>
  );
}

/** Latest announcements (pinned first), shared by every role. */
export function AnnouncementsSection() {
  const { t } = useTranslation('home');
  const router = useRouter();
  const announcements = useLatestAnnouncements(3);
  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('announcements.title')}
        href="/(tabs)/(announcements)"
        linkLabel={t('seeAll')}
      />
      {announcements.isPending ? (
        <ActivityIndicator />
      ) : announcements.isError ? (
        <Muted>{t('errorTitle')}</Muted>
      ) : announcements.data.length === 0 ? (
        <Muted>{t('announcements.none')}</Muted>
      ) : (
        <View style={styles.list}>
          {announcements.data.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onPress={() =>
                router.push({ pathname: '/(tabs)/(announcements)/[id]', params: { id: a.id } })
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function ResidentSections() {
  const { t } = useTranslation('home');
  const colors = useColors();
  const { user } = useAuth();
  const fmt = useDuesFormat();
  const resFmt = useReservationFormat();
  const tickets = useTickets(ALL_TICKETS);
  const summary = useResidentSummary();
  const next = useNextReservation();

  const own = useMemo(
    () => (tickets.data ?? []).filter((x) => x.created_by === user?.id),
    [tickets.data, user?.id],
  );
  const openCount = own.filter((x) => x.status !== 'resolved').length;

  return (
    <>
      <View style={styles.section}>
        <SectionHeader
          title={t('tickets.latest')}
          href="/(tabs)/(tickets)"
          linkLabel={t('seeAll')}
        />
        <StatTiles
          tiles={[
            {
              key: 'open',
              label: t('tickets.open'),
              value: openCount,
              color: colors.orange,
              href: '/(tabs)/(tickets)',
            },
          ]}
        />
        {tickets.isPending ? (
          <ActivityIndicator />
        ) : own.length === 0 ? (
          <Muted>{t('tickets.none')}</Muted>
        ) : (
          <TicketList tickets={own.slice(0, 3)} showUnit={false} />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('dues.title')} href="/(tabs)/(dues)" linkLabel={t('seeAll')} />
        <GlassCard style={styles.cardGap}>
          {summary.isPending ? (
            <ActivityIndicator />
          ) : summary.data ? (
            summary.data.outstanding > 0 ? (
              <>
                <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                  {t('dues.outstanding')}
                </Text>
                <Text style={[styles.big, { color: colors.label }]}>
                  {fmt.money(summary.data.outstanding)}
                </Text>
                {summary.data.overdueCount > 0 ? (
                  <Text style={[styles.caption, { color: colors.red }]}>
                    {t('dues.overdue', { count: summary.data.overdueCount })}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={[styles.body, { color: colors.green }]}>{t('dues.allPaid')}</Text>
            )
          ) : (
            <Muted>{t('dues.noDues')}</Muted>
          )}
        </GlassCard>
      </View>

      <AnnouncementsSection />

      <View style={styles.section}>
        <SectionHeader title={t('reservation.next')} />
        <GlassCard style={styles.cardGap}>
          {next.data ? (
            <>
              <Text style={[styles.body, { color: colors.label }]}>{next.data.areaName}</Text>
              <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                {resFmt.range(next.data.starts_at, next.data.ends_at)}
              </Text>
            </>
          ) : (
            <Muted>{t('reservation.none')}</Muted>
          )}
        </GlassCard>
      </View>
    </>
  );
}

export function ManagerSections() {
  const { t } = useTranslation('home');
  const { t: tt } = useTranslation('tickets');
  const colors = useColors();
  const statusColors = useStatusColors();
  const fmt = useDuesFormat();
  const tickets = useTickets(ALL_TICKETS);
  const dues = useManagerDues(periodOf(new Date()));

  const counts = useMemo(() => countByStatus(tickets.data ?? []), [tickets.data]);
  const unassigned = (tickets.data ?? []).filter(
    (x) => x.assigned_to === null && x.status !== 'resolved',
  ).length;
  const tiles: Tile[] = [
    ...TICKET_STATUSES.map((s) => ({
      key: s,
      label: tt(`status.${s}`),
      value: counts[s],
      color: statusColors[s],
      href: '/(tabs)/(tickets)' as const,
    })),
    {
      key: 'unassigned',
      label: t('tickets.unassigned'),
      value: unassigned,
      color: unassigned > 0 ? colors.red : colors.secondaryLabel,
      href: '/(tabs)/(tickets)' as const,
    },
  ];

  const expected = (dues.data ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  const collected = (dues.data ?? []).reduce((sum, d) => sum + paidTotal(d.payments), 0);

  return (
    <>
      <View style={styles.section}>
        <SectionHeader
          title={t('tickets.byStatus')}
          href="/(tabs)/(tickets)"
          linkLabel={t('seeAll')}
        />
        {tickets.isPending ? <ActivityIndicator /> : <StatTiles tiles={tiles} />}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title={t('dues.monthCollection')}
          href="/(tabs)/(manage)/dues"
          linkLabel={t('seeAll')}
        />
        <GlassCard style={styles.cardGap}>
          {dues.isPending ? (
            <ActivityIndicator />
          ) : (dues.data ?? []).length === 0 ? (
            <Muted>{t('dues.noDues')}</Muted>
          ) : (
            <Text style={[styles.big, { color: colors.label }]}>
              {t('dues.collectedOf', {
                collected: fmt.money(collected),
                expected: fmt.money(expected),
              })}
            </Text>
          )}
        </GlassCard>
      </View>

      <AnnouncementsSection />
    </>
  );
}

export function TechnicianSections() {
  const { t } = useTranslation('home');
  const { t: tt } = useTranslation('tickets');
  const statusColors = useStatusColors();
  const { user } = useAuth();
  const tickets = useTickets(ALL_TICKETS);

  const assigned = useMemo(
    () => (tickets.data ?? []).filter((x) => x.assigned_to === user?.id),
    [tickets.data, user?.id],
  );
  const counts = useMemo(() => countByStatus(assigned), [assigned]);
  const active = assigned.filter((x) => x.status === 'in_progress' || x.status === 'in_review');
  const tiles: Tile[] = TICKET_STATUSES.filter((s) => s !== 'resolved').map((s) => ({
    key: s,
    label: tt(`status.${s}`),
    value: counts[s],
    color: statusColors[s],
    href: '/(tabs)/(tickets)' as const,
  }));

  return (
    <>
      <View style={styles.section}>
        <SectionHeader
          title={t('tickets.assignedOpen')}
          href="/(tabs)/(tickets)"
          linkLabel={t('seeAll')}
        />
        {tickets.isPending ? <ActivityIndicator /> : <StatTiles tiles={tiles} />}
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('tickets.inProgressList')} />
        {tickets.isPending ? null : active.length === 0 ? (
          <Muted>{t('tickets.noneActive')}</Muted>
        ) : (
          <TicketList tickets={active} showUnit />
        )}
      </View>

      <AnnouncementsSection />
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  list: { gap: 10 },
  cardGap: { gap: 4 },
  big: { fontSize: 24, fontWeight: '700' },
  body: { fontSize: 17, fontWeight: '600' },
  caption: { fontSize: 14 },
});
