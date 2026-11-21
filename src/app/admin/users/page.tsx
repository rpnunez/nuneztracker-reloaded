"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

type Row = { id: string; email: string; name: string; role: string; status: string; createdAt: string };

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");

  const load = () =>
    fetch("/api/admin/users")
      .then((r) => {
        if (!r.ok) throw new Error("Admin only");
        return r.json();
      })
      .then(setRows)
      .catch((e) => setErr(e.message));

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <AppShell>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Users</h1>
      <p className="text-[var(--muted)]">Approve or reject people who signed up. They cannot sign in until you activate them.</p>
      {err && <p className="mt-4 text-[var(--warn)]">{err}</p>}
      <ul className="mt-6 space-y-2">
        {rows.map((u) => (
          <li key={u.id} className="card p-4">
            <div className="font-semibold">{u.name || u.email}</div>
            <p className="text-sm text-[var(--muted)]">
              {u.email} · {u.role} · {u.status}
            </p>
            {u.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <button className="btn btn-primary text-sm" onClick={() => setStatus(u.id, "active")}>
                  Approve
                </button>
                <button className="btn btn-ghost text-sm" onClick={() => setStatus(u.id, "rejected")}>
                  Reject
                </button>
              </div>
            )}
            {u.status === "rejected" && (
              <button className="btn btn-ghost mt-3 text-sm" onClick={() => setStatus(u.id, "pending")}>
                Move back to pending
              </button>
            )}
          </li>
        ))}
        {rows.length === 0 && !err && <li className="text-[var(--muted)]">No users yet.</li>}
      </ul>
    </AppShell>
  );
}
