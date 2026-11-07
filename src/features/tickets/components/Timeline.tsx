import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useColors, useStatusColors } from '@/theme/colors';

import type { TicketEvent } from '../api';
import { formatDateTime } from '../format';

/** Vertical list of ticket events (created / status / assignment / note) with localized text. */
export function Timeline({ events }: { events: TicketEvent[] }) {
  const { t } = useTranslation('tickets');
  const colors = useColors();
  const statusColors = useStatusColors();

  const describe = (event: TicketEvent): string => {
    const name = event.actorName ?? t('events.unknownUser');
    switch (event.event_type) {
      case 'created':
        return t('events.created', { name });
      case 'assignment':
        return event.assigneeName
          ? t('events.assigned', { name, assignee: event.assigneeName })
          : t('events.unassigned', { name });
      case 'note':
        return t('events.note', { name });
      default:
        return event.from_status
          ? t('events.status', {
              name,
              from: t(`status.${event.from_status}`),
              to: t(`status.${event.to_status}`),
            })
          : t('events.statusFromNone', { name, to: t(`status.${event.to_status}`) });
    }
  };

  return (
    <View>
      {events.map((event, index) => (
        <View key={event.id} style={styles.item}>
          <View style={styles.rail}>
            <View style={[styles.dot, { backgroundColor: statusColors[event.to_status] }]} />
            {index < events.length - 1 ? (
              <View style={[styles.line, { backgroundColor: colors.separator }]} />
            ) : null}
          </View>
          <View style={styles.content}>
            <Text style={[styles.text, { color: colors.label }]}>{describe(event)}</Text>
            {event.note ? (
              <Text style={[styles.note, { color: colors.label }]}>{event.note}</Text>
            ) : null}
            <Text style={[styles.date, { color: colors.secondaryLabel }]}>
              {formatDateTime(event.created_at)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12 },
  rail: { width: 12, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  line: { flex: 1, width: StyleSheet.hairlineWidth * 2, marginTop: 2 },
  content: { flex: 1, paddingBottom: 16, gap: 3 },
  text: { fontSize: 15, fontWeight: '500' },
  note: { fontSize: 15 },
  date: { fontSize: 12 },
});
