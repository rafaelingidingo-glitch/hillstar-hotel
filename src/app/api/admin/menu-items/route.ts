import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { menuItemSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const items = await db.menuItem.findMany({
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      include: { category: { select: { name: true } } },
    });
    return ok({ items });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(menuItemSchema, body);
    if (!v.success) return fail(400, v.message);
    const category = await db.menuCategory.findUnique({ where: { id: v.data.categoryId } });
    if (!category) return fail(404, "Menu category not found");
    const item = await db.menuItem.create({ data: v.data });
    return ok({ item }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
