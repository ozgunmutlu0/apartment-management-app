import type { Database } from '@/lib/database.types';

export type TicketStatus = Database['public']['Enums']['ticket_status'];
export type TicketCategory = Database['public']['Enums']['ticket_category'];
export type TicketPriority = Database['public']['Enums']['ticket_priority'];

export const TICKET_STATUSES: readonly TicketStatus[] = [
  'pending',
  'in_review',
  'in_progress',
  'resolved',
];
export const TICKET_CATEGORIES: readonly TicketCategory[] = [
  'elevator',
  'plumbing',
  'electrical',
  'cleaning',
  'common_area',
  'heating',
  'other',
];
export const TICKET_PRIORITIES: readonly TicketPriority[] = ['low', 'normal', 'high', 'urgent'];

export const MAX_PHOTOS = 4;
export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 4000;

export type TicketListFilters = { status: TicketStatus | null; category: TicketCategory | null };

export type TicketUnit = { block: string; number: string } | null;
