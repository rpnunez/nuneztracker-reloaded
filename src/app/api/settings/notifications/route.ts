import { requireAdmin } from "@/lib/auth";
import { getNotificationEmail, setNotificationEmail } from "@/lib/store";

export async function GET(request: Request) {
  const user = await requireAdmin(request);
  if (user instanceof Response) return user;
  return Response.json({
    notificationEmail: await getNotificationEmail(),
    sampleMail: !process.env.RESEND_API_KEY,
  });
}

export async function PATCH(request: Request) {
  const user = await requireAdmin(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  const email = String(body.notificationEmail || "").trim();
  if (email && !email.includes("@")) return Response.json({ error: "Enter a valid email" }, { status: 400 });
  await setNotificationEmail(email);
  return Response.json({ notificationEmail: email });
}
