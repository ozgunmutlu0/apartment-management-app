import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/Badge';
import type { Tone } from '@/components/IconTile';

import type { TicketStatus } from '../types';

const TONES: Record<TicketStatus, Tone> = {
  pending: 'neutral',
  in_review: 'blue',
  in_progress: 'orange',
  resolved: 'green',
};

/** Soft pill with a dot and the localized status name. */
export function StatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useTranslation('tickets');
  return <Badge dot tone={TONES[status]} label={t(`status.${status}`)} />;
}
