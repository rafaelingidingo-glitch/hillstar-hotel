import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toHotelDateStr, parseHotelDate } from "@/lib/tz";
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
    const query = sp.get("query")?.trim() || "";
    const status = sp.get("status") || "";
    const from = sp.get("from") || "";
    const to = sp.get("to") || "";
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const pageSize = 20;

    const where: {
      OR?: Array<Record<string, unknown>>;
      status?: string;
      checkIn?: { gte?: Date; lt?: Date };
    } = {};

    if (status && status !== "ALL") where.status = status;
    if (query) {
      where.OR = [
        { reference: { contains: query, mode: "insensitive" } },
        { guestName: { contains: query, mode: "insensitive" } },
        { guestPhone: { contains: query, mode: "insensitive" } },
        { guestEmail: { contains: query, mode: "insensitive" } },
      ];
    }
    if (from) {
      where.checkIn = { ...(where.checkIn || {}), gte: parseHotelDate(from) };
    }
    if (to) {
      const toExclusive = new Date(parseHotelDate(to).getTime() + 24 * 3600 * 1000);
      where.checkIn = { ...(where.checkIn || {}), lt: toExclusive };
    }

    const [total, bookings] = await Promise.all([
      db.booking.count({ where }),
      db.booking.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true, pricePerNight: true } },
          room: { select: { id: true, number: true } },
          payments: { select: { amount: true } },
        },
      }),
    ]);

    return ok({
      bookings: bookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        status: b.status,
        guestName: b.guestName,
        guestPhone: b.guestPhone,
        guestEmail: b.guestEmail,
        adults: b.adults,
        children: b.children,
        checkIn: toHotelDateStr(b.checkIn),
        checkOut: toHotelDateStr(b.checkOut),
        nights: b.nights,
        estimatedTotal: b.estimatedTotal,
        paidTotal: b.payments.reduce((s, p) => s + p.amount, 0),
        paymentStatus: b.paymentStatus,
        categoryId: b.category.id,
        categoryName: b.category.name,
        roomId: b.room?.id ?? null,
        roomNumber: b.room?.number ?? null,
        specialRequests: b.specialRequests,
        adminNotes: b.adminNotes,
        expiresAt: b.expiresAt,
        source: b.source,
        createdAt: b.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    return serverError(e);
  }
}
