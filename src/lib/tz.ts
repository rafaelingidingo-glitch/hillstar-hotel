// Timezone-safe helpers for the property timezone: Africa/Dar_es_Salaam (UTC+3, no DST).
// Hotel calendar dates (check-in / check-out) are stored as Date objects at UTC midnight.

export const HOTEL_TZ = "Africa/Dar_es_Salaam";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Format a Date into the hotel-local 'YYYY-MM-DD' calendar string. */
export function toHotelDateStr(date: Date, tz: string = HOTEL_TZ): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Current hotel-local calendar date as 'YYYY-MM-DD'. */
export function hotelTodayStr(now: Date = new Date()): string {
  return toHotelDateStr(now);
}

/** Parse 'YYYY-MM-DD' into a Date at UTC midnight (canonical hotel date representation). */
export function parseHotelDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) throw new Error(`Invalid date: ${s}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** Convert a Date into its hotel-local calendar date at UTC midnight. */
export function toUtcMidnight(date: Date, tz: string = HOTEL_TZ): Date {
  return parseHotelDate(toHotelDateStr(date, tz));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Whole nights between two UTC-midnight dates. */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
}

/** True if 'YYYY-MM-DD' string is a valid date. */
export function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return false;
  const d = parseHotelDate(s);
  return toHotelDateStr(d) === s.trim();
}

/**
 * True when the given hotel-local date (UTC midnight Date or string) is
 * today or later in the property timezone.
 */
export function isNotPast(date: Date | string, now: Date = new Date()): boolean {
  const d = typeof date === "string" ? parseHotelDate(date) : date;
  return d.getTime() >= toUtcMidnight(now).getTime();
}

/** Human friendly long date, e.g. "Monday, 12 January 2026" rendered in hotel TZ. */
export function formatHotelDate(
  date: Date | string,
  opts: Intl.DateTimeFormatOptions = { weekday: undefined, year: "numeric", month: "long", day: "numeric" },
  tz: string = HOTEL_TZ
): string {
  const d = typeof date === "string" ? parseHotelDate(date) : date;
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...opts }).format(d);
}

/** Short date, e.g. "12 Jan 2026". */
export function formatShortDate(date: Date | string, tz: string = HOTEL_TZ): string {
  const d = typeof date === "string" ? parseHotelDate(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Date + time for timestamps (createdAt etc.) rendered in hotel TZ, e.g. "12 Jan 2026, 14:05". */
export function formatDateTime(date: Date | string, tz: string = HOTEL_TZ): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** Overlap test for half-open [checkIn, checkOut) ranges using UTC-midnight dates. */
export function rangesOverlap(
  aIn: Date, aOut: Date,
  bIn: Date, bOut: Date
): boolean {
  return aIn.getTime() < bOut.getTime() && aOut.getTime() > bIn.getTime();
}
