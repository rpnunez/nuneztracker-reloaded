import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import type { User } from "./types";
import { BOOTSTRAP_ADMIN_EMAIL } from "./bootstrap-admin";
import { COOKIE, sessionCookie, signSession, verifySession } from "./session-token";
import { createBootstrapAdmin, createLocalUser, getUser, getUserByEmail, markAdminSeeded } from "./store";

export async function requireUser(_request: Request): Promise<User | Response> {
  const jar = await cookies();
  const parsed = verifySession(jar.get(COOKIE)?.value);
  if (!parsed) return Response.json({ error: "Sign in required" }, { status: 401 });
  const u = await getUser(parsed.userId);
  if (!u || u.email !== parsed.email) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (u.status === "pending") return Response.json({ error: "Account pending approval", code: "pending" }, { status: 403 });
  if (u.status !== "active") return Response.json({ error: "Account is not active" }, { status: 403 });
  return u;
}

export async function requireAdmin(request: Request): Promise<User | Response> {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  return user;
}

export async function signup(email: string, password: string, name: string): Promise<User> {
  const hash = await bcrypt.hash(password, 10);
  return createLocalUser(email, name || email.split("@")[0], hash);
}

function samePassword(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function login(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase();
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();
  if (normalized === BOOTSTRAP_ADMIN_EMAIL && envPassword && samePassword(password, envPassword)) {
    const hash = await bcrypt.hash(envPassword, 10);
    const admin = await createBootstrapAdmin(BOOTSTRAP_ADMIN_EMAIL, "Raymond", hash);
    await markAdminSeeded();
    return admin;
  }
  const u = await getUserByEmail(normalized);
  if (!u?.passwordHash) throw new Error("Invalid email or password");
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) throw new Error("Invalid email or password");
  if (u.status === "pending") {
    const err = new Error("Your account is waiting for admin approval.");
    (err as Error & { code?: string }).code = "pending";
    throw err;
  }
  if (u.status !== "active") throw new Error("This account was not approved.");
  return u;
}

export function issueSession(user: User) {
  return sessionCookie(signSession(user.id, user.email));
}

export { COOKIE };
