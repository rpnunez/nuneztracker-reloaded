import { ensureBootstrapAdmin } from "@/lib/bootstrap-admin";
import { signup } from "@/lib/auth";
import { sendAdminMail } from "@/lib/mailer";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  await ensureBootstrapAdmin();
  if (!rateLimit(clientKey(request, "signup"), 5, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many sign-up attempts. Try again later." }, { status: 429 });
  }
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "");
  if (!email.includes("@") || password.length < 8) {
    return Response.json({ error: "Use a real email and a password of at least 8 characters." }, { status: 400 });
  }
  try {
    const user = await signup(email, password, name);
    await sendAdminMail(
      "NunezTracker: new signup waiting for approval",
      `${user.name} (${user.email}) signed up and is pending activation. Open Admin → Users to approve or reject them.`,
    );
    return Response.json({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Signup failed" }, { status: 400 });
  }
}
