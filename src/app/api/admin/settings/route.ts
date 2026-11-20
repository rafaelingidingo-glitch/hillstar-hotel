import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const settings = await getSettings();
    return ok({ settings });
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const body = await readJson(req);
    if (!body || typeof body !== "object") return fail(400, "Invalid settings payload");
    const settings = await updateSettings(body);
    return ok({ settings });
  } catch (e) {
    return serverError(e);
  }
}
