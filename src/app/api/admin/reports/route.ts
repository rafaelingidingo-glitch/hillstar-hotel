import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseHotelDate, toHotelDateStr, addDays } from "@/lib/tz";
import { expireStalePendingBookings } from "@/lib/availability";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return "";
  const cols = columns ?? Object.keys(rows[0]);
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    await expireStalePendingBookings();

    const sp = req.nextUrl.searchParams;
    const type = sp.get("type") || "bookings";
    const fromStr = sp.get("from") || toHotelDateStr(addDays(new Date(), -30));
    const toStr = sp.get("to") || toHotelDateStr(new Date());
    const format = sp.get("format") || "json";

    const from = parseHotelDate(fromStr);
    const toExclusive = addDays(parseHotelDate(toStr), 1);

    let rows: Record<string, unknown>[] = [];
    let summary: Record<string, number> = {};

    if (type === "bookings") {
      const bookings = await db.booking.findMany({
        where: { checkIn: { gte: from, lt: toExclusive } },
        orderBy: { checkIn: "asc" },
        include: {
          category: { select: { name: true } },
          room: { select: { number: true } },
          payments: { select: { amount: true } },
        },
      });
      rows = bookings.map((b) => ({
        Reference: b.reference,
        Status: b.status,
        Guest: b.guestName,
        Phone: b.guestPhone,
        Email: b.guestEmail,
        Category: b.category.name,
        Room: b.room?.number ?? "",
        CheckIn: toHotelDateStr(b.checkIn),
        CheckOut: toHotelDateStr(b.checkOut),
        Nights: b.nights,
        Adults: b.adults,
        Children: b.children,
        EstimatedTotalTZS: b.estimatedTotal,
        PaidTZS: b.payments.reduce((s, p) => s + p.amount, 0),
        Source: b.source,
        CreatedAt: toHotelDateStr(b.createdAt),
      }));
      summary = { count: bookings.length, nights: bookings.reduce((s, b) => s + b.nights, 0) };
    } else if (type === "occupancy") {
      const rooms = await db.room.findMany({ where: { status: "AVAILABLE" }, select: { id: true, number: true, categoryId: true } });
      const categories = await db.roomCategory.findMany({ select: { id: true, name: true } });
      const bookings = await db.booking.findMany({
        where: {
          status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
          checkIn: { lt: toExclusive },
          checkOut: { gt: from },
        },
        select: { checkIn: true, checkOut: true, roomId: true, category: { select: { name: true } } },
      });
      const catNameById = new Map(categories.map((c) => [c.id, c.name]));
      for (let d = from.getTime(); d < toExclusive.getTime(); d += 86400000) {
        const day = new Date(d);
        const next = addDays(day, 1);
        const occupied = bookings.filter(
          (b) => b.roomId && b.checkIn.getTime() < next.getTime() && b.checkOut.getTime() > day.getTime()
        );
        const dayRows = new Map<string, number>();
        for (const b of occupied) {
          const cat = rooms.find((r) => r.id === b.roomId)?.categoryId ?? "";
          dayRows.set(cat, (dayRows.get(cat) || 0) + 1);
        }
        for (const cat of categories) {
          const sellable = rooms.filter((r) => r.categoryId === cat.id).length;
          const occ = Math.min(dayRows.get(cat.id) || 0, sellable);
          rows.push({
            Date: toHotelDateStr(day),
            Category: catNameById.get(cat.id) ?? "",
            Occupied: occ,
            SellableRooms: sellable,
            OccupancyRatePct: sellable ? Math.round((occ / sellable) * 100) : 0,
          });
        }
      }
      const totalSellableRoomNights = rows.reduce((s, r) => s + Number(r.SellableRooms || 0), 0);
      const totalOccupied = rows.reduce((s, r) => s + Number(r.Occupied || 0), 0);
      summary = {
        days: Math.round((toExclusive.getTime() - from.getTime()) / 86400000),
        avgOccupancyPct: totalSellableRoomNights ? Math.round((totalOccupied / totalSellableRoomNights) * 100) : 0,
      };
    } else if (type === "revenue") {
      const payments = await db.payment.findMany({
        where: { recordedAt: { gte: from, lt: toExclusive } },
        orderBy: { recordedAt: "asc" },
        include: {
          booking: {
            select: { reference: true, guestName: true, status: true, category: { select: { name: true } } },
          },
        },
      });
      rows = payments.map((p) => ({
        RecordedAt: toHotelDateStr(p.recordedAt),
        BookingReference: p.booking.reference,
        Guest: p.booking.guestName,
        BookingStatus: p.booking.status,
        Category: p.booking.category.name,
        AmountTZS: p.amount,
        Method: p.method,
        PaymentReference: p.reference,
        RecordedBy: p.recordedBy,
      }));
      const total = payments.reduce((s, p) => s + p.amount, 0);
      summary = { payments: payments.length, totalRevenueTZS: total };
    } else if (type === "cancellations") {
      const bookings = await db.booking.findMany({
        where: {
          status: { in: ["CANCELLED", "REJECTED", "EXPIRED", "NO_SHOW"] },
          updatedAt: { gte: from, lt: toExclusive },
        },
        orderBy: { updatedAt: "desc" },
        include: { category: { select: { name: true } } },
      });
      rows = bookings.map((b) => ({
        Reference: b.reference,
        Status: b.status,
        Guest: b.guestName,
        Phone: b.guestPhone,
        Category: b.category.name,
        CheckIn: toHotelDateStr(b.checkIn),
        CheckOut: toHotelDateStr(b.checkOut),
        LostValueTZS: b.estimatedTotal,
        Source: b.source,
        ClosedAt: toHotelDateStr(b.updatedAt),
      }));
      summary = {
        cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
        rejected: bookings.filter((b) => b.status === "REJECTED").length,
        expired: bookings.filter((b) => b.status === "EXPIRED").length,
        noShow: bookings.filter((b) => b.status === "NO_SHOW").length,
      };
    } else if (type === "guests") {
      const bookings = await db.booking.findMany({
        where: { checkIn: { gte: from, lt: toExclusive }, status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } },
        orderBy: { checkIn: "asc" },
        include: { category: { select: { name: true } } },
      });
      const byGuest = new Map<string, { name: string; phone: string; email: string; stays: number; nights: number; spend: number; categories: Set<string> }>();
      for (const b of bookings) {
        const key = `${b.guestName.toLowerCase()}|${b.guestPhone}`;
        const g =
          byGuest.get(key) ||
          { name: b.guestName, phone: b.guestPhone, email: b.guestEmail, stays: 0, nights: 0, spend: 0, categories: new Set<string>() };
        g.stays += 1;
        g.nights += b.nights;
        g.spend += b.estimatedTotal;
        g.categories.add(b.category.name);
        if (b.guestEmail && !g.email) g.email = b.guestEmail;
        byGuest.set(key, g);
      }
      rows = [...byGuest.values()].map((g) => ({
        Guest: g.name,
        Phone: g.phone,
        Email: g.email,
        Stays: g.stays,
        TotalNights: g.nights,
        TotalValueTZS: g.spend,
        Categories: [...g.categories].join(" | "),
      }));
      summary = { uniqueGuests: rows.length };
    } else {
      return fail(400, "Unknown report type");
    }

    if (format === "csv") {
      const csv = toCsv(rows);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="hillstar-${type}-report-${fromStr}-to-${toStr}.csv"`,
        },
      });
    }

    return ok({ type, from: fromStr, to: toStr, rows, summary });
  } catch (e) {
    return serverError(e);
  }
}
