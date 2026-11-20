import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(status: number, error: string, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ok: false, error, ...(extra || {}) }, { status });
}

export async function readJson<T = unknown>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function validate<T>(schema: ZodSchema<T>, body: unknown):
  { success: true; data: T } | { success: false; message: string } {
  const res = schema.safeParse(body);
  if (res.success) return { success: true, data: res.data };
  const first = res.error.issues[0];
  const path = first?.path?.length ? `${first.path.join(".")}: ` : "";
  return { success: false, message: `${path}${first?.message || "Invalid input"}` };
}

export function serverError(e: unknown): NextResponse {
  console.error("[api-error]", e);
  const message = e instanceof Error ? e.message : "Unexpected server error";
  return fail(500, message);
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}
