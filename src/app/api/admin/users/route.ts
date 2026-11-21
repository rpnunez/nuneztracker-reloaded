import { requireAdmin } from "@/lib/auth";
import { listUsers, setUserStatus } from "@/lib/store";

export async function GET(request: Request) {
  const user = await requireAdmin(request);
  if (user instanceof Response) return user;
  const users = await listUsers();
  return Response.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
    })),
  );
}

export async function PATCH(request: Request) {
  const user = await requireAdmin(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  const id = String(body.id || "");
  const status = body.status;
  if (status !== "active" && status !== "rejected" && status !== "pending") {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  if (id === user.id && status !== "active") {
    return Response.json({ error: "You cannot deactivate your own admin account." }, { status: 400 });
  }
  try {
    const updated = await setUserStatus(id, status);
    return Response.json({ id: updated.id, status: updated.status });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
