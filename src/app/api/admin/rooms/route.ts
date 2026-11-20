import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { roomSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const rooms = await db.room.findMany({
      orderBy: { number: "asc" },
      include: { category: { select: { id: true, name: true } } },
    });
    return ok({
      rooms: rooms.map((r) => ({
        id: r.id,
        number: r.number,
        categoryId: r.categoryId,
        categoryName: r.category.name,
        floor: r.floor,
        notes: r.notes,
        status: r.status,
      })),
    });
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
    const v = validate(roomSchema, body);
    if (!v.success) return fail(400, v.message);

    const category = await db.roomCategory.findUnique({ where: { id: v.data.categoryId } });
    if (!category) return fail(404, "Category not found");

    const exists = await db.room.findUnique({ where: { number: v.data.number } });
    if (exists) return fail(409, "A room with this number already exists.");

    const room = await db.room.create({ data: v.data });
    return ok({ room }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
