import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/Badge';

import type { DueStatus } from '../types';

/** Soft pill: paid green, unpaid neutral, overdue red. */
export function DueStatusBadge({ status }: { status: DueStatus }) {
  const { t } = useTranslation('dues');
  const tone = status === 'paid' ? 'green' : status === 'overdue' ? 'red' : 'neutral';
  return <Badge tone={tone} label={t(`status.${status}`)} />;
}
