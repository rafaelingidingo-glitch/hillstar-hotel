import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { RESTAURANT_INQUIRY_STATUSES } from "@/lib/booking-constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const status = req.nextUrl.searchParams.get("status") || "";
    const inquiries = await db.restaurantInquiry.findMany({
      where: status && status !== "ALL" ? { status } : {},
      orderBy: { createdAt: "desc" },
    });
    return ok({ inquiries });
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const body = (await req.json().catch(() => null)) as { id?: string; status?: string; adminNotes?: string } | null;
    if (!body?.id) return fail(400, "Missing inquiry id");
    const inquiry = await db.restaurantInquiry.findUnique({ where: { id: body.id } });
    if (!inquiry) return fail(404, "Inquiry not found");
    const data: { status?: string; adminNotes?: string } = {};
    if (body.status !== undefined) {
      if (!RESTAURANT_INQUIRY_STATUSES.includes(body.status as (typeof RESTAURANT_INQUIRY_STATUSES)[number])) {
        return fail(400, "Invalid status");
      }
      data.status = body.status;
    }
    if (body.adminNotes !== undefined) data.adminNotes = body.adminNotes;
    const updated = await db.restaurantInquiry.update({ where: { id: body.id }, data });
    return ok({ inquiry: updated });
  } catch (e) {
    return serverError(e);
  }
}
