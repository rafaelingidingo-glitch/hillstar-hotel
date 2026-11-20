import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validation";

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
    const categories = await db.roomCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { rooms: { orderBy: { number: "asc" } } },
    });
    return ok({
      categories: categories.map((c) => ({
        ...c,
        amenities: (() => { try { return JSON.parse(c.amenities) as string[]; } catch { return []; } })(),
        images: (() => { try { return JSON.parse(c.images) as string[]; } catch { return []; } })(),
        rooms: c.rooms.map((r) => ({
          id: r.id,
          number: r.number,
          floor: r.floor,
          status: r.status,
          notes: r.notes,
        })),
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
    const v = validate(categorySchema, body);
    if (!v.success) return fail(400, v.message);
    const data = v.data;
    const slug = data.slug || slugify(data.name);

    const exists = await db.roomCategory.findUnique({ where: { slug } });
    if (exists) return fail(409, "A category with this slug already exists.");

    const category = await db.roomCategory.create({
      data: {
        slug,
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        pricePerNight: data.pricePerNight,
        maxAdults: data.maxAdults,
        maxChildren: data.maxChildren,
        maxTotalGuests: Math.max(data.maxTotalGuests, data.maxAdults),
        bedConfiguration: data.bedConfiguration,
        sizeSqm: data.sizeSqm ?? null,
        amenities: JSON.stringify(data.amenities),
        coverImage: data.coverImage,
        images: JSON.stringify(data.images),
        featured: data.featured,
        active: data.active,
        sortOrder: data.sortOrder,
      },
    });
    return ok({ category }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
