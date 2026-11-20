import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate, clientIp } from "@/lib/api-helpers";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { ensureExpirySweeper } from "@/lib/booking-core";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    ensureExpirySweeper();
    if (!rateLimit(`login:${clientIp(req)}`, 8, 5 * 60_000)) {
      return fail(429, "Too many login attempts. Please try again in a few minutes.");
    }
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(loginSchema, body);
    if (!v.success) return fail(400, v.message);

    const user = await db.adminUser.findUnique({ where: { username: v.data.username.trim() } });
    if (!user || !user.active || !verifyPassword(v.data.password, user.passwordHash)) {
      return fail(401, "Invalid username or password.");
    }
    await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return setSessionCookie(user.username, user.name, user.role, user.id);
  } catch (e) {
    return serverError(e);
  }
}
