import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, serverError, readJson, validate, clientIp } from "@/lib/api-helpers";
import { bookingRequestSchema } from "@/lib/validation";
import {
  expireStalePendingBookings,
  parseDateRange,
  validateGuestCapacity,
} from "@/lib/availability";
import { rateLimit } from "@/lib/rate-limit";
import {
  ensureExpirySweeper,
  generateBookingReference,
  notifyAdmins,
  buildBookingWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/booking-core";
import { getSettings } from "@/lib/settings";
import { toUtcMidnight } from "@/lib/tz";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    ensureExpirySweeper();
    if (!rateLimit(`booking-create:${clientIp(req)}`, 15, 10 * 60_000)) {
      return fail(429, "Too many booking attempts. Please wait a few minutes and try again.");
    }
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(bookingRequestSchema, body);
    if (!v.success) return fail(400, v.message);
    const input = v.data;

    if (!input.guestEmail && input.guestEmail !== "") {
      return fail(400, "Email must be empty or a valid address");
    }

    // Pre-transaction validation
    let range;
    try {
      range = parseDateRange(input.checkIn, input.checkOut);
    } catch (e) {
      return fail(400, e instanceof RangeError ? e.message : "Invalid dates");
    }

    const category = await db.roomCategory.findUnique({ where: { id: input.categoryId } });
    if (!category || !category.active) return fail(404, "Room category not found or unavailable.");

    const capacityError = validateGuestCapacity(category, input.adults, input.children);
    if (capacityError) return fail(400, capacityError);

    await expireStalePendingBookings();

    const settings = await getSettings();
    const expirationMinutes = await (async () => {
      const m = Number(settings.booking.pendingExpirationMinutes);
      return Number.isFinite(m) && m > 0 ? Math.min(m, 2880) : 15;
    })();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60_000);

    // Transactional creation: assign a concrete room hold, recheck inside tx.
    const created = await db.$transaction(async (tx) => {
      // Sellable rooms of this category
      const rooms = await tx.room.findMany({
        where: { categoryId: category.id, status: "AVAILABLE" },
        orderBy: { number: "asc" },
      });
      // Holding bookings for this category over the requested range
      const holds = await tx.booking.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
          checkIn: { lt: range.checkOut },
          checkOut: { gt: range.checkIn },
          categoryId: category.id,
        },
        select: { roomId: true },
      });
      const blocked = new Set(holds.filter((h) => h.roomId).map((h) => h.roomId as string));

      let chosenRoom: { id: string; number: string } | null = null;
      if (input.preferredRoomId) {
        const preferred = rooms.find((r) => r.id === input.preferredRoomId);
        if (preferred && !blocked.has(preferred.id)) chosenRoom = { id: preferred.id, number: preferred.number };
        else return { conflict: true as const };
      } else {
        chosenRoom = rooms.find((r) => !blocked.has(r.id)) ?? null;
      }
      if (!chosenRoom) return { conflict: true as const };

      const reference = await generateBookingReference(tx);
      const booking = await tx.booking.create({
        data: {
          reference,
          status: "PENDING",
          categoryId: category.id,
          roomId: chosenRoom.id,
          guestName: input.guestName,
          guestPhone: input.guestPhone,
          guestEmail: input.guestEmail ?? "",
          adults: input.adults,
          children: input.children,
          checkIn: range.checkIn,
          checkOut: range.checkOut,
          nights: range.nights,
          estimatedTotal: category.pricePerNight * range.nights,
          specialRequests: input.specialRequests ?? "",
          expiresAt,
          source: "WEBSITE",
        },
        include: { room: true, category: true },
      });
      return { conflict: false as const, booking };
    });

    if (created.conflict) {
      return fail(409, "These dates have just become fully booked for this room type. Please search again or choose different dates.");
    }

    const booking = created.booking;
    await notifyAdmins(
      "BOOKING_REQUEST",
      `New booking request ${booking.reference}`,
      `${booking.guestName} requested ${category.name} (${booking.room?.number ?? "-"}) from ${input.checkIn} to ${input.checkOut}.`,
      "#/admin/reservations"
    );

    const message = buildBookingWhatsAppMessage({
      reference: booking.reference,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      guestEmail: booking.guestEmail || undefined,
      categoryName: category.name,
      roomNumber: booking.room?.number ?? null,
      checkIn: range.checkIn,
      checkOut: range.checkOut,
      nights: range.nights,
      adults: booking.adults,
      children: booking.children,
      estimatedTotal: booking.estimatedTotal,
      specialRequests: booking.specialRequests || undefined,
    });
    const whatsappUrl = buildWhatsAppUrl(settings.hotel.whatsapp, message);

    return ok(
      {
        booking: {
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
          categoryName: category.name,
          roomNumber: booking.room?.number ?? null,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          nights: range.nights,
          adults: booking.adults,
          children: booking.children,
          estimatedTotal: booking.estimatedTotal,
          expiresAt: booking.expiresAt,
        },
        whatsappUrl,
        expiresInMinutes: expirationMinutes,
      },
      { status: 201 }
    );
  } catch (e) {
    return serverError(e);
  }
}
