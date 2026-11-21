import { requireUser } from "@/lib/auth";
import { updateUser } from "@/lib/store";

export async function PATCH(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  const u = await updateUser(user.id, {
    name: body.name != null ? String(body.name) : user.name,
    timezone: body.timezone != null ? String(body.timezone) : user.timezone,
    checkInHours: Array.isArray(body.checkInHours) ? body.checkInHours.map(String) : user.checkInHours,
    dueReminders: body.dueReminders != null ? Boolean(body.dueReminders) : user.dueReminders,
  });
  return Response.json({
    id: u.id,
    name: u.name,
    timezone: u.timezone,
    checkInHours: u.checkInHours,
    dueReminders: u.dueReminders,
  });
}
