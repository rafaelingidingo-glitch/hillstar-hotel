import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Serves admin-uploaded images from the database.
 * URLs are of the form /api/uploads/<id> and are immutable — content for a
 * given id never changes, so aggressive caching is safe.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = await db.uploadedImage.findUnique({
    where: { id },
    select: { data: true, mimeType: true, size: true },
  });
  if (!image) {
    return new Response("Not found", { status: 404 });
  }
  const bytes = new Uint8Array(image.data);
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
    },
  });
}
