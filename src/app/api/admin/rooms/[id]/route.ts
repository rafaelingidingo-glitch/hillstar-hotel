import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { roomSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(roomSchema.partial(), body);
    if (!v.success) return fail(400, v.message);
    const d = v.data;

    const existing = await db.room.findUnique({ where: { id } });
    if (!existing) return fail(404, "Room not found");

    if (d.number && d.number !== existing.number) {
      const clash = await db.room.findUnique({ where: { number: d.number } });
      if (clash) return fail(409, "A room with this number already exists.");
    }
    if (d.categoryId && d.categoryId !== existing.categoryId) {
      const activeBooking = await db.booking.findFirst({
        where: { roomId: id, status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] } },
      });
      if (activeBooking) {
        return fail(400, "This room has active bookings. Resolve them before changing its category.");
      }
      const category = await db.roomCategory.findUnique({ where: { id: d.categoryId } });
      if (!category) return fail(404, "Category not found");
    }

    const room = await db.room.update({ where: { id }, data: d });
    return ok({ room });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const existing = await db.room.findUnique({
      where: { id },
      include: { bookings: { where: { status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] } }, take: 1 } },
    });
    if (!existing) return fail(404, "Room not found");
    if (existing.bookings.length > 0) {
      return fail(400, "This room has active bookings. Resolve them before deleting.");
    }
    await db.room.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
