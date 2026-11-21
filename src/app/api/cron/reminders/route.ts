import { sendNotification, setVapidDetails } from "web-push";
import { requireUser } from "@/lib/auth";
import { listPush } from "@/lib/store";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const pending = await fetch(new URL("/api/reminders/pending", request.url), {
    headers: request.headers,
  }).then((r) => r.json());
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    return Response.json({ delivered: 0, messages: pending.messages, mode: "local" });
  }
  setVapidDetails("mailto:ops@nuneztracker.local", pub, priv);
  const subs = await listPush(user.id);
  let delivered = 0;
  for (const msg of pending.messages ?? []) {
    for (const s of subs) {
      try {
        await sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(msg),
        );
        delivered++;
      } catch {
        /* expired subscription */
      }
    }
  }
  return Response.json({ delivered, mode: "push" });
}
