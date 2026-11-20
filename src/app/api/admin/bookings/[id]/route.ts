import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toHotelDateStr, parseHotelDate, nightsBetween } from "@/lib/tz";
import { assertRoomFreeInTx, expireStalePendingBookings } from "@/lib/availability";
import { ensureExpirySweeper } from "@/lib/booking-core";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    ensureExpirySweeper();
    const { id } = await ctx.params;
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        category: true,
        room: true,
        payments: { orderBy: { recordedAt: "desc" } },
      },
    });
    if (!booking) return fail(404, "Booking not found");
    const freeRooms = await db.room.findMany({
      where: { categoryId: booking.categoryId, status: "AVAILABLE" },
      orderBy: { number: "asc" },
      select: { id: true, number: true, floor: true },
    });
    return ok({
      booking: {
        ...booking,
        checkIn: toHotelDateStr(booking.checkIn),
        checkOut: toHotelDateStr(booking.checkOut),
        payments: booking.payments.map((p) => ({ ...p, recordedAt: p.recordedAt })),
      },
      rooms: freeRooms,
    });
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    ensureExpirySweeper();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as { action?: string } | null;
    if (!body?.action) return fail(400, "Missing action");

    const result = await db.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id }, include: { category: true, room: true } });
      if (!booking) return { status: 404 as const, error: "Booking not found" };

      const now = new Date();
      switch (body.action) {
        case "confirm": {
          if (!["PENDING", "EXPIRED"].includes(booking.status)) {
            return { status: 400 as const, error: `Cannot confirm a booking with status ${booking.status}.` };
          }
          // Resolve room: keep assigned room, or pick a free one
          let roomId = booking.roomId;
          let roomNumber = booking.room?.number ?? null;
          if (roomId) {
            const free = await assertRoomFreeInTx(tx, roomId, booking.checkIn, booking.checkOut, booking.id);
            if (!free) {
              // try to find an alternative free room in the same category
              const rooms = await tx.room.findMany({
                where: { categoryId: booking.categoryId, status: "AVAILABLE" },
                orderBy: { number: "asc" },
              });
              const replacement = rooms.find((r) => r.id !== roomId);
              if (!replacement) {
                return { status: 409 as const, error: `Room ${roomNumber ?? ""} is no longer available for these dates and no alternative room is free. Reject or choose different dates.` };
              }
              const altFree = await assertRoomFreeInTx(tx, replacement.id, booking.checkIn, booking.checkOut, booking.id);
              if (!altFree) {
                return { status: 409 as const, error: "No room in this category is available for these dates." };
              }
              roomId = replacement.id;
              roomNumber = replacement.number;
            }
          } else {
            const rooms = await tx.room.findMany({
              where: { categoryId: booking.categoryId, status: "AVAILABLE" },
              orderBy: { number: "asc" },
            });
            let assigned: string | null = null;
            for (const r of rooms) {
              if (await assertRoomFreeInTx(tx, r.id, booking.checkIn, booking.checkOut, booking.id)) {
                assigned = r.id;
                roomNumber = r.number;
                break;
              }
            }
            if (!assigned) {
              return { status: 409 as const, error: "No room in this category is available for these dates." };
            }
            roomId = assigned;
          }
          const updated = await tx.booking.update({
            where: { id },
            data: {
              status: "CONFIRMED",
              roomId,
              confirmedAt: now,
              confirmedBy: admin.username,
              expiresAt: null,
            },
            include: { room: true, category: true },
          });
          return { status: 200 as const, booking: updated };
        }
        case "reject": {
          if (booking.status !== "PENDING" && booking.status !== "EXPIRED") {
            return { status: 400 as const, error: `Cannot reject a booking with status ${booking.status}.` };
          }
          const updated = await tx.booking.update({
            where: { id },
            data: { status: "REJECTED", closedAt: now, expiresAt: null },
            include: { room: true, category: true },
          });
          return { status: 200 as const, booking: updated };
        }
        case "cancel": {
          if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
            return { status: 400 as const, error: `Cannot cancel a booking with status ${booking.status}.` };
          }
          const updated = await tx.booking.update({
            where: { id },
            data: { status: "CANCELLED", closedAt: now, expiresAt: null },
            include: { room: true, category: true },
          });
          return { status: 200 as const, booking: updated };
        }
        case "check_in": {
          if (booking.status !== "CONFIRMED") {
            return { status: 400 as const, error: "Only confirmed bookings can be checked in." };
          }
          const updated = await tx.booking.update({
            where: { id },
            data: { status: "CHECKED_IN", checkedInAt: now },
            include: { room: true, category: true },
          });
          return { status: 200 as const, booking: updated };
        }
        case "check_out": {
          if (booking.status !== "CHECKED_IN") {
            return { status: 400 as const, error: "Only checked-in bookings can be checked out." };
          }
          const updated = await tx.booking.update({
            where: { id },
            data: { status: "CHECKED_OUT", checkedOutAt: now, closedAt: now },
            include: { room: true, category: true },
          });
          return { status: 200 as const, booking: updated };
        }
        case "no_show": {
          if (booking.status !== "CONFIRMED") {
            return { status: 400 as const, error: "Only confirmed bookings can be marked as no-show." };
          }
          const updated = await tx.booking.update({
            where: { id },
            data: { status: "NO_SHOW", closedAt: now },
            include: { room: true, category: true },
          });
          return { status: 200 as const, booking: updated };
        }
        case "extend": {
          if (booking.status !== "PENDING") {
            return { status: 400 as const, error: "Only pending requests can be extended." };
          }
          const minutes = Math.min(Math.max(Number(body.extendMinutes || 15), 5), 2880);
          const base = booking.expiresAt && booking.expiresAt > now ? booking.expiresAt : now;
          const updated = await tx.booking.update({
            where: { id },
            data: { expiresAt: new Date(base.getTime() + minutes * 60_000) },
            include: { room: true, category: true },
          });
          return { status: 200 as const, booking: updated };
        }
        case "assign_room": {
          const newRoomId = body.roomId;
          if (!newRoomId) return { status: 400 as const, error: "roomId is required" };
          const room = await tx.room.findUnique({ where: { id: newRoomId } });
          if (!room) return { status: 404 as const, error: "Room not found" };
          if (room.categoryId !== booking.categoryId) {
            return { status: 400 as const, error: "Room belongs to a different category." };
          }
          if (room.status !== "AVAILABLE") {
            return { status: 400 as const, error: "Room is not sellable (maintenance or inactive)." };
          }
          const free = await assertRoomFreeInTx(tx, room.id, booking.checkIn, booking.checkOut, booking.id);
          if (!free) {
            return { status: 409 as const, error: `Room ${room.number} is already held for these dates.` };
          }
          const updated = await tx.booking.update({
            where: { id },
            data: { roomId: room.id },
            include: { room: true, category: true },
          });
          return { status: 200 as const, booking: updated };
        }
        case "set_notes": {
          const updated = await tx.booking.update({
            where: { id },
            data: { adminNotes: String(body.notes || "") },
            include: { room: true, category: true },
          });
          return { status: 200 as const, booking: updated };
        }
        case "update_details": {
          // Update guest details / dates. If dates change and booking holds inventory, recheck room.
          let checkIn = booking.checkIn;
          let checkOut = booking.checkOut;
          if (body.checkIn) checkIn = parseHotelDate(body.checkIn);
          if (body.checkOut) checkOut = parseHotelDate(body.checkOut);
          if (checkOut.getTime() <= checkIn.getTime()) {
            return { status: 400 as const, error: "Check-out must be after check-in." };
          }
          const nights = nightsBetween(checkIn, checkOut);
          if (nights > 30) return { status: 400 as const, error: "Stays longer than 30 nights require contacting the guest directly." };
          const datesChanged =
            checkIn.getTime() !== booking.checkIn.getTime() || checkOut.getTime() !== booking.checkOut.getTime();

          if (datesChanged && booking.roomId && ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(booking.status)) {
            const free = await assertRoomFreeInTx(tx, booking.roomId, checkIn, checkOut, booking.id);
            if (!free) {
              return { status: 409 as const, error: "The assigned room is not free for the new dates. Reassign a room first." };
            }
          }

          const updated = await tx.booking.update({
            where: { id },
            data: {
              guestName: body.guestName ?? booking.guestName,
              guestPhone: body.guestPhone ?? booking.guestPhone,
              guestEmail: body.guestEmail ?? booking.guestEmail,
              adults: body.adults ?? booking.adults,
              children: body.children ?? booking.children,
              checkIn,
              checkOut,
              nights,
              estimatedTotal: booking.category.pricePerNight * nights,
            },
            include: { room: true, category: true },
          });
          return { status: 200 as const, booking: updated };
        }
        default:
          return { status: 400 as const, error: "Unknown action" };
      }
    });

    if ("error" in result) return fail(result.status, result.error);
    const b = result.booking;
    return ok({
      booking: {
        id: b.id,
        reference: b.reference,
        status: b.status,
        roomId: b.roomId,
        roomNumber: b.room?.number ?? null,
        expiresAt: b.expiresAt,
        checkIn: toHotelDateStr(b.checkIn),
        checkOut: toHotelDateStr(b.checkOut),
      },
    });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const booking = await db.booking.findUnique({ where: { id }, include: { payments: true } });
    if (!booking) return fail(404, "Booking not found");
    if (["PENDING", "CONFIRMED", "CHECKED_IN"].includes(booking.status)) {
      return fail(400, "Active bookings cannot be deleted. Cancel, reject or check out first.");
    }
    if (booking.payments.length > 0) {
      return fail(400, "Bookings with recorded payments cannot be deleted. Anonymise via notes instead.");
    }
    await db.booking.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
