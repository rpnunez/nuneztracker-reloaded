import { requireUser } from "@/lib/auth";
import { listScore, listTypes, usingSampleDb } from "@/lib/store";

export async function GET(request: Request) {
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
    },
    types,
    score,
    sample: usingSampleDb(),
  });
}
