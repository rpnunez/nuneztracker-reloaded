import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getIdentity } from "../../cursor/identity.js";
import type { User } from "./types";
import { createLocalUser, getUser, getUserByEmail, upsertIdentityUser } from "./store";

const COOKIE = "nt_session";

export async function currentUser(request?: Request): Promise<User | null> {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (sid) {
    const u = await getUser(sid);
    if (u) return u;
  }
  const req =
    request ??
    new Request("http://local", {
      headers: {},
    });
  const identity = await getIdentity(req);
  if (identity.verified && "email" in identity && identity.email) {
    return upsertIdentityUser(identity.email, identity.name ?? identity.email);
  }
  return null;
}

export async function requireUser(request: Request): Promise<User | Response> {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (sid) {
    const u = await getUser(sid);
    if (u) return u;
  }
  const identity = await getIdentity(request);
  if (identity.verified && "email" in identity && identity.email) {
    return upsertIdentityUser(identity.email, identity.name ?? identity.email);
  }
  return Response.json({ error: "Sign in required" }, { status: 401 });
}

export async function signup(email: string, password: string, name: string): Promise<User> {
  const hash = await bcrypt.hash(password, 10);
  return createLocalUser(email, name || email.split("@")[0], hash);
}

export async function login(email: string, password: string): Promise<User> {
  const u = await getUserByEmail(email);
  if (!u?.passwordHash) throw new Error("Invalid email or password");
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) throw new Error("Invalid email or password");
  return u;
}

export function sessionCookie(userId: string) {
  return {
    name: COOKIE,
    value: userId,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export { COOKIE };
