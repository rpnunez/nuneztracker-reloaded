import { requireUser } from "@/lib/auth";
import { addPoints, listScore } from "@/lib/store";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  return Response.json(await listScore(user.id));
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  if (body.kind === "checkin") {
    await addPoints(user.id, 2, "checkin", "Answered a check-in");
    const { updateUser } = await import("@/lib/store");
    await updateUser(user.id, { lastCheckinAt: new Date().toISOString() });
  }
  return Response.json(await listScore(user.id));
}
