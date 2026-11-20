import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate, clientIp } from "@/lib/api-helpers";
import { meetingInquirySchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import {
  ensureExpirySweeper,
  generateInquiryReference,
  notifyAdmins,
  buildMeetingInquiryWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/booking-core";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    ensureExpirySweeper();
    if (!rateLimit(`meeting-inquiry:${clientIp(req)}`, 5, 10 * 60_000)) {
      return fail(429, "Too many submissions. Please wait a few minutes and try again.");
    }
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(meetingInquirySchema, body);
    if (!v.success) return fail(400, v.message);
    const input = v.data;

    const settings = await getSettings();
    const reference = await generateInquiryReference("MTG");

    const inquiry = await db.meetingInquiry.create({
      data: {
        reference,
        organization: input.organization,
        contactPerson: input.contactPerson,
        email: input.email,
        phone: input.phone,
        eventType: input.eventType,
        attendees: input.attendees,
        preferredDate: input.preferredDate,
        duration: input.duration,
        roomId: input.roomId || null,
        requirements: input.requirements,
        status: "NEW",
      },
    });

    await notifyAdmins(
      "MEETING_INQUIRY",
      `New meeting inquiry ${reference}`,
      `${input.organization} (${input.contactPerson}) — ${input.eventType}, ${input.attendees} attendees.`,
      "#/admin/meetings"
    );

    const message = buildMeetingInquiryWhatsAppMessage({
      reference,
      organization: input.organization,
      contactPerson: input.contactPerson,
      phone: input.phone,
      eventType: input.eventType,
      attendees: input.attendees,
      preferredDate: input.preferredDate,
    });
    const whatsappUrl = buildWhatsAppUrl(settings.hotel.whatsapp, message);

    return ok({ reference, whatsappUrl }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
