export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, init);
  if (r.status === 401) {
    if (typeof window !== "undefined") window.location.replace("/login");
    throw new Error("Sign in required");
  }
  if (r.status === 403) {
    const d = await r.json().catch(() => ({}));
    if (d.code === "pending" && typeof window !== "undefined") window.location.replace("/pending");
    throw new Error(d.error || "Forbidden");
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d as T;
}
