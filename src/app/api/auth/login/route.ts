import { cookies } from "next/headers";
import { issueSession, login } from "@/lib/auth";
import { ensureBootstrapAdmin } from "@/lib/bootstrap-admin";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await ensureBootstrapAdmin();
  } catch {
    /* login still proceeds if seed fails */
  }
  if (!rateLimit(clientKey(request, "login"), 20, 15 * 60 * 1000)) {
    return Response.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429 });
  }
  const body = await request.json();
  try {
    const user = await login(String(body.email || ""), String(body.password || ""));
    const c = issueSession(user);
    (await cookies()).set(c);
    return Response.json({ id: user.id, email: user.email, name: user.name, status: user.status });
  } catch (e) {
    const code = (e as Error & { code?: string }).code;
    const status = code === "pending" ? 403 : 400;
    return Response.json({ error: e instanceof Error ? e.message : "Login failed", code }, { status });
  }
}
