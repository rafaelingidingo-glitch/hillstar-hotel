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
      | { caption?: string; category?: string; sortOrder?: number; active?: boolean; url?: string }
      | null;
    if (!body) return fail(400, "Invalid request body");
    const existing = await db.galleryImage.findUnique({ where: { id } });
    if (!existing) return fail(404, "Gallery image not found");
    const image = await db.galleryImage.update({
      where: { id },
      data: {
        ...(body.caption !== undefined ? { caption: body.caption } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.url !== undefined ? { url: body.url } : {}),
      },
    });
    return ok({ image });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const existing = await db.galleryImage.findUnique({ where: { id } });
    if (!existing) return fail(404, "Gallery image not found");
    await db.galleryImage.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
