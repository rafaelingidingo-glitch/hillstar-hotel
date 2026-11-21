import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { expireStalePendingBookings } from "@/lib/availability";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Pending-booking expiration sweep.
 *
 * Runs automatically in three ways:
 *  1. Inline before availability calculations and admin views.
 *  2. Every 30s inside the Node process (long-running hosts only).
 *  3. Via Vercel Cron (vercel.json) which calls this endpoint with
 *     `Authorization: Bearer <CRON_SECRET>` — Vercel injects that header
 *     automatically when a CRON_SECRET environment variable is configured.
 */

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

async function runSweep(label: string) {
  const count = await expireStalePendingBookings();
  if (count > 0) {
    await db.notification.create({
      data: {
        type: "BOOKING_EXPIRED",
        title: `${count} booking request${count > 1 ? "s" : ""} expired`,
        message: `Expired by the ${label}. Inventory holds were released.`,
        link: "#/admin/reservations?status=EXPIRED",
      },
    });
  }
  return count;
}

/** Vercel Cron entry point (GET, authenticated via CRON_SECRET bearer token). */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin && !isCronAuthorized(req)) return fail(401, "Not authenticated");
    const count = await runSweep("scheduled maintenance sweep");
    return ok({ expired: count });
  } catch (e) {
    return serverError(e);
  }
}

/** Manual trigger from the admin dashboard. */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const count = await runSweep("manual maintenance sweep");
    return ok({ expired: count });
  } catch (e) {
    return serverError(e);
  }
}
