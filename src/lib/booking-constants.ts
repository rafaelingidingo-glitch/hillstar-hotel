/** Canonical booking status values. */
export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "NO_SHOW",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Statuses that consume room inventory (holds). */
export const HOLD_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN"];

/** Statuses considered "live" bookings for a given stay. */
export const ACTIVE_STATUSES: BookingStatus[] = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"];

export const MEETING_INQUIRY_STATUSES = ["NEW", "CONTACTED", "QUOTATION_SENT", "CONFIRMED", "REJECTED"] as const;

export const RESTAURANT_INQUIRY_STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "REJECTED"] as const;

export const PAYMENT_METHODS = ["CASH", "MOBILE_MONEY", "BANK", "CARD", "OTHER"] as const;
