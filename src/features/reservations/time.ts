/**
 * Building-timezone helpers. Reservation rules are enforced by the database in
 * `buildings.timezone` (default Europe/Istanbul), so wall-clock values chosen in the app are
 * converted to UTC instants with that zone - NOT with the device zone. Pure Intl, no libraries.
 */
export const DEFAULT_TIMEZONE = 'Europe/Istanbul';
export const SLOT_MINUTES = 30;

export type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number };

function formatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Wall-clock parts of an instant in the given IANA zone. */
export function partsInZone(date: Date, timeZone: string): ZonedParts {
  const out: Record<string, number> = {};
  for (const p of formatter(timeZone).formatToParts(date)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour % 24,
    minute: out.minute,
  };
}

/** Offset (ms) of the zone from UTC at the given instant. */
function offsetMs(instant: number, timeZone: string): number {
  const p = partsInZone(new Date(instant), timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(instant / 60000) * 60000;
}

/** UTC instant for a wall-clock time (`minutes` after local midnight) of a calendar day in the zone. */
export function zonedInstant(
  day: { year: number; month: number; day: number },
  minutes: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(day.year, day.month - 1, day.day, 0, minutes);
  let result = guess - offsetMs(guess, timeZone);
  // Re-evaluate once so instants next to a DST change resolve correctly.
  result = guess - offsetMs(result, timeZone);
  return new Date(result);
}

export type CalendarDay = { year: number; month: number; day: number };

/** Today's calendar day in the zone. */
export function todayIn(timeZone: string, now: Date = new Date()): CalendarDay {
  const p = partsInZone(now, timeZone);
  return { year: p.year, month: p.month, day: p.day };
}

/** The calendar day a device-local Date from the native date picker stands for. */
export function dayFromPicker(date: Date): CalendarDay {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/** Device-local Date at noon for a calendar day (safe to hand to the native date picker). */
export function pickerDate(day: CalendarDay): Date {
  return new Date(day.year, day.month - 1, day.day, 12, 0, 0);
}

export function nextDay(day: CalendarDay): CalendarDay {
  const d = new Date(Date.UTC(day.year, day.month - 1, day.day + 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function compareDays(a: CalendarDay, b: CalendarDay): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** "HH:MM[:SS]" (Postgres time) to minutes after midnight. */
export function parseTime(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Minutes after local midnight of an instant in the zone. */
export function minutesOfDay(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone);
  return p.hour * 60 + p.minute;
}

export type Interval = { start: number; end: number };

/** Allowed start slots: 30-minute grid inside opening hours, not booked, not in the past. */
export function startSlots(
  open: number,
  close: number,
  booked: Interval[],
  minStart: number,
): number[] {
  const slots: number[] = [];
  for (let m = open; m + SLOT_MINUTES <= close; m += SLOT_MINUTES) {
    if (m < minStart) continue;
    if (booked.some((b) => m < b.end && m + SLOT_MINUTES > b.start)) continue;
    slots.push(m);
  }
  return slots;
}

/** Allowed end slots for a start: up to closing time or the next booking, whichever is first. */
export function endSlots(start: number, close: number, booked: Interval[]): number[] {
  let limit = close;
  for (const b of booked) if (b.start >= start) limit = Math.min(limit, b.start);
  const slots: number[] = [];
  for (let m = start + SLOT_MINUTES; m <= limit; m += SLOT_MINUTES) slots.push(m);
  return slots;
}
