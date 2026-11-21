import { requireUser } from "@/lib/auth";
import { getAttachmentBytes, getRecord } from "@/lib/store";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const a = await getAttachmentBytes(id);
  if (!a) return new Response("Not found", { status: 404 });
  const rec = await getRecord(user.id, a.recordId);
  if (!rec) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(a.bytes), {
    headers: {
      "Content-Type": a.mime,
      "Content-Disposition": `inline; filename="${a.filename.replace(/"/g, "")}"`,
    },
  });
}
