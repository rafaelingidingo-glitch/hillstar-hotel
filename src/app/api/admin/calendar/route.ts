import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toUtcMidnight, addDays, toHotelDateStr, parseHotelDate, isValidDateStr, HOTEL_TZ } from "@/lib/tz";
import { expireStalePendingBookings } from "@/lib/availability";
import { ensureExpirySweeper } from "@/lib/booking-core";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    ensureExpirySweeper();
    await expireStalePendingBookings();

    const sp = req.nextUrl.searchParams;
    const view = sp.get("view") || "week";
    const dateParam = sp.get("date") || "";
    const anchor =
      dateParam && isValidDateStr(dateParam) ? parseHotelDate(dateParam) : toUtcMidnight(new Date());

    let start: Date;
    let daysCount: number;
    if (view === "day") {
      start = anchor;
      daysCount = 1;
    } else if (view === "month") {
      // Month view in hotel TZ: first day of the month, padded to full weeks (Mon start)
      const y = Number(toHotelDateStr(anchor, HOTEL_TZ).slice(0, 4));
      const m = Number(toHotelDateStr(anchor, HOTEL_TZ).slice(5, 7));
      const first = new Date(Date.UTC(y, m - 1, 1));
      const dow = (first.getUTCDay() + 6) % 7; // Monday = 0
      start = addDays(first, -dow);
      daysCount = 42;
    } else {
      // week: Monday-start
      const dow = (anchor.getUTCDay() + 6) % 7;
      start = addDays(anchor, -dow);
      daysCount = 7;
    }
    const end = addDays(start, daysCount);

    const [rooms, bookings] = await Promise.all([
      db.room.findMany({
        orderBy: { number: "asc" },
        include: { category: { select: { name: true } } },
      }),
      db.booking.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
          checkIn: { lt: end },
          checkOut: { gte: start },
        },
        include: {
          room: { select: { id: true, number: true } },
          category: { select: { name: true } },
        },
      }),
    ]);

    const days: string[] = [];
    for (let i = 0; i < daysCount; i++) days.push(toHotelDateStr(addDays(start, i)));

    const roomRows = rooms.map((room) => {
      const cells = days.map((day) => {
        if (room.status === "MAINTENANCE") {
          return { date: day, state: "MAINTENANCE" as const, booking: null };
        }
        if (room.status === "INACTIVE") {
          return { date: day, state: "INACTIVE" as const, booking: null };
        }
        const dayStart = parseHotelDate(day);
        const dayEnd = addDays(dayStart, 1);
        const booking = bookings.find(
          (b) =>
            b.roomId === room.id &&
            b.checkIn.getTime() < dayEnd.getTime() &&
            b.checkOut.getTime() > dayStart.getTime()
        );
        if (!booking) return { date: day, state: "AVAILABLE" as const, booking: null };
        const isStart = toHotelDateStr(booking.checkIn) === day;
        const isEnd = toHotelDateStr(addDays(booking.checkOut, -1)) === day;
        return {
          date: day,
          state: booking.status,
          booking: {
            id: booking.id,
            reference: booking.reference,
            status: booking.status,
            guestName: booking.guestName,
            categoryName: booking.category.name,
            type: isStart && isEnd ? "single" : isStart ? "start" : isEnd ? "end" : "mid",
          },
        };
      });
      return {
        roomId: room.id,
        number: room.number,
        floor: room.floor,
        status: room.status,
        categoryName: room.category.name,
        cells,
      };
    });

    return ok({
      view,
      days,
      rooms: roomRows,
      rangeStart: toHotelDateStr(start),
      rangeEnd: toHotelDateStr(addDays(end, -1)),
    });
  } catch (e) {
    return serverError(e);
  }
}
