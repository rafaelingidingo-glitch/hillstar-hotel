import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, serverError } from "@/lib/api-helpers";
import { getSettings } from "@/lib/settings";
import { ensureExpirySweeper } from "@/lib/booking-core";

export const dynamic = "force-dynamic";

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Single hydration endpoint for the public SPA. */
export async function GET(_req: NextRequest) {
  try {
    ensureExpirySweeper();
    const [settings, categories, amenities, gallery, menuCats, meetingRooms] = await Promise.all([
      getSettings(),
      db.roomCategory.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { rooms: { where: { status: "AVAILABLE" }, select: { id: true } } },
      }),
      db.amenity.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      db.galleryImage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      db.menuCategory.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: { items: { where: { available: true }, orderBy: { sortOrder: "asc" } } },
      }),
      db.meetingRoom.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    ]);

    return ok({
      settings,
      roomCategories: categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        pricePerNight: c.pricePerNight,
        maxAdults: c.maxAdults,
        maxChildren: c.maxChildren,
        maxTotalGuests: c.maxTotalGuests,
        bedConfiguration: c.bedConfiguration,
        sizeSqm: c.sizeSqm,
        amenities: parseJsonArray(c.amenities),
        coverImage: c.coverImage,
        images: parseJsonArray(c.images),
        featured: c.featured,
        roomCount: c.rooms.length,
      })),
      amenities: amenities.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
      })),
      gallery: gallery.map((g) => ({
        id: g.id,
        url: g.url,
        caption: g.caption,
        category: g.category,
      })),
      menu: menuCats.map((mc) => ({
        id: mc.id,
        name: mc.name,
        description: mc.description,
        items: mc.items.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price,
          image: i.image,
          featured: i.featured,
        })),
      })),
      meetingRooms: meetingRooms.map((m) => {
        let seating: { name: string; capacity: number }[] = [];
        try {
          const s = JSON.parse(m.seating);
          if (Array.isArray(s)) seating = s;
        } catch { /* ignore */ }
        return {
          id: m.id,
          slug: m.slug,
          name: m.name,
          description: m.description,
          capacity: m.capacity,
          seating,
          equipment: parseJsonArray(m.equipment),
          image: m.image,
          pricingNote: m.pricingNote,
          hourlyRate: m.hourlyRate,
        };
      }),
    });
  } catch (e) {
    return serverError(e);
  }
}
