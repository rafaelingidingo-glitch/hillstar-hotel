import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as
      | { name?: string; description?: string; icon?: string; sortOrder?: number; active?: boolean }
      | null;
    if (!body) return fail(400, "Invalid request body");
    const existing = await db.amenity.findUnique({ where: { id } });
    if (!existing) return fail(404, "Amenity not found");
    const amenity = await db.amenity.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    });
    return ok({ amenity });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const existing = await db.amenity.findUnique({ where: { id } });
    if (!existing) return fail(404, "Amenity not found");
    await db.amenity.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
