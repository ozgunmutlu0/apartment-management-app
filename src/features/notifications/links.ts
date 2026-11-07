import type { Href } from 'expo-router';

import type { NotificationRow } from './api';

function stringField(data: unknown, key: string): string | null {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const value = (data as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

/** Screen a notification (or a push payload) leads to, derived from its `data`. */
export function notificationHref(data: unknown): Href | null {
  const ticketId = stringField(data, 'ticket_id');
  if (ticketId) return { pathname: '/(tabs)/(tickets)/[id]', params: { id: ticketId } };
  const announcementId = stringField(data, 'announcement_id');
  if (announcementId)
    return { pathname: '/(tabs)/(announcements)/[id]', params: { id: announcementId } };
  return null;
}

export type NotificationTitleKey =
  'ticket_created' | 'ticket_status' | 'ticket_assigned' | 'announcement' | 'generic';

export function notificationTitleKey(type: NotificationRow['type']): NotificationTitleKey {
  switch (type) {
    case 'ticket_created':
    case 'ticket_status':
    case 'ticket_assigned':
    case 'announcement':
      return type;
    default:
      return 'generic';
  }
}

const STATUSES = ['pending', 'in_review', 'in_progress', 'resolved'] as const;
export type NotificationStatus = (typeof STATUSES)[number];

export function notificationStatus(data: unknown): NotificationStatus | null {
  const value = stringField(data, 'status');
  return STATUSES.find((s) => s === value) ?? null;
}
