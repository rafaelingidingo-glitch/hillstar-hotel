import { db } from "@/lib/db";
import { HOLD_STATUSES } from "./booking-constants";
import { toUtcMidnight, rangesOverlap, parseHotelDate } from "./tz";

export interface CategoryAvailability {
  categoryId: string;
  available: number;
  totalSellable: number;
}

export interface RoomAvailabilityRow {
  roomId: string;
  number: string;
  floor: string;
  status: string;
  free: boolean;
}

/** Mark stale PENDING bookings as EXPIRED. Returns number of expired rows. */
export async function expireStalePendingBookings(): Promise<number> {
  const res = await db.booking.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { not: null, lt: new Date() },
    },
    data: { status: "EXPIRED", closedAt: new Date() },
  });
  return res.count;
}

interface HoldRow {
  roomId: string | null;
  categoryId: string;
  checkIn: Date;
  checkOut: Date;
}

async function getHolds(checkIn: Date, checkOut: Date, categoryId?: string): Promise<HoldRow[]> {
  const rows = await db.booking.findMany({
    where: {
      status: { in: HOLD_STATUSES },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(categoryId ? { categoryId } : {}),
    },
    select: { roomId: true, categoryId: true, checkIn: true, checkOut: true },
  });
  return rows;
}

/** Rooms in a category that are sellable (active category + AVAILABLE status). */
export async function getSellableRooms(categoryId: string) {
  return db.room.findMany({
    where: { categoryId, status: "AVAILABLE" },
    orderBy: { number: "asc" },
  });
}

/**
 * Category-level availability for a date range.
 * Pending (unexpired) and confirmed bookings both consume inventory.
 */
export async function getCategoryAvailabilityForRange(
  checkIn: Date,
  checkOut: Date,
  categories: { id: string }[]
): Promise<Map<string, CategoryAvailability>> {
  await expireStalePendingBookings();
  const result = new Map<string, CategoryAvailability>();
  if (categories.length === 0) return result;

  const rooms = await db.room.findMany({
    where: { categoryId: { in: categories.map((c) => c.id) }, status: "AVAILABLE" },
  });
  const holds = await getHolds(checkIn, checkOut);

  for (const cat of categories) {
    const catRooms = rooms.filter((r) => r.categoryId === cat.id);
    const catHolds = holds.filter((h) => h.categoryId === cat.id);
    const blockedRoomIds = new Set(catHolds.filter((h) => h.roomId).map((h) => h.roomId as string));
    const categoryHolds = catHolds.filter((h) => !h.roomId).length;
    const totalSellable = catRooms.length;
    const available = Math.max(0, totalSellable - blockedRoomIds.size - categoryHolds);
    result.set(cat.id, { categoryId: cat.id, available, totalSellable });
  }
  return result;
}

/** Free (bookable) rooms of a category for a date range, with details. */
export async function getFreeRoomsForRange(
  categoryId: string,
  checkIn: Date,
  checkOut: Date
): Promise<RoomAvailabilityRow[]> {
  await expireStalePendingBookings();
  const rooms = await getSellableRooms(categoryId);
  const holds = await getHolds(checkIn, checkOut, categoryId);
  const blocked = new Set(holds.filter((h) => h.roomId).map((h) => h.roomId as string));
  return rooms.map((r) => ({
    roomId: r.id,
    number: r.number,
    floor: r.floor,
    status: r.status,
    free: !blocked.has(r.id),
  }));
}

/**
 * Transaction-safe check that a specific room is free for a range.
 * Must be called inside a transaction so the conflict check and the booking
 * write commit atomically (prevents double booking under concurrency).
 */
export async function assertRoomFreeInTx(
  tx: {
    booking: {
      findFirst: (args: {
        where: {
          roomId: string;
          status: { in: string[] };
          checkIn: { lt: Date };
          checkOut: { gt: Date };
          id?: { not: string };
        };
      }) => Promise<{ id: string } | null>;
    };
  },
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const conflict = await tx.booking.findFirst({
    where: {
      roomId,
      status: { in: HOLD_STATUSES },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
  });
  return !conflict;
}

/** Validate guest counts against a category's capacity rules. */
export function validateGuestCapacity(
  cat: { maxAdults: number; maxChildren: number; maxTotalGuests: number },
  adults: number,
  children: number
): string | null {
  if (adults < 1) return "At least one adult is required.";
  if (adults > cat.maxAdults) return `This room accommodates up to ${cat.maxAdults} adults.`;
  if (children > cat.maxChildren) return `This room accommodates up to ${cat.maxChildren} children.`;
  if (adults + children > cat.maxTotalGuests)
    return `Total guests exceed this room's maximum of ${cat.maxTotalGuests}.`;
  return null;
}

/** Parse and validate a date range coming from search input ('YYYY-MM-DD'). */
export function parseDateRange(checkInStr: string, checkOutStr: string, now: Date = new Date()): { checkIn: Date; checkOut: Date; nights: number } {
  const checkIn = parseHotelDate(checkInStr);
  const checkOut = parseHotelDate(checkOutStr);
  const today = toUtcMidnight(now);
  if (checkIn.getTime() < today.getTime()) {
    throw new RangeError("Check-in date cannot be in the past.");
  }
  if (checkOut.getTime() <= checkIn.getTime()) {
    throw new RangeError("Check-out date must be after check-in date.");
  }
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (24 * 3600 * 1000));
  if (nights > 30) throw new RangeError("Stays longer than 30 nights require contacting the hotel directly.");
  return { checkIn, checkOut, nights };
}

export { rangesOverlap };
