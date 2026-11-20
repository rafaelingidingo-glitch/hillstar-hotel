import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, serverError, readJson, validate, clientIp } from "@/lib/api-helpers";
import { availabilitySearchSchema } from "@/lib/validation";
import { getCategoryAvailabilityForRange, parseDateRange } from "@/lib/availability";
import { rateLimit } from "@/lib/rate-limit";
import { ensureExpirySweeper } from "@/lib/booking-core";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    ensureExpirySweeper();
    if (!rateLimit(`availability:${clientIp(req)}`, 30, 60_000)) {
      return fail(429, "Too many searches. Please wait a moment and try again.");
    }
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(availabilitySearchSchema, body);
    if (!v.success) return fail(400, v.message);

    let range;
    try {
      range = parseDateRange(v.data.checkIn, v.data.checkOut);
    } catch (e) {
      return fail(400, e instanceof RangeError ? e.message : "Invalid dates");
    }

    const categories = await db.roomCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const availability = await getCategoryAvailabilityForRange(range.checkIn, range.checkOut, categories);

    const results = categories.map((c) => {
      const av = availability.get(c.id);
      let capacityMessage: string | null = null;
      if (v.data.adults > c.maxAdults) {
        capacityMessage = `This room type accommodates up to ${c.maxAdults} adults.`;
      } else if (v.data.adults + v.data.children > c.maxTotalGuests) {
        capacityMessage = `Total guests exceed this room type's maximum of ${c.maxTotalGuests}.`;
      } else if (v.data.children > c.maxChildren) {
        capacityMessage = `This room type accommodates up to ${c.maxChildren} children.`;
      }
      return {
        categoryId: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        coverImage: c.coverImage,
        images: (() => { try { return JSON.parse(c.images) as string[]; } catch { return []; } })(),
        amenities: (() => { try { return JSON.parse(c.amenities) as string[]; } catch { return []; } })(),
        bedConfiguration: c.bedConfiguration,
        sizeSqm: c.sizeSqm,
        maxAdults: c.maxAdults,
        maxChildren: c.maxChildren,
        maxTotalGuests: c.maxTotalGuests,
        pricePerNight: c.pricePerNight,
        available: av?.available ?? 0,
        totalSellable: av?.totalSellable ?? 0,
        capacityMessage,
        nights: range.nights,
        totalForStay: c.pricePerNight * range.nights,
      };
    });

    return ok({
      checkIn: v.data.checkIn,
      checkOut: v.data.checkOut,
      adults: v.data.adults,
      children: v.data.children,
      nights: range.nights,
      categories: results,
    });
  } catch (e) {
    return serverError(e);
  }
}
