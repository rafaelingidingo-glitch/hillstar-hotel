import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const COOKIE_NAME = "hillstar_admin_session";
const SESSION_HOURS = 8;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[auth] AUTH_SECRET is not set — falling back to an insecure development secret. " +
          "Set a strong AUTH_SECRET environment variable in production."
      );
    }
    return "hillstar-dev-secret-change-in-production";
  }
  return secret;
}

// ---------------------------------------------------------------------------
// Passwords (scrypt, no external deps)
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

// ---------------------------------------------------------------------------
// Tokens (HMAC-signed compact tokens)
// ---------------------------------------------------------------------------

interface TokenPayload {
  sub: string;
  username: string;
  name: string;
  role: string;
  exp: number;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

export function signToken(payload: Omit<TokenPayload, "exp">): string {
  const full: TokenPayload = { ...payload, exp: Date.now() + SESSION_HOURS * 3600 * 1000 };
  const body = b64url(JSON.stringify(full));
  const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

export function setSessionCookie(username: string, name: string, role: string, sub: string): NextResponse {
  const token = signToken({ sub, username, name, role });
  const res = NextResponse.json({ ok: true, data: { username, name, role } });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // Secure cookies in production (HTTPS); relaxed locally over plain HTTP.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return res;
}

export function clearSessionCookie(): NextResponse {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export function getSessionFromRequest(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export interface AdminSession {
  id: string;
  username: string;
  name: string;
  role: string;
}

/** Validate the session against the DB (user must still exist and be active). */
export async function requireAdmin(req: NextRequest): Promise<AdminSession | null> {
  const payload = getSessionFromRequest(req);
  if (!payload) return null;
  const user = await db.adminUser.findUnique({ where: { username: payload.username } });
  if (!user || !user.active) return null;
  return { id: user.id, username: user.username, name: user.name, role: user.role };
}
