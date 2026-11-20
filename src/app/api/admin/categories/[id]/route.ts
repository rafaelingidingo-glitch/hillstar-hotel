import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const { id } = await ctx.params;
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(categorySchema.partial(), body);
    if (!v.success) return fail(400, v.message);
    const d = v.data;

    const existing = await db.roomCategory.findUnique({ where: { id } });
    if (!existing) return fail(404, "Category not found");

    if (d.slug && d.slug !== existing.slug) {
      const clash = await db.roomCategory.findUnique({ where: { slug: d.slug } });
      if (clash) return fail(409, "A category with this slug already exists.");
    }

    const category = await db.roomCategory.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.slug !== undefined ? { slug: d.slug } : {}),
        ...(d.tagline !== undefined ? { tagline: d.tagline } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.pricePerNight !== undefined ? { pricePerNight: d.pricePerNight } : {}),
        ...(d.maxAdults !== undefined ? { maxAdults: d.maxAdults } : {}),
        ...(d.maxChildren !== undefined ? { maxChildren: d.maxChildren } : {}),
        ...(d.maxTotalGuests !== undefined
          ? { maxTotalGuests: Math.max(d.maxTotalGuests, d.maxAdults ?? existing.maxAdults) }
          : {}),
        ...(d.bedConfiguration !== undefined ? { bedConfiguration: d.bedConfiguration } : {}),
        ...(d.sizeSqm !== undefined ? { sizeSqm: d.sizeSqm } : {}),
        ...(d.amenities !== undefined ? { amenities: JSON.stringify(d.amenities) } : {}),
        ...(d.coverImage !== undefined ? { coverImage: d.coverImage } : {}),
        ...(d.images !== undefined ? { images: JSON.stringify(d.images) } : {}),
        ...(d.featured !== undefined ? { featured: d.featured } : {}),
        ...(d.active !== undefined ? { active: d.active } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
      },
    });
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
    const existing = await db.roomCategory.findUnique({
      where: { id },
      include: { rooms: true, bookings: { where: { status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] } }, take: 1 } },
    });
    if (!existing) return fail(404, "Category not found");
    if (existing.bookings.length > 0) {
      return fail(400, "This category has active bookings. Resolve them before deleting.");
    }
    if (existing.rooms.length > 0) {
      return fail(400, "Remove or reassign the physical rooms in this category first.");
    }
    await db.roomCategory.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
