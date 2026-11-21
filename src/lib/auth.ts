import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { User } from "./types";
import { COOKIE, sessionCookie, signSession, verifySession } from "./session-token";
import { createLocalUser, getUser, getUserByEmail } from "./store";

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

export async function login(email: string, password: string): Promise<User> {
  const u = await getUserByEmail(email);
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
