import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const COOKIE = "nt_session";
const MAX_AGE = 60 * 60 * 24 * 14;

function secret(): string {
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;
  const g = globalThis as unknown as { __ntSessionSecret?: string };
  if (!g.__ntSessionSecret) g.__ntSessionSecret = randomBytes(32).toString("hex");
  return g.__ntSessionSecret;
}

function b64url(buf: Buffer | string) {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64url");
}

export function signSession(userId: string, email: string): string {
  const payload = b64url(
    JSON.stringify({ sub: userId, email, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + MAX_AGE }),
  );
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): { userId: string; email: string } | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      email?: string;
      exp?: number;
    };
    if (!data.sub || !data.email || typeof data.exp !== "number") return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: data.sub, email: data.email };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
    secure: Boolean(process.env.CURSOR_APP_ID),
  };
}

export { COOKIE, MAX_AGE };
