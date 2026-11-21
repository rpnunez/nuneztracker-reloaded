import { cookies } from "next/headers";
import { sessionCookie, signup } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "");
  const password = String(body.password || "");
  const name = String(body.name || "");
  if (!email.includes("@") || password.length < 8) {
    return Response.json({ error: "Use a real email and a password of at least 8 characters." }, { status: 400 });
  }
  try {
    const user = await signup(email, password, name);
    const c = sessionCookie(user.id);
    (await cookies()).set(c);
    return Response.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Signup failed" }, { status: 400 });
  }
}
