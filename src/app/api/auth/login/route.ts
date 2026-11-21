import { cookies } from "next/headers";
import { issueSession, login } from "@/lib/auth";

export async function POST(request: Request) {
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
