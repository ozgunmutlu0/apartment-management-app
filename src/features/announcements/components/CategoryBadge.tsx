import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/Badge';

import type { AnnouncementCategory } from '../types';

/** Neutral pill: categories are not states, so they never get their own hue. */
export function CategoryBadge({ category }: { category: AnnouncementCategory }) {
  const { t } = useTranslation('announcements');
  return <Badge tone="neutral" label={t(`categories.${category}`)} />;
}
