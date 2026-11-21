import { requireUser } from "@/lib/auth";
import { savePush } from "@/lib/store";

export async function GET() {
  return Response.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  if (!body?.endpoint || !body?.keys?.p256dh) {
    return Response.json({ error: "Invalid subscription" }, { status: 400 });
  }
  await savePush(user.id, body);
  return Response.json({ ok: true });
}
