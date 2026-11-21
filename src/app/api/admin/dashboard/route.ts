import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toHotelDateStr, toUtcMidnight, addDays, parseHotelDate } from "@/lib/tz";
import { expireStalePendingBookings } from "@/lib/availability";
import { ensureExpirySweeper } from "@/lib/booking-core";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    ensureExpirySweeper();
    await expireStalePendingBookings();

    const now = new Date();
    const todayMidnight = toUtcMidnight(now);
    const tomorrowMidnight = addDays(todayMidnight, 1);
    const todayStr = toHotelDateStr(now);

    const [
      totalBookings,
      pendingCount,
      confirmedUpcoming,
      checkedInCurrent,
      todayCheckIns,
      todayCheckOuts,
      allRooms,
      monthPayments,
      restaurantNew,
      meetingNew,
      monthStartBookings,
      unreadNotifications,
      checkedInBookings,
      trendBookings,
      recentBookings,
      sixMonthPayments,
    ] = await Promise.all([
      db.booking.count(),
      db.booking.count({ where: { status: "PENDING" } }),
      db.booking.count({ where: { status: "CONFIRMED" } }),
      db.booking.count({ where: { status: "CHECKED_IN" } }),
      db.booking.findMany({
        where: { status: "CONFIRMED", checkIn: { lt: tomorrowMidnight }, checkOut: { gt: todayMidnight } },
        select: { id: true },
      }),
      db.booking.findMany({
        where: { status: "CHECKED_IN", checkOut: { lt: tomorrowMidnight, gt: todayMidnight } },
        select: { id: true },
      }),
      db.room.findMany({ select: { id: true, status: true, categoryId: true } }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: {
          recordedAt: {
            gte: parseHotelDate(todayStr.slice(0, 8) + "01"),
            lt: tomorrowMidnight,
          },
        },
      }),
      db.restaurantInquiry.count({ where: { status: "NEW" } }),
      db.meetingInquiry.count({ where: { status: "NEW" } }),
      db.booking.findMany({
        where: {
          createdAt: { gte: parseHotelDate(todayStr.slice(0, 8) + "01") },
        },
        select: { id: true, status: true },
      }),
      db.notification.count({ where: { read: false } }),
      db.booking.findMany({
        where: { status: "CHECKED_IN" },
        select: { roomId: true, checkIn: true, checkOut: true },
      }),
      db.booking.findMany({
        where: { status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } },
        select: { checkIn: true, checkOut: true, roomId: true, status: true },
      }),
      db.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { category: { select: { name: true } }, room: { select: { number: true } } },
      }),
      // One query for all payments in the last 6 months — monthly buckets are
      // computed in memory (avoids 6 sequential aggregate round-trips).
      db.payment.findMany({
        where: { recordedAt: { gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)) } },
        select: { amount: true, recordedAt: true },
      }),
    ]);

    const sellable = allRooms.filter((r) => r.status === "AVAILABLE").length;
    const maintenance = allRooms.filter((r) => r.status === "MAINTENANCE").length;

    // Currently occupied: CHECKED_IN bookings active right now
    const occupiedRoomIds = new Set(
      checkedInBookings
        .filter((b) => b.roomId && b.checkIn <= now && b.checkOut > now)
        .map((b) => b.roomId as string)
    );

    // Occupancy trend: last 14 days (computed in memory from one query)
    const days: { date: string; occupancy: number; arrivals: number; departures: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = addDays(todayMidnight, -i);
      const nextDay = addDays(day, 1);
      const dayStr = toHotelDateStr(day);
      const occupied = trendBookings.filter(
        (b) => b.roomId && b.checkIn.getTime() < nextDay.getTime() && b.checkOut.getTime() > day.getTime()
      ).length;
      const arrivals = trendBookings.filter((b) => toHotelDateStr(b.checkIn) === dayStr).length;
      const departures = trendBookings.filter((b) => toHotelDateStr(b.checkOut) === dayStr).length;
      days.push({
        date: dayStr,
        occupancy: sellable > 0 ? Math.round((Math.min(occupied, sellable) / sellable) * 100) : 0,
        arrivals,
        departures,
      });
    }

    // Revenue by month: last 6 months, bucketed in memory from one query
    const revenueByMonth: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
      const revenue = sixMonthPayments
        .filter((p) => p.recordedAt >= d && p.recordedAt < monthEnd)
        .reduce((sum, p) => sum + p.amount, 0);
      const label = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(d);
      revenueByMonth.push({ month: `${label}`, revenue });
    }

    // Bookings created this month by status
    const monthStatusCounts: Record<string, number> = {};
    for (const b of monthStartBookings) {
      monthStatusCounts[b.status] = (monthStatusCounts[b.status] || 0) + 1;
    }

    return ok({
      stats: {
        totalReservations: totalBookings,
        pendingRequests: pendingCount,
        confirmedBookings: confirmedUpcoming,
        currentlyCheckedIn: checkedInCurrent,
        todayCheckIns: todayCheckIns.length,
        todayCheckOuts: todayCheckOuts.length,
        occupiedRooms: occupiedRoomIds.size,
        availableRooms: Math.max(0, sellable - occupiedRoomIds.size),
        maintenanceRooms: maintenance,
        totalSellableRooms: sellable,
        monthlyRevenue: monthPayments._sum.amount ?? 0,
        restaurantNewInquiries: restaurantNew,
        meetingNewInquiries: meetingNew,
        unreadNotifications,
      },
      occupancyTrend: days,
      revenueByMonth,
      monthStatusCounts,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        status: b.status,
        guestName: b.guestName,
        categoryName: b.category.name,
        roomNumber: b.room?.number ?? null,
        checkIn: toHotelDateStr(b.checkIn),
        checkOut: toHotelDateStr(b.checkOut),
        estimatedTotal: b.estimatedTotal,
        createdAt: b.createdAt,
      })),
    });
  } catch (e) {
    return serverError(e);
  }
}
