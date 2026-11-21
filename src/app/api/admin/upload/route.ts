import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Uploaded images are stored in the database (UploadedImage.bytea) and served
// from /api/uploads/[id]. The filesystem on serverless platforms such as
// Vercel is read-only, so disk storage is not an option.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Vercel limits serverless request bodies to ~4.5MB — stay safely below it.
const MAX_SIZE = 4 * 1024 * 1024; // 4MB

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return fail(401, "Not authenticated");

    const form = await req.formData().catch(() => null);
    if (!form) return fail(400, "Expected multipart form data");
    const file = form.get("file");
    if (!(file instanceof File)) return fail(400, "Missing file field");
    if (!ALLOWED_TYPES[file.type]) {
      return fail(400, "Only JPEG, PNG, WebP or GIF images are allowed.");
    }
    if (file.size > MAX_SIZE) {
      return fail(400, "Image exceeds the 4MB size limit.");
    }
    const ext = ALLOWED_TYPES[file.type];
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const record = await db.uploadedImage.create({
      data: { filename: name, mimeType: file.type, size: buf.length, data: buf },
    });
    return ok({ url: `/api/uploads/${record.id}` }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
