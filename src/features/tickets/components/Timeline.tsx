import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useToneColors, type Tone } from '@/components/IconTile';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

import type { TicketEvent } from '../api';
import { formatDateTime } from '../format';
import type { TicketStatus } from '../types';

const TONES: Record<TicketStatus, Tone> = {
  pending: 'neutral',
  in_review: 'blue',
  in_progress: 'orange',
  resolved: 'green',
};

function Dot({ status }: { status: TicketStatus }) {
  const { fill, fg } = useToneColors(TONES[status]);
  return (
    <View style={[styles.ring, { backgroundColor: fill }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
    </View>
  );
}

/** Vertical list of ticket events (created / status / assignment / note) with localized text. */
export function Timeline({ events }: { events: TicketEvent[] }) {
  const { t } = useTranslation('tickets');
  const colors = useColors();

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
            <Dot status={event.to_status} />
            {index < events.length - 1 ? (
              <View style={[styles.line, { backgroundColor: colors.separator }]} />
            ) : null}
          </View>
          <View style={[styles.content, index === events.length - 1 && styles.last]}>
            <Text style={[styles.text, { color: colors.label }]}>{describe(event)}</Text>
            {event.note ? (
              <Text style={[styles.note, { color: colors.secondaryLabel }]}>{event.note}</Text>
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
  item: { flexDirection: 'row', gap: space.md },
  rail: { width: 20, alignItems: 'center' },
  ring: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { flex: 1, width: 2, borderRadius: 1, marginVertical: space.xs },
  content: { flex: 1, paddingBottom: space.lg, gap: space.xs },
  last: { paddingBottom: 0 },
  text: { ...type.body },
  note: { ...type.small },
  date: { ...type.caption },
});
