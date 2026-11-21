import { requireUser } from "@/lib/auth";
import { createRecord, listRecords } from "@/lib/store";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const typeId = new URL(request.url).searchParams.get("typeId") ?? undefined;
  return Response.json(await listRecords(user.id, typeId));
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  const rec = await createRecord(user.id, {
    objectTypeId: String(body.objectTypeId),
    title: String(body.title || "Untitled"),
    description: String(body.description || ""),
    status: String(body.status || "todo"),
    folder: String(body.folder || ""),
    dueAt: body.dueAt ? String(body.dueAt) : null,
    fieldValues: body.fieldValues && typeof body.fieldValues === "object" ? body.fieldValues : {},
  });
  return Response.json(rec);
}
