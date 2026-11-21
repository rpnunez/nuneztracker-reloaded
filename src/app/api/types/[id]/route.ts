import { requireUser } from "@/lib/auth";
import { updateType } from "@/lib/store";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const body = await request.json();
  try {
    const t = await updateType(user.id, id, body);
    return Response.json(t);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
