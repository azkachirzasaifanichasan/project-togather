import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "tg_session";

export interface Session {
  uid: string;
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.trim().length < 12) {
    // Fail safe in dev, but never silently run with a weak secret in prod.
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is not configured.");
    }
    return "togather-dev-secret-do-not-use-in-prod";
  }
  return s;
}

function sign(input: string): string {
  return createHmac("sha256", secret()).update(input).digest("base64url");
}

function base64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function createSessionToken(uid: string): string {
  const payload = base64url(JSON.stringify({ uid } satisfies Session));
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined | null): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(fromBase64url(payload)) as Session;
    if (typeof parsed.uid !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return readSessionToken(store.get(COOKIE_NAME)?.value);
}

export async function setSessionCookie(uid: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(uid), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}