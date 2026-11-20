import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, serverError, readJson, clientIp } from "@/lib/api-helpers";
import { getFreeRoomsForRange, parseDateRange } from "@/lib/availability";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`free-rooms:${clientIp(req)}`, 40, 60_000)) {
      return fail(429, "Too many requests. Please wait a moment.");
    }
    const body = await readJson<{ categoryId?: string; checkIn?: string; checkOut?: string }>(req);
    if (!body?.categoryId || !body.checkIn || !body.checkOut) {
      return fail(400, "categoryId, checkIn and checkOut are required");
    }
    let range;
    try {
      range = parseDateRange(body.checkIn, body.checkOut);
    } catch (e) {
      return fail(400, e instanceof RangeError ? e.message : "Invalid dates");
    }
    const category = await db.roomCategory.findUnique({ where: { id: body.categoryId } });
    if (!category || !category.active) return fail(404, "Room category not found");

    const rooms = await getFreeRoomsForRange(body.categoryId, range.checkIn, range.checkOut);
    return ok({ rooms });
  } catch (e) {
    return serverError(e);
  }
}
