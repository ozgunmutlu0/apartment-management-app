import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { IconTile } from '@/components/IconTile';
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
import { space, type } from '@/theme/tokens';

import {
  HeroCard,
  ListSkeleton,
  Muted,
  SectionHeader,
  StatTiles,
  StatTilesSkeleton,
  type Tile,
} from './parts';

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
        <ListSkeleton rows={2} />
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

function joinParts(parts: (string | null | false)[]): string | null {
  const filtered = parts.filter(Boolean) as string[];
  return filtered.length > 0 ? filtered.join(' · ') : null;
}

export function ResidentHero({ context }: { context: string | null }) {
  const { t } = useTranslation('home');
  const { user } = useAuth();
  const fmt = useDuesFormat();
  const tickets = useTickets(ALL_TICKETS);
  const summary = useResidentSummary();

  const openCount = (tickets.data ?? []).filter(
    (x) => x.created_by === user?.id && x.status !== 'resolved',
  ).length;
  const data = summary.data;
  const ticketsLine = tickets.isPending ? null : t('tickets.openCount', { count: openCount });

  if (summary.isPending) return <HeroCard context={context} loading />;
  if (!data) {
    return (
      <HeroCard
        context={context}
        figure={t('dues.noDues')}
        figureIsMessage
        secondary={ticketsLine}
      />
    );
  }
  if (data.outstanding > 0) {
    return (
      <HeroCard
        context={context}
        caption={t('dues.outstanding')}
        figure={fmt.money(data.outstanding)}
        secondary={joinParts([
          data.overdueCount > 0 && t('dues.overdue', { count: data.overdueCount }),
          ticketsLine,
        ])}
      />
    );
  }
  return (
    <HeroCard
      context={context}
      figure={t('dues.allPaid')}
      figureIsMessage
      secondary={ticketsLine}
    />
  );
}

export function ManagerHero({ context }: { context: string | null }) {
  const { t } = useTranslation('home');
  const fmt = useDuesFormat();
  const tickets = useTickets(ALL_TICKETS);
  const dues = useManagerDues(periodOf(new Date()));

  const expected = (dues.data ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  const collected = (dues.data ?? []).reduce((sum, d) => sum + paidTotal(d.payments), 0);
  const unassigned = (tickets.data ?? []).filter(
    (x) => x.assigned_to === null && x.status !== 'resolved',
  ).length;
  const unassignedLine = tickets.isPending
    ? null
    : t('tickets.unassignedCount', { count: unassigned });

  if (dues.isPending) return <HeroCard context={context} loading />;
  if ((dues.data ?? []).length === 0) {
    return (
      <HeroCard
        context={context}
        caption={t('dues.monthCollection')}
        figure={t('dues.noDues')}
        figureIsMessage
        secondary={unassignedLine}
      />
    );
  }
  return (
    <HeroCard
      context={context}
      caption={t('dues.monthCollection')}
      figure={fmt.money(collected)}
      progress={expected > 0 ? collected / expected : 0}
      secondary={joinParts([
        t('dues.ofExpected', { expected: fmt.money(expected) }),
        unassignedLine,
      ])}
    />
  );
}

export function TechnicianHero({ context }: { context: string | null }) {
  const { t } = useTranslation('home');
  const { user } = useAuth();
  const tickets = useTickets(ALL_TICKETS);

  if (tickets.isPending) return <HeroCard context={context} loading />;
  const assigned = (tickets.data ?? []).filter((x) => x.assigned_to === user?.id);
  const active = assigned.filter((x) => x.status === 'in_progress' || x.status === 'in_review');
  const open = assigned.filter((x) => x.status !== 'resolved');
  return (
    <HeroCard
      context={context}
      caption={t('hero.activeJobs')}
      figure={String(active.length)}
      secondary={t('tickets.openCount', { count: open.length })}
    />
  );
}

export function ResidentSections() {
  const { t } = useTranslation('home');
  const colors = useColors();
  const { user } = useAuth();
  const resFmt = useReservationFormat();
  const tickets = useTickets(ALL_TICKETS);
  const next = useNextReservation();

  const own = useMemo(
    () => (tickets.data ?? []).filter((x) => x.created_by === user?.id),
    [tickets.data, user?.id],
  );

  return (
    <>
      <View style={styles.section}>
        <SectionHeader
          title={t('tickets.latest')}
          href="/(tabs)/(tickets)"
          linkLabel={t('seeAll')}
        />
        {tickets.isPending ? (
          <ListSkeleton rows={2} />
        ) : own.length === 0 ? (
          <Muted>{t('tickets.none')}</Muted>
        ) : (
          <TicketList tickets={own.slice(0, 3)} showUnit={false} />
        )}
      </View>

      <AnnouncementsSection />

      <View style={styles.section}>
        <SectionHeader title={t('reservation.next')} />
        {next.isPending ? (
          <ListSkeleton rows={1} />
        ) : next.data ? (
          <GlassCard padding={space.lg} style={styles.reservation}>
            <IconTile name="reservation" />
            <View style={styles.reservationText}>
              <Text style={[styles.body, { color: colors.label }]}>{next.data.areaName}</Text>
              <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                {resFmt.range(next.data.starts_at, next.data.ends_at)}
              </Text>
            </View>
          </GlassCard>
        ) : (
          <Muted>{t('reservation.none')}</Muted>
        )}
      </View>
    </>
  );
}

export function ManagerSections() {
  const { t } = useTranslation('home');
  const { t: tt } = useTranslation('tickets');
  const statusColors = useStatusColors();
  const tickets = useTickets(ALL_TICKETS);

  const counts = useMemo(() => countByStatus(tickets.data ?? []), [tickets.data]);
  const tiles: Tile[] = TICKET_STATUSES.map((s) => ({
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
          title={t('tickets.byStatus')}
          href="/(tabs)/(tickets)"
          linkLabel={t('seeAll')}
        />
        {tickets.isPending ? <StatTilesSkeleton count={4} /> : <StatTiles tiles={tiles} />}
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
        {tickets.isPending ? <StatTilesSkeleton count={3} /> : <StatTiles tiles={tiles} />}
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('tickets.inProgressList')} />
        {tickets.isPending ? (
          <ListSkeleton rows={2} />
        ) : active.length === 0 ? (
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
  section: { gap: space.md },
  list: { gap: space.md },
  reservation: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  reservationText: { flex: 1, gap: space.xs },
  body: { ...type.bodyStrong },
  caption: { ...type.small },
});
