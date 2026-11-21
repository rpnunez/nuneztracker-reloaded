import { requireUser } from "@/lib/auth";
import { listRecords, listTypes, updateUser } from "@/lib/store";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const types = await listTypes(user.id);
  const tasks = types.find((t) => t.slug === "tasks");
  const records = await listRecords(user.id, tasks?.id);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: user.timezone }).format(new Date());
  const due = records.filter((r) => r.status !== "done" && r.dueAt && r.dueAt.slice(0, 10) <= today);
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: user.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  const dueCheck = user.checkInHours.some((h) => hour >= h && hour < addHour(h));
  const last = user.lastCheckinAt ? new Date(user.lastCheckinAt).getTime() : 0;
  const recently = Date.now() - last < 50 * 60 * 1000;
  const messages: { id: string; title: string; body: string }[] = [];
  if (dueCheck && !recently) {
    messages.push({
      id: "checkup",
      title: "Check-in",
      body:
        due.length > 0
          ? `Have you finished the ${due.length} task${due.length === 1 ? "" : "s"} due today?`
          : "Anything you want to add to Tasks?",
    });
  }
  if (user.dueReminders) {
    for (const r of due) {
      messages.push({ id: `due-${r.id}`, title: "Due now", body: r.title });
    }
  }
  return Response.json({ messages, localOnly: !process.env.VAPID_PUBLIC_KEY, sample: !process.env.DATABASE_URL });
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  await updateUser(user.id, { lastCheckinAt: new Date().toISOString() });
  return Response.json({ ok: true });
}

function addHour(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = (h + 1) % 24;
  return `${String(d).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
}
