import { cookies } from "next/headers";
import { COOKIE, verifySession } from "./session-token";
import { getUser } from "./store";

export async function pageUser() {
  const parsed = verifySession((await cookies()).get(COOKIE)?.value);
  if (!parsed) return null;
  const u = await getUser(parsed.userId);
  if (!u || u.email !== parsed.email || u.status !== "active") return null;
  return u;
}
