import { requireUser } from "@/lib/auth";
import { addAttachment, getRecord } from "@/lib/store";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const rec = await getRecord(user.id, id);
  if (!rec) return Response.json({ error: "Not found" }, { status: 404 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "file required" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const meta = await addAttachment(id, file.name, file.type || "application/octet-stream", buf);
    return Response.json(meta);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
