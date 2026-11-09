import { Link, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import {
  HeroCaption,
  HeroCard,
  HeroEyebrow,
  HeroFigure,
  HeroProgress,
} from '@/components/HeroCard';
import { ICONS, Icon } from '@/components/Icon';
import { IconTile, type Tone } from '@/components/IconTile';
import { PressableScale } from '@/components/PressableScale';
import { useLatestAnnouncements } from '@/features/announcements/api';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';
import { useManagerDues, useResidentSummary } from '@/features/dues/api';
import { paidTotal, periodOf, useDuesFormat } from '@/features/dues/utils';
import { useNextReservation } from '@/features/reservations/api';
import { useReservationFormat } from '@/features/reservations/format';
import { useTickets, type TicketListItem } from '@/features/tickets/api';
import { TicketRow } from '@/features/tickets/components/TicketRow';
import { TICKET_STATUSES, type TicketStatus } from '@/features/tickets/types';
import { useAuth } from '@/lib/auth';
import { useColors, useStatusColors } from '@/theme/colors';
import { elevation, radius, space, type } from '@/theme/tokens';

import {
  DistributionBar,
  HeroChip,
  HeroSkeleton,
  ListSkeleton,
  Muted,
  Reveal,
  SectionHeader,
  StatGrid,
  StatGridSkeleton,
  type Tile,
} from './parts';

const ALL_TICKETS = { status: null, category: null } as const;

const STATUS_TONE: Record<TicketStatus, Tone> = {
  pending: 'neutral',
  in_review: 'blue',
  in_progress: 'orange',
  resolved: 'green',
};

const STATUS_ICON = {
  pending: 'statusPending',
  in_review: 'statusInReview',
  in_progress: 'statusInProgress',
  resolved: 'statusResolved',
} as const;

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

/** Status distribution bar + 2-column stat grid, shared by manager and technician. */
function StatusOverview({
  counts,
  statuses,
  loading,
}: {
  counts: Record<TicketStatus, number>;
  statuses: readonly TicketStatus[];
  loading: boolean;
}) {
  const { t } = useTranslation('home');
  const { t: tt } = useTranslation('tickets');
  const statusColors = useStatusColors();

  const total = statuses.reduce((sum, s) => sum + counts[s], 0);
  const tiles: Tile[] = statuses.map((s) => ({
    key: s,
    label: tt(`status.${s}`),
    value: counts[s],
    tone: STATUS_TONE[s],
    icon: STATUS_ICON[s],
    href: '/(tabs)/(tickets)' as const,
  }));
  const summary = statuses.map((s) => `${tt(`status.${s}`)} ${counts[s]}`).join(', ');

  return (
    <View style={styles.sectionBody}>
      {loading ? null : total > 0 ? (
        <DistributionBar
          label={t('tickets.distributionLabel', { summary })}
          segments={statuses.map((s) => ({ key: s, count: counts[s], color: statusColors[s] }))}
        />
      ) : null}
      {loading ? <StatGridSkeleton count={statuses.length} /> : <StatGrid tiles={tiles} />}
    </View>
  );
}

/** Latest announcements (pinned first), shared by every role. */
export function AnnouncementsSection({ index }: { index: number }) {
  const { t } = useTranslation('home');
  const router = useRouter();
  const announcements = useLatestAnnouncements(3);
  return (
    <Reveal index={index}>
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
    </Reveal>
  );
}

export function ResidentHero() {
  const { t } = useTranslation('home');
  const colors = useColors();
  const { user } = useAuth();
  const fmt = useDuesFormat();
  const tickets = useTickets(ALL_TICKETS);
  const summary = useResidentSummary();

  const openCount = (tickets.data ?? []).filter(
    (x) => x.created_by === user?.id && x.status !== 'resolved',
  ).length;
  const data = summary.data;
  const ticketsLine = tickets.isPending ? null : t('tickets.openCount', { count: openCount });
  const outstanding = !!data && data.outstanding > 0;
  const caption = [
    outstanding && data.overdueCount > 0 && t('dues.overdue', { count: data.overdueCount }),
    ticketsLine,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <HeroCard symbol={ICONS.dues}>
      {summary.isPending ? (
        <HeroSkeleton />
      ) : (
        <View style={styles.heroBody}>
          <HeroEyebrow>{t('dues.title')}</HeroEyebrow>
          {!data ? (
            <HeroFigure style={type.stat} numberOfLines={2}>
              {t('dues.noDues')}
            </HeroFigure>
          ) : outstanding ? (
            <>
              <HeroFigure adjustsFontSizeToFit numberOfLines={1}>
                {fmt.money(data.outstanding)}
              </HeroFigure>
              {caption ? <HeroCaption>{caption}</HeroCaption> : null}
              <Link href="/(tabs)/(dues)" asChild>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={t('dues.view')}
                  style={StyleSheet.flatten([styles.pill, { backgroundColor: colors.onHero }])}
                >
                  <Text style={[styles.pillText, { color: colors.hero }]}>{t('dues.view')}</Text>
                  <Icon name="chevron" size={14} color={colors.hero} />
                </PressableScale>
              </Link>
            </>
          ) : (
            <>
              <View style={styles.paidRow}>
                <Icon name="check" size={32} color={colors.onHero} />
                <HeroFigure style={[type.stat, styles.paidText]} numberOfLines={2}>
                  {t('dues.allPaid')}
                </HeroFigure>
              </View>
              {caption ? <HeroCaption>{caption}</HeroCaption> : null}
            </>
          )}
        </View>
      )}
    </HeroCard>
  );
}

export function ManagerHero() {
  const { t } = useTranslation('home');
  const fmt = useDuesFormat();
  const colors = useColors();
  const tickets = useTickets(ALL_TICKETS);
  const dues = useManagerDues(periodOf(new Date()));

  const expected = (dues.data ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  const collected = (dues.data ?? []).reduce((sum, d) => sum + paidTotal(d.payments), 0);
  const ratio = expected > 0 ? collected / expected : 0;
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const open = (tickets.data ?? []).filter((x) => x.status !== 'resolved');
  const unassigned = open.filter((x) => x.assigned_to === null).length;
  const hasDues = (dues.data ?? []).length > 0;

  return (
    <HeroCard symbol={ICONS.reports}>
      {dues.isPending ? (
        <HeroSkeleton />
      ) : (
        <View style={styles.heroBody}>
          <HeroEyebrow>{t('dues.monthCollection')}</HeroEyebrow>
          {hasDues ? (
            <>
              <HeroFigure adjustsFontSizeToFit numberOfLines={1}>
                {fmt.money(collected)}
              </HeroFigure>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <HeroProgress value={ratio} accessibilityLabel={t('dues.monthCollection')} />
                </View>
                <Text style={[styles.percent, { color: colors.onHero }]}>
                  {t('dues.percent', { value: percent })}
                </Text>
              </View>
              <HeroCaption>{t('dues.ofExpected', { expected: fmt.money(expected) })}</HeroCaption>
            </>
          ) : (
            <HeroFigure style={type.stat} numberOfLines={2}>
              {t('dues.noDues')}
            </HeroFigure>
          )}
          {tickets.isPending ? null : (
            <View style={styles.chips}>
              <HeroChip
                icon="unassigned"
                value={unassigned}
                label={t('chips.unassigned')}
                href="/(tabs)/(tickets)"
              />
              <HeroChip
                icon="checklist"
                value={open.length}
                label={t('chips.open')}
                href="/(tabs)/(tickets)"
              />
            </View>
          )}
        </View>
      )}
    </HeroCard>
  );
}

export function TechnicianHero() {
  const { t } = useTranslation('home');
  const { t: tt } = useTranslation('tickets');
  const { user } = useAuth();
  const tickets = useTickets(ALL_TICKETS);

  const assigned = (tickets.data ?? []).filter((x) => x.assigned_to === user?.id);
  const inProgress = assigned.filter((x) => x.status === 'in_progress').length;
  const inReview = assigned.filter((x) => x.status === 'in_review').length;
  const open = assigned.filter((x) => x.status !== 'resolved').length;

  return (
    <HeroCard symbol={ICONS.ticket}>
      {tickets.isPending ? (
        <HeroSkeleton />
      ) : (
        <View style={styles.heroBody}>
          <HeroEyebrow>{t('hero.activeJobs')}</HeroEyebrow>
          <HeroFigure adjustsFontSizeToFit numberOfLines={1}>
            {inProgress + inReview}
          </HeroFigure>
          <HeroCaption>{t('tickets.openCount', { count: open })}</HeroCaption>
          <View style={styles.chips}>
            <HeroChip
              icon="statusInProgress"
              value={inProgress}
              label={tt('status.in_progress')}
              href="/(tabs)/(tickets)"
            />
            <HeroChip
              icon="statusInReview"
              value={inReview}
              label={tt('status.in_review')}
              href="/(tabs)/(tickets)"
            />
          </View>
        </View>
      )}
    </HeroCard>
  );
}

export function ResidentSections({ startIndex }: { startIndex: number }) {
  const { t } = useTranslation('home');
  const colors = useColors();
  const dark = useColorScheme() === 'dark';
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
      <Reveal index={startIndex}>
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
      </Reveal>

      <Reveal index={startIndex + 1}>
        <View style={styles.section}>
          <SectionHeader
            title={t('reservation.next')}
            href="/(tabs)/(profile)/reservations"
            linkLabel={t('seeAll')}
          />
          {next.isPending ? (
            <ListSkeleton rows={1} />
          ) : next.data ? (
            <Link href="/(tabs)/(profile)/reservations" asChild>
              <PressableScale
                accessibilityRole="button"
                style={StyleSheet.flatten([
                  styles.reservation,
                  { backgroundColor: colors.secondarySystemGroupedBackground },
                  dark
                    ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }
                    : elevation.card,
                ])}
              >
                <IconTile name="calendar" />
                <View style={styles.reservationText}>
                  <Text style={[styles.body, { color: colors.label }]}>{next.data.areaName}</Text>
                  <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                    {resFmt.range(next.data.starts_at, next.data.ends_at)}
                  </Text>
                </View>
                <Icon name="chevron" size={14} color={colors.tertiaryLabel} />
              </PressableScale>
            </Link>
          ) : (
            <Muted>{t('reservation.none')}</Muted>
          )}
        </View>
      </Reveal>

      <AnnouncementsSection index={startIndex + 2} />
    </>
  );
}

export function ManagerSections({ startIndex }: { startIndex: number }) {
  const { t } = useTranslation('home');
  const colors = useColors();
  const tickets = useTickets(ALL_TICKETS);

  const list = useMemo(() => tickets.data ?? [], [tickets.data]);
  const counts = useMemo(() => countByStatus(list), [list]);
  const unassigned = list.filter((x) => x.assigned_to === null && x.status !== 'resolved').length;

  return (
    <>
      <Reveal index={startIndex}>
        <View style={styles.section}>
          <SectionHeader
            title={t('tickets.byStatus')}
            href="/(tabs)/(tickets)"
            linkLabel={t('seeAll')}
          />
          <StatusOverview counts={counts} statuses={TICKET_STATUSES} loading={tickets.isPending} />
          {unassigned > 0 ? (
            <Link href="/(tabs)/(tickets)" asChild>
              <PressableScale
                accessibilityRole="link"
                style={StyleSheet.flatten([styles.banner, { backgroundColor: colors.redSoft }])}
              >
                <IconTile name="unassigned" size={36} tone="red" solid />
                <Text style={[styles.bannerText, { color: colors.red }]}>
                  {t('tickets.unassignedCount', { count: unassigned })}
                </Text>
                <Icon name="chevron" size={14} color={colors.red} />
              </PressableScale>
            </Link>
          ) : null}
        </View>
      </Reveal>

      <Reveal index={startIndex + 1}>
        <View style={styles.section}>
          <SectionHeader
            title={t('tickets.recent')}
            href="/(tabs)/(tickets)"
            linkLabel={t('seeAll')}
          />
          {tickets.isPending ? (
            <ListSkeleton rows={2} />
          ) : list.length === 0 ? (
            <Muted>{t('tickets.noneAll')}</Muted>
          ) : (
            <TicketList tickets={list.slice(0, 3)} showUnit />
          )}
        </View>
      </Reveal>

      <AnnouncementsSection index={startIndex + 2} />
    </>
  );
}

export function TechnicianSections({ startIndex }: { startIndex: number }) {
  const { t } = useTranslation('home');
  const { user } = useAuth();
  const tickets = useTickets(ALL_TICKETS);

  const assigned = useMemo(
    () => (tickets.data ?? []).filter((x) => x.assigned_to === user?.id),
    [tickets.data, user?.id],
  );
  const counts = useMemo(() => countByStatus(assigned), [assigned]);
  const active = assigned.filter((x) => x.status === 'in_progress' || x.status === 'in_review');

  return (
    <>
      <Reveal index={startIndex}>
        <View style={styles.section}>
          <SectionHeader
            title={t('tickets.assignedOpen')}
            href="/(tabs)/(tickets)"
            linkLabel={t('seeAll')}
          />
          <StatusOverview
            counts={counts}
            statuses={TICKET_STATUSES.filter((s) => s !== 'resolved')}
            loading={tickets.isPending}
          />
        </View>
      </Reveal>

      <Reveal index={startIndex + 1}>
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
      </Reveal>

      <AnnouncementsSection index={startIndex + 2} />
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  sectionBody: { gap: space.md },
  list: { gap: space.md },
  heroBody: { gap: space.xs },
  progressRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  progressTrack: { flex: 1 },
  percent: { ...type.label, marginBottom: -5, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.pill,
  },
  pillText: { ...type.bodyStrong },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  paidText: { flex: 1 },
  reservation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  reservationText: { flex: 1, gap: space.xs },
  body: { ...type.bodyStrong },
  caption: { ...type.small },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  bannerText: { ...type.bodyStrong, flex: 1 },
});
