import type { Database } from '@/lib/database.types';

export type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];

export const ANNOUNCEMENT_CATEGORIES = [
  'general',
  'maintenance',
  'event',
  'urgent',
  'payment',
] as const;
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export const TITLE_MAX = 160;
export const BODY_MAX = 10000;

export type Announcement = Omit<AnnouncementRow, 'category'> & {
  category: AnnouncementCategory;
  author: { full_name: string } | null;
};

export type AnnouncementInput = {
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
};

export function isAnnouncementCategory(value: unknown): value is AnnouncementCategory {
  return ANNOUNCEMENT_CATEGORIES.some((c) => c === value);
}
