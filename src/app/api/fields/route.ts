import { requireUser } from "@/lib/auth";
import { createField, deleteField, listAllTypes, listFields, updateField } from "@/lib/store";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const typeId = url.searchParams.get("typeId");
  if (!typeId) return Response.json({ error: "typeId required" }, { status: 400 });
  const types = await listAllTypes(user.id);
  if (!types.some((t) => t.id === typeId)) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(await listFields(typeId));
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  const types = await listAllTypes(user.id);
  if (!types.some((t) => t.id === body.objectTypeId)) return Response.json({ error: "Not found" }, { status: 404 });
  const f = await createField(String(body.objectTypeId), {
    key: String(body.key || body.label || "field")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_"),
    label: String(body.label || "Field"),
    type: body.type || "text",
    options: Array.isArray(body.options) ? body.options.map(String) : undefined,
    required: Boolean(body.required),
    sortOrder: Number(body.sortOrder ?? 10),
  });
  return Response.json(f);
}

export async function PATCH(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  try {
    const f = await updateField(user.id, String(body.id), body);
    return Response.json(f);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  try {
    await deleteField(user.id, id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
