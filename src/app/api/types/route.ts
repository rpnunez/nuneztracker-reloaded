import { requireUser } from "@/lib/auth";
import { createType, listAllTypes, listFields } from "@/lib/store";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const types = await listAllTypes(user.id);
  const withFields = await Promise.all(
    types.map(async (t) => ({ ...t, fields: await listFields(t.id) })),
  );
  return Response.json(withFields);
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  const t = await createType(user.id, {
    slug: String(body.slug || body.name || "object"),
    name: String(body.name || "Untitled"),
    icon: body.icon,
    description: body.description,
    statuses: Array.isArray(body.statuses) ? body.statuses.map(String) : undefined,
  });
  return Response.json(t);
}
