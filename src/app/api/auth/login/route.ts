import { cookies } from "next/headers";
import { login, sessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const user = await login(String(body.email || ""), String(body.password || ""));
    const c = sessionCookie(user.id);
    (await cookies()).set(c);
    return Response.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Login failed" }, { status: 400 });
  }
}
