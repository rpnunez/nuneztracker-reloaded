import { cookies } from "next/headers";
import { getIdentity } from "../../cursor/identity.js";
import { COOKIE } from "./auth";
import { getUser, upsertIdentityUser } from "./store";

export async function pageUser() {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (sid) {
    const u = await getUser(sid);
    if (u) return u;
  }
  const identity = await getIdentity({ headers: {} });
  if (identity.verified && "email" in identity && identity.email) {
    return upsertIdentityUser(identity.email, identity.name ?? identity.email);
  }
  return null;
}
