import { cookies } from "next/headers";
import { issueSession, signup } from "@/lib/auth";
import { sendAdminMail } from "@/lib/mailer";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "");
  if (!email.includes("@") || password.length < 8) {
    return Response.json({ error: "Use a real email and a password of at least 8 characters." }, { status: 400 });
  }
  try {
    const user = await signup(email, password, name);
    if (user.status === "active" && user.role === "admin") {
      const c = issueSession(user);
      (await cookies()).set(c);
      return Response.json({
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        firstAdmin: true,
      });
    }
    await sendAdminMail(
      "NunezTracker: new signup waiting for approval",
      `${user.name} (${user.email}) signed up and is pending activation. Open Admin → Users to approve or reject them.`,
    );
    return Response.json({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      firstAdmin: false,
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Signup failed" }, { status: 400 });
  }
}
