import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const [notifications, unread] = await Promise.all([
      db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      db.notification.count({ where: { read: false } }),
    ]);
    return ok({ notifications, unread });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const body = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean };
    if (body.all) {
      await db.notification.updateMany({ where: { read: false }, data: { read: true } });
    } else if (body.id) {
      await db.notification.update({ where: { id: body.id }, data: { read: true } });
    } else {
      return fail(400, "Provide notification id or all=true");
    }
    return ok({ success: true });
  } catch (e) {
    return serverError(e);
  }
}
