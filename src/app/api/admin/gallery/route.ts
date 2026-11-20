import { NextRequest } from "next/server";
import { ok, fail, serverError, readJson, validate } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { gallerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const images = await db.galleryImage.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    return ok({ images });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");
    const body = await readJson(req);
    if (!body) return fail(400, "Invalid request body");
    const v = validate(gallerySchema, body);
    if (!v.success) return fail(400, v.message);
    const image = await db.galleryImage.create({ data: v.data });
    return ok({ image }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
