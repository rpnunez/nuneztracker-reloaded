import { requireUser } from "@/lib/auth";
import {
  addAttachment,
  addLink,
  deleteRecord,
  getRecord,
  listAttachments,
  listLinks,
  listRecords,
  removeLink,
  updateRecord,
} from "@/lib/store";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const rec = await getRecord(user.id, id);
  if (!rec) return Response.json({ error: "Not found" }, { status: 404 });
  const links = await listLinks(id);
  const all = await listRecords(user.id);
  const linked = links
    .map((l) => all.find((r) => r.id === (l.fromId === id ? l.toId : l.fromId)))
    .filter(Boolean);
  const attachments = await listAttachments(id);
  return Response.json({ ...rec, linked, attachments });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const body = await request.json();
  try {
    return Response.json(await updateRecord(user.id, id, body));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  await deleteRecord(user.id, id);
  return Response.json({ ok: true });
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const body = await request.json();
  if (body.op === "link") {
    await addLink(user.id, id, String(body.toId));
    return Response.json({ ok: true });
  }
  if (body.op === "unlink") {
    await removeLink(id, String(body.toId));
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Unknown op" }, { status: 400 });
}
