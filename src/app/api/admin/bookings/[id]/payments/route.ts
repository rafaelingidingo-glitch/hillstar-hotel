import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { paymentSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(paymentSchema, body);
    if (!v.success) return fail(400, v.message);

    const booking = await db.booking.findUnique({ where: { id }, include: { payments: true } });
    if (!booking) return fail(404, "Booking not found");
    if (["REJECTED", "CANCELLED", "EXPIRED"].includes(booking.status)) {
      return fail(400, "Payments cannot be recorded on cancelled or expired bookings.");
    }

    const payment = await db.payment.create({
      data: {
        bookingId: id,
        amount: v.data.amount,
        method: v.data.method,
        reference: v.data.reference,
        note: v.data.note,
        recordedBy: admin.username,
      },
    });

    const paidTotal = booking.payments.reduce((s, p) => s + p.amount, 0) + v.data.amount;
    const paymentStatus =
      paidTotal >= booking.estimatedTotal ? "PAID" : paidTotal > 0 ? "PARTIAL" : "UNPAID";
    await db.booking.update({ where: { id }, data: { paymentStatus } });

    return ok({ payment, paymentStatus }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
