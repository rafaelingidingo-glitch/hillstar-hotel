import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { expireStalePendingBookings } from "@/lib/availability";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Manual trigger of the expiration sweep (also runs automatically every 30s). */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const count = await expireStalePendingBookings();
    if (count > 0) {
      await db.notification.create({
        data: {
          type: "BOOKING_EXPIRED",
          title: `${count} booking request${count > 1 ? "s" : ""} expired`,
          message: "Expired by the manual maintenance sweep. Inventory holds were released.",
          link: "#/admin/reservations?status=EXPIRED",
        },
      });
    }
    return ok({ expired: count });
  } catch (e) {
    return serverError(e);
  }
}
