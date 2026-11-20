import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { meetingRoomSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const rooms = await db.meetingRoom.findMany({ orderBy: { sortOrder: "asc" } });
    return ok({
      rooms: rooms.map((r) => ({
        ...r,
        seating: (() => { try { return JSON.parse(r.seating) as { name: string; capacity: number }[]; } catch { return []; } })(),
        equipment: (() => { try { return JSON.parse(r.equipment) as string[]; } catch { return []; } })(),
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
    const v = validate(meetingRoomSchema, body);
    if (!v.success) return fail(400, v.message);
    const d = v.data;
    const slug = d.slug || slugify(d.name);
    const exists = await db.meetingRoom.findUnique({ where: { slug } });
    if (exists) return fail(409, "A meeting room with this slug already exists.");
    const room = await db.meetingRoom.create({
      data: {
        slug,
        name: d.name,
        description: d.description,
        capacity: d.capacity,
        seating: JSON.stringify(d.seating),
        equipment: JSON.stringify(d.equipment),
        image: d.image,
        pricingNote: d.pricingNote,
        hourlyRate: d.hourlyRate ?? null,
        active: d.active,
        sortOrder: d.sortOrder,
      },
    });
    return ok({ room }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
