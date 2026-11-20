// Client-safe formatting helpers (no server-only imports).

export function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString("en-TZ")}`;
}

export function formatDateLong(s: string | Date): string {
  const d = typeof s === "string" ? new Date(`${s.slice(0, 10)}T00:00:00Z`) : s;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatDateShort(s: string | Date): string {
  const d = typeof s === "string" ? new Date(`${s.slice(0, 10)}T00:00:00Z`) : s;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatDateMedium(s: string | Date): string {
  const d = typeof s === "string" ? new Date(`${s.slice(0, 10)}T00:00:00Z`) : s;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function nightsBetweenStrs(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn.slice(0, 10)}T00:00:00Z`).getTime();
  const b = new Date(`${checkOut.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((b - a) / (24 * 3600 * 1000));
}

export function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dar_es_Salaam" }).format(new Date());
}

export function addDaysStr(s: string, days: number): string {
  const d = new Date(`${s.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Parse a timestamp into hotel-local date+time string. */
export function formatTimestamp(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Dar_es_Salaam",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  CHECKED_IN: "Checked In",
  CHECKED_OUT: "Checked Out",
  NO_SHOW: "No-Show",
};
