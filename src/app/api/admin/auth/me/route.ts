import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return fail(401, "Not authenticated");
  return ok({ admin });
}
