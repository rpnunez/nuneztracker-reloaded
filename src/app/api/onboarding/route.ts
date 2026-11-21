import { requireUser } from "@/lib/auth";
import { createRecord, getTypeBySlug, updateUser } from "@/lib/store";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  const timezone = String(body.timezone || user.timezone);
  const hours: string[] = Array.isArray(body.checkInHours) ? body.checkInHours.map(String) : user.checkInHours;
  const dueReminders = body.dueReminders !== false;
  const tasksType = await getTypeBySlug(user.id, "tasks");
  const eventsType = await getTypeBySlug(user.id, "events");
  const recurrences: { title: string; folder: string }[] = Array.isArray(body.recurring) ? body.recurring : [];
  if (tasksType) {
    for (const r of recurrences) {
      if (!r.title) continue;
      await createRecord(user.id, {
        objectTypeId: tasksType.id,
        title: r.title,
        description: `Repeats ${r.folder === "Weekly" ? "weekly" : "daily"}. Mark done each time it comes due.`,
        status: "todo",
        folder: r.folder || "Daily",
        dueAt: new Date().toISOString(),
        fieldValues: { priority: "medium" },
      });
    }
  }
  if (eventsType && body.focusBlock) {
    const start = new Date();
    start.setHours(9, 0, 0, 0);
    await createRecord(user.id, {
      objectTypeId: eventsType.id,
      title: "Morning focus block",
      description: "Protected work time from onboarding.",
      status: "upcoming",
      folder: "Calendar",
      dueAt: start.toISOString(),
      fieldValues: { starts_at: start.toISOString(), location: "Wherever you work" },
    });
  }
  await updateUser(user.id, { timezone, checkInHours: hours, dueReminders, onboarded: true });
  return Response.json({ ok: true });
}
