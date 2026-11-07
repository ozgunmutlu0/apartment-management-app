import { MenuView, type MenuAction } from '@expo/ui/community/menu';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthField } from '@/components/AuthField';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  errorMessage,
  useAddTicketNote,
  useAssignTicket,
  useTechnicians,
  useTicket,
  useTicketsRealtime,
  useUpdateTicketStatus,
} from '@/features/tickets/api';
import { CategoryIcon } from '@/features/tickets/components/CategoryIcon';
import { PhotoGrid } from '@/features/tickets/components/PhotoGrid';
import { StatusBadge } from '@/features/tickets/components/StatusBadge';
import { Timeline } from '@/features/tickets/components/Timeline';
import { formatDateTime, unitLabel } from '@/features/tickets/format';
import { TICKET_STATUSES, type TicketStatus } from '@/features/tickets/types';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';

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
    return <ActivityIndicator style={styles.loading} />;
  }
  if (ticketQuery.isError || !ticket) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="error"
          title={ticketQuery.isError ? t('detail.errorTitle') : t('detail.notFound')}
        />
        {ticketQuery.isError ? (
          <PrimaryButton title={tc('buttons.retry')} onPress={() => void ticketQuery.refetch()} />
        ) : null}
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
  const labelStyle = [styles.label, { color: colors.secondaryLabel }];
  const valueStyle = [styles.value, { color: colors.label }];

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
        <GlassCard style={styles.card}>
          <View style={styles.headerRow}>
            <CategoryIcon category={ticket.category} size={32} />
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.label }]}>{ticket.title}</Text>
              <StatusBadge status={ticket.status} />
            </View>
          </View>
          <Field label={t('detail.category')} value={t(`category.${ticket.category}`)} />
          <Field label={t('detail.priority')} value={t(`priority.${ticket.priority}`)} />
          <Field
            label={t('detail.createdBy')}
            value={[ticket.creatorName, unit ? t('unit', { label: unit }) : null]
              .filter(Boolean)
              .join(' · ')}
          />
          <Field label={t('detail.assignedTo')} value={ticket.assigneeName ?? t('detail.unassigned')} />
          <Field label={t('detail.createdAt')} value={formatDateTime(ticket.created_at)} />
          <Field label={t('detail.updatedAt')} value={formatDateTime(ticket.updated_at)} />
          {ticket.resolved_at ? (
            <Field label={t('detail.resolvedAt')} value={formatDateTime(ticket.resolved_at)} />
          ) : null}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={labelStyle}>{t('detail.description')}</Text>
          <Text style={valueStyle}>{ticket.description || t('detail.noDescription')}</Text>
        </GlassCard>

        {ticket.photos.length > 0 ? (
          <GlassCard style={styles.card}>
            <Text style={labelStyle}>{t('detail.photos')}</Text>
            <PhotoGrid
              photos={ticket.photos.map((p) => ({ key: p.id, uri: p.url }))}
              onPress={(index) =>
                router.push({
                  pathname: '/(tabs)/(tickets)/photo',
                  params: { id: ticket.id, index: String(index) },
                })
              }
            />
          </GlassCard>
        ) : null}

        {canAct ? (
          <GlassCard style={styles.card}>
            <Text style={labelStyle}>{t('detail.actions')}</Text>
            <AuthField
              value={note}
              onChangeText={setNote}
              placeholder={t('detail.notePlaceholder')}
              multiline
              maxLength={2000}
              style={styles.noteInput}
              textAlignVertical="top"
            />
            <View style={styles.actionRow}>
              <MenuView
                title={t('detail.changeStatus')}
                actions={statusActions}
                onPressAction={({ nativeEvent }) => onChangeStatus(nativeEvent.event as TicketStatus)}
              >
                <ActionLabel text={t('detail.changeStatus')} />
              </MenuView>
              {isManager ? (
                <MenuView
                  title={t('detail.assign')}
                  actions={
                    assignActions.length > 0
                      ? assignActions
                      : [{ id: 'empty', title: t('detail.noTechnicians'), attributes: { disabled: true } }]
                  }
                  onPressAction={({ nativeEvent }) => onAssign(nativeEvent.event)}
                >
                  <ActionLabel text={t('detail.assign')} />
                </MenuView>
              ) : null}
            </View>
            <PrimaryButton
              title={t('detail.addNote')}
              loading={busy}
              disabled={!note.trim()}
              onPress={onAddNote}
            />
          </GlassCard>
        ) : null}

        <GlassCard style={styles.card}>
          <Text style={labelStyle}>{t('detail.timeline')}</Text>
          <Timeline events={ticket.events} />
        </GlassCard>
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
    <View style={[styles.actionButton, { backgroundColor: colors.secondarySystemBackground }]}>
      <Text style={[styles.actionText, { color: colors.tint }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 80 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { padding: 16, gap: 14 },
  card: { gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1, gap: 4 },
  title: { fontSize: 20, fontWeight: '600' },
  field: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  fieldLabel: { fontSize: 15 },
  fieldValue: { fontSize: 15, flexShrink: 1, textAlign: 'right' },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 16 },
  noteInput: { minHeight: 80, paddingTop: 12 },
  actionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 16, fontWeight: '600' },
});
