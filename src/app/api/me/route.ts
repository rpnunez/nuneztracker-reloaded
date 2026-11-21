import { requireUser } from "@/lib/auth";
import { ensureBootstrapAdmin } from "@/lib/bootstrap-admin";
import { listScore, listTypes, usingSampleDb } from "@/lib/store";

export async function GET(request: Request) {
  await ensureBootstrapAdmin();
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const types = await listTypes(user.id);
  const score = await listScore(user.id);
  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      onboarded: user.onboarded,
      checkInHours: user.checkInHours,
      dueReminders: user.dueReminders,
      role: user.role,
      status: user.status,
    },
    types,
    score,
    sample: usingSampleDb(),
  });
}
