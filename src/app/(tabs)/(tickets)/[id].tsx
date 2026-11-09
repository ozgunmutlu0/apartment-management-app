import { MenuView, type MenuAction } from '@expo/ui/community/menu';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthField } from '@/components/AuthField';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { IconTile } from '@/components/IconTile';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionLabel } from '@/components/SectionLabel';
import { Skeleton } from '@/components/Skeleton';
import {
  errorMessage,
  useAddTicketNote,
  useAssignTicket,
  useTechnicians,
  useTicket,
  useTicketsRealtime,
  useUpdateTicketStatus,
} from '@/features/tickets/api';
import { CATEGORY_ICONS } from '@/features/tickets/components/CategoryIcon';
import { PhotoGrid } from '@/features/tickets/components/PhotoGrid';
import { StatusBadge } from '@/features/tickets/components/StatusBadge';
import { Timeline } from '@/features/tickets/components/Timeline';
import { formatDateTime, formatRelative, unitLabel } from '@/features/tickets/format';
import { TICKET_STATUSES, type TicketStatus } from '@/features/tickets/types';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';
import { hitTarget, radius, space, type } from '@/theme/tokens';

const NO_ASSIGNEE = 'none';

export default function TicketDetailScreen() {
  const { t } = useTranslation('tickets');
  const { t: tc } = useTranslation('common');
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuth();
  const ticketQuery = useTicket(id);
  useTicketsRealtime();

  const isManager = role === 'manager';
  const isTechnician = role === 'technician';
  const technicians = useTechnicians(isManager);
  const updateStatus = useUpdateTicketStatus();
  const assign = useAssignTicket();
  const addNote = useAddTicketNote();
  const [note, setNote] = useState('');

  const ticket = ticketQuery.data;

  if (ticketQuery.isPending) {
    return (
      <View style={[styles.content, styles.fill, { backgroundColor: colors.systemGroupedBackground }]}>
        <View style={styles.headerRow}>
          <Skeleton width={56} height={56} />
          <View style={styles.headerText}>
            <Skeleton width="80%" height={22} />
            <Skeleton width={96} height={24} radius={radius.pill} />
          </View>
        </View>
        <GlassCard style={styles.card}>
          <Skeleton width="100%" height={16} />
          <Skeleton width="90%" height={16} />
          <Skeleton width="60%" height={16} />
        </GlassCard>
      </View>
    );
  }
  if (ticketQuery.isError || !ticket) {
    return (
      <View style={[styles.center, { backgroundColor: colors.systemGroupedBackground }]}>
        <EmptyState
          icon="error"
          title={ticketQuery.isError ? t('detail.errorTitle') : t('detail.notFound')}
          action={
            ticketQuery.isError
              ? { title: tc('buttons.retry'), onPress: () => void ticketQuery.refetch() }
              : undefined
          }
        />
      </View>
    );
  }

  const fail = (error: unknown) =>
    Alert.alert(t('errors.title'), errorMessage(error) ?? t('errors.generic'));

  const allowedStatuses = TICKET_STATUSES.filter((s) => !isTechnician || s !== 'pending');
  const statusActions: MenuAction[] = allowedStatuses.map((s) => ({
    id: s,
    title: t(`status.${s}`),
    state: s === ticket.status ? 'on' : 'off',
  }));
  const assignActions: MenuAction[] = [
    ...(technicians.data ?? []).map((tech) => ({
      id: tech.id,
      title: tech.full_name,
      state: tech.id === ticket.assigned_to ? ('on' as const) : ('off' as const),
    })),
    ...(ticket.assigned_to
      ? [
          {
            id: NO_ASSIGNEE,
            title: t('detail.removeAssignee'),
            attributes: { destructive: true },
          },
        ]
      : []),
  ];

  const onChangeStatus = (status: TicketStatus) => {
    if (status === ticket.status) return;
    updateStatus.mutate(
      { ticketId: ticket.id, status, note },
      { onSuccess: () => setNote(''), onError: fail },
    );
  };

  const onAssign = (technicianId: string) => {
    assign.mutate(
      { ticketId: ticket.id, technicianId: technicianId === NO_ASSIGNEE ? null : technicianId },
      { onError: fail },
    );
  };

  const onAddNote = () => {
    if (!note.trim()) return;
    addNote.mutate({ ticketId: ticket.id, note }, { onSuccess: () => setNote(''), onError: fail });
  };

  const busy = updateStatus.isPending || assign.isPending || addNote.isPending;
  const canAct = isManager || isTechnician;
  const unit = unitLabel(ticket.unit);

  return (
    <>
      <Stack.Screen options={{ title: ticket.title }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
        style={{ backgroundColor: colors.systemGroupedBackground }}
        refreshControl={
          <RefreshControl
            refreshing={ticketQuery.isRefetching}
            onRefresh={() => void ticketQuery.refetch()}
          />
        }
      >
        <View style={styles.headerRow}>
          <IconTile symbol={CATEGORY_ICONS[ticket.category]} size={56} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.label }]}>{ticket.title}</Text>
            <View style={styles.metaRow}>
              <StatusBadge status={ticket.status} />
              <Text style={[styles.meta, { color: colors.secondaryLabel }]}>
                {formatRelative(ticket.created_at)}
                {unit ? ` · ${t('unit', { label: unit })}` : ''}
              </Text>
            </View>
          </View>
        </View>

        <View>
          <SectionLabel>{t('detail.description')}</SectionLabel>
          <GlassCard>
            <Text style={[styles.value, { color: colors.label }]}>
              {ticket.description || t('detail.noDescription')}
            </Text>
          </GlassCard>
        </View>

        {ticket.photos.length > 0 ? (
          <View>
            <SectionLabel>{t('detail.photos')}</SectionLabel>
            <PhotoGrid
              photos={ticket.photos.map((p) => ({ key: p.id, uri: p.url }))}
              onPress={(index) =>
                router.push({
                  pathname: '/(tabs)/(tickets)/photo',
                  params: { id: ticket.id, index: String(index) },
                })
              }
            />
          </View>
        ) : null}

        <View>
          <SectionLabel>{t('detail.details')}</SectionLabel>
          <GlassCard style={styles.card}>
            <Field label={t('detail.category')} value={t(`category.${ticket.category}`)} />
            <Field label={t('detail.priority')} value={t(`priority.${ticket.priority}`)} />
            <Field
              label={t('detail.createdBy')}
              value={[ticket.creatorName, unit ? t('unit', { label: unit }) : null]
                .filter(Boolean)
                .join(' · ')}
            />
            <Field
              label={t('detail.assignedTo')}
              value={ticket.assigneeName ?? t('detail.unassigned')}
            />
            <Field label={t('detail.createdAt')} value={formatDateTime(ticket.created_at)} />
            <Field label={t('detail.updatedAt')} value={formatDateTime(ticket.updated_at)} />
            {ticket.resolved_at ? (
              <Field label={t('detail.resolvedAt')} value={formatDateTime(ticket.resolved_at)} />
            ) : null}
          </GlassCard>
        </View>

        {canAct ? (
          <View>
            <SectionLabel>{t('detail.actions')}</SectionLabel>
            <GlassCard style={styles.card}>
              <AuthField
                value={note}
                onChangeText={setNote}
                placeholder={t('detail.notePlaceholder')}
                multiline
                maxLength={2000}
                style={styles.noteInput}
                textAlignVertical="top"
              />
              <PrimaryButton
                title={t('detail.addNote')}
                loading={busy}
                disabled={!note.trim()}
                onPress={onAddNote}
              />
              <View style={styles.actionRow}>
                <MenuView
                  title={t('detail.changeStatus')}
                  actions={statusActions}
                  onPressAction={({ nativeEvent }) =>
                    onChangeStatus(nativeEvent.event as TicketStatus)
                  }
                >
                  <ActionLabel text={t('detail.changeStatus')} />
                </MenuView>
                {isManager ? (
                  <MenuView
                    title={t('detail.assign')}
                    actions={
                      assignActions.length > 0
                        ? assignActions
                        : [
                            {
                              id: 'empty',
                              title: t('detail.noTechnicians'),
                              attributes: { disabled: true },
                            },
                          ]
                    }
                    onPressAction={({ nativeEvent }) => onAssign(nativeEvent.event)}
                  >
                    <ActionLabel text={t('detail.assign')} />
                  </MenuView>
                ) : null}
              </View>
            </GlassCard>
          </View>
        ) : null}

        <View>
          <SectionLabel>{t('detail.timeline')}</SectionLabel>
          <GlassCard>
            <Timeline events={ticket.events} />
          </GlassCard>
        </View>
      </ScrollView>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.secondaryLabel }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.label }]}>{value}</Text>
    </View>
  );
}

function ActionLabel({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View style={[styles.actionButton, { backgroundColor: colors.tintSoft }]}>
      <Text style={[styles.actionText, { color: colors.tint }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  content: { padding: space.lg, gap: space.xl },
  card: { gap: space.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headerText: { flex: 1, gap: space.sm },
  title: { ...type.title },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm },
  meta: { ...type.caption },
  field: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  fieldLabel: { ...type.small },
  fieldValue: { ...type.small, flexShrink: 1, textAlign: 'right' },
  value: { ...type.body },
  noteInput: { minHeight: 96, paddingTop: space.md },
  actionRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  actionButton: {
    minHeight: hitTarget,
    paddingHorizontal: space.lg,
    borderRadius: radius.control,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { ...type.bodyStrong },
});
