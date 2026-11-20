import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { menuCategorySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(menuCategorySchema.partial(), body);
    if (!v.success) return fail(400, v.message);
    const existing = await db.menuCategory.findUnique({ where: { id } });
    if (!existing) return fail(404, "Menu category not found");
    const category = await db.menuCategory.update({ where: { id }, data: v.data });
    return ok({ category });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const existing = await db.menuCategory.findUnique({ where: { id }, include: { items: true } });
    if (!existing) return fail(404, "Menu category not found");
    if (existing.items.length > 0) {
      return fail(400, "Remove the menu items in this category first.");
    }
    await db.menuCategory.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
