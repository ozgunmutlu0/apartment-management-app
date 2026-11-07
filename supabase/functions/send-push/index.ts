// Deno runtime (Supabase Edge Function); excluded from the Expo app's tsconfig and eslint.
//
// send-push: called by the `notifications_send_push` Postgres trigger (pg_net) with
// `{ "notification_id": "<uuid>" }` and the shared secret in the `x-webhook-secret` header.
// Looks up the recipient's Expo push token + locale (service role), builds a localized message and
// sends it through the Expo Push API.
import { createClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const STATUS_LABELS: Record<string, Record<string, string>> = {
  tr: {
    pending: 'Beklemede',
    in_review: 'İncelemede',
    in_progress: 'İşlemde',
    resolved: 'Çözüldü',
  },
  en: {
    pending: 'Pending',
    in_review: 'In review',
    in_progress: 'In progress',
    resolved: 'Resolved',
  },
};

type Row = {
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
};

function buildMessage(locale: string, n: Row): { title: string; body: string } {
  const lang = locale === 'en' ? 'en' : 'tr';
  const status = String(n.data?.status ?? '');
  const statusLabel = STATUS_LABELS[lang][status] ?? status;
  switch (n.type) {
    case 'ticket_created':
      return {
        title: lang === 'en' ? 'New maintenance request' : 'Yeni arıza talebi',
        body: n.title,
      };
    case 'ticket_status':
      return {
        // Neutral wording: the recipient may be the creator or the assigned technician.
        title:
          lang === 'en'
            ? `Request status updated: ${statusLabel}`
            : `Talep durumu güncellendi: ${statusLabel}`,
        body: n.body ? `${n.title} - ${n.body}` : n.title,
      };
    case 'ticket_assigned':
      return {
        title: lang === 'en' ? 'A request was assigned to you' : 'Size bir talep atandı',
        body: n.title,
      };
    case 'announcement':
      return { title: lang === 'en' ? 'New announcement' : 'Yeni duyuru', body: n.title };
    default:
      return { title: n.title, body: n.body ?? '' };
  }
}

// expo-router hrefs; route groups are part of the path (tickets and announcements both have [id]).
function deepLink(n: Row): string | null {
  const ticketId = n.data?.ticket_id;
  const announcementId = n.data?.announcement_id;
  if (typeof ticketId === 'string') return `/(tabs)/(tickets)/${ticketId}`;
  if (typeof announcementId === 'string') return `/(tabs)/(announcements)/${announcementId}`;
  return null;
}

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const expected = Deno.env.get('SEND_PUSH_SECRET') ?? '';
  const received = req.headers.get('x-webhook-secret') ?? '';
  if (!expected || !safeEqual(expected, received)) return json({ error: 'unauthorized' }, 401);

  let notificationId: string | undefined;
  try {
    notificationId = (await req.json())?.notification_id;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  if (!notificationId) return json({ error: 'notification_id required' }, 400);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data: notification, error } = await supabase
    .from('notifications')
    .select('user_id, type, title, body, data')
    .eq('id', notificationId)
    .maybeSingle();
  if (error || !notification) return json({ error: 'notification not found' }, 404);

  const { data: profile } = await supabase
    .from('profiles')
    .select('expo_push_token, locale')
    .eq('id', notification.user_id)
    .maybeSingle();
  const token = profile?.expo_push_token;
  if (!token) return json({ skipped: 'no push token' });

  const { count: unread } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', notification.user_id)
    .is('read_at', null);

  const message = buildMessage(profile?.locale ?? 'tr', notification);
  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      to: token,
      title: message.title,
      body: message.body,
      sound: 'default',
      channelId: 'default',
      badge: unread ?? undefined,
      data: {
        notification_id: notificationId,
        type: notification.type,
        url: deepLink(notification),
        ...(notification.data ?? {}),
      },
    }),
  });

  const result = await response.json().catch(() => null);
  const ticket = result?.data;
  if (ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
    await supabase
      .from('profiles')
      .update({ expo_push_token: null })
      .eq('id', notification.user_id)
      .eq('expo_push_token', token);
    return json({ cleared: 'DeviceNotRegistered' });
  }
  return json({ ok: response.ok, ticket }, response.ok ? 200 : 502);
});
