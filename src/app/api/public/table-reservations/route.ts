import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate, clientIp } from "@/lib/api-helpers";
import { tableReservationSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import {
  ensureExpirySweeper,
  notifyAdmins,
  buildTableReservationWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/booking-core";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    ensureExpirySweeper();
    if (!rateLimit(`table-reservation:${clientIp(req)}`, 5, 10 * 60_000)) {
      return fail(429, "Too many submissions. Please wait a few minutes and try again.");
    }
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(tableReservationSchema, body);
    if (!v.success) return fail(400, v.message);
    const input = v.data;

    const settings = await getSettings();
    const inquiry = await db.restaurantInquiry.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email ?? "",
        date: input.date,
        time: input.time,
        partySize: input.partySize,
        note: input.note,
        status: "NEW",
      },
    });

    await notifyAdmins(
      "MEETING_INQUIRY",
      "New table reservation request",
      `${input.name} — table for ${input.partySize} on ${input.date} at ${input.time}.`,
      "#/admin/restaurant?tab=inquiries"
    );

    const message = buildTableReservationWhatsAppMessage({
      name: input.name,
      phone: input.phone,
      date: input.date,
      time: input.time,
      partySize: input.partySize,
      note: input.note || undefined,
    });
    const whatsappUrl = buildWhatsAppUrl(settings.hotel.whatsapp, message);

    return ok({ id: inquiry.id, whatsappUrl }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
