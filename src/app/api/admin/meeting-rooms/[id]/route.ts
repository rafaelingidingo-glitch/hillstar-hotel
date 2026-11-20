import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { meetingRoomSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(meetingRoomSchema.partial(), body);
    if (!v.success) return fail(400, v.message);
    const d = v.data;
    const existing = await db.meetingRoom.findUnique({ where: { id } });
    if (!existing) return fail(404, "Meeting room not found");
    if (d.slug && d.slug !== existing.slug) {
      const clash = await db.meetingRoom.findUnique({ where: { slug: d.slug } });
      if (clash) return fail(409, "A meeting room with this slug already exists.");
    }
    const room = await db.meetingRoom.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.slug !== undefined ? { slug: d.slug } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.capacity !== undefined ? { capacity: d.capacity } : {}),
        ...(d.seating !== undefined ? { seating: JSON.stringify(d.seating) } : {}),
        ...(d.equipment !== undefined ? { equipment: JSON.stringify(d.equipment) } : {}),
        ...(d.image !== undefined ? { image: d.image } : {}),
        ...(d.pricingNote !== undefined ? { pricingNote: d.pricingNote } : {}),
        ...(d.hourlyRate !== undefined ? { hourlyRate: d.hourlyRate } : {}),
        ...(d.active !== undefined ? { active: d.active } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
      },
    });
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
    const existing = await db.meetingRoom.findUnique({ where: { id } });
    if (!existing) return fail(404, "Meeting room not found");
    const linked = await db.meetingInquiry.findFirst({ where: { roomId: id } });
    if (linked) {
      // detach instead of blocking
      await db.meetingInquiry.updateMany({ where: { roomId: id }, data: { roomId: null } });
    }
    await db.meetingRoom.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
