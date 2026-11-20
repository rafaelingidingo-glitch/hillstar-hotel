import { NextRequest } from "next/server";
import { ok, fail, serverError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
      return fail(400, "Image exceeds the 5MB size limit.");
    }
    const ext = ALLOWED_TYPES[file.type];
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, name), buf);
    return ok({ url: `/uploads/${name}` }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
