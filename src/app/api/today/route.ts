import { requireUser } from "@/lib/auth";
import { todayBundle } from "@/lib/store";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  return Response.json(await todayBundle(user.id));
}
