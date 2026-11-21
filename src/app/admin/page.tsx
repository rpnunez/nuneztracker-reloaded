"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { useEffect, useState } from "react";

type Type = { id: string; slug: string; name: string; icon: string; description: string; builtin: boolean; archived: boolean; statuses: string[] };

export default function AdminPage() {
  const [types, setTypes] = useState<Type[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [statuses, setStatuses] = useState("open,done");

  const load = () => fetch("/api/types").then((r) => r.json()).then(setTypes);
  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Object management</h1>
      <p className="text-[var(--muted)]">Rename types, archive extras, or add something like Documents. Fields are on the Object Fields page.</p>
      <p className="mt-2 flex flex-wrap gap-4">
        <Link className="underline" href="/admin/fields">
          Object Fields
        </Link>
        <Link className="underline" href="/admin/users">
          Users
        </Link>
        <Link className="underline" href="/admin/notifications">
          Notification email
        </Link>
      </p>
      <ul className="mt-6 space-y-3">
        {types.map((t) => (
          <li key={t.id} className="card p-4">
            <input
              className="field"
              value={t.name}
              onChange={(e) => setTypes((cur) => cur.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))}
            />
            <textarea
              className="field mt-2"
              value={t.description}
              onChange={(e) => setTypes((cur) => cur.map((x) => (x.id === t.id ? { ...x, description: e.target.value } : x)))}
            />
            <input
              className="field mt-2"
              value={t.statuses.join(",")}
              onChange={(e) => setTypes((cur) => cur.map((x) => (x.id === t.id ? { ...x, statuses: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x)))}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="btn btn-primary text-sm"
                onClick={() =>
                  fetch(`/api/types/${t.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: t.name, description: t.description, statuses: t.statuses }),
                  }).then(load)
                }
              >
                Save
              </button>
              {!t.builtin && (
                <button
                  className="btn btn-ghost text-sm"
                  onClick={() =>
                    fetch(`/api/types/${t.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ archived: !t.archived }),
                    }).then(load)
                  }
                >
                  {t.archived ? "Restore" : "Archive"}
                </button>
              )}
              <span className="self-center text-xs text-[var(--muted)]">/{t.slug}</span>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 font-semibold">Add object type</h2>
      <form
        className="mt-3 max-w-lg space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              slug: slug || name,
              description,
              statuses: statuses.split(",").map((s) => s.trim()).filter(Boolean),
            }),
          });
          setName("");
          setSlug("");
          setDescription("");
          load();
        }}
      >
        <input className="field" placeholder="Name (e.g. Documents)" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="field" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className="field" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="field" placeholder="Statuses, comma-separated" value={statuses} onChange={(e) => setStatuses(e.target.value)} />
        <button className="btn btn-primary">Create type</button>
      </form>
    </AppShell>
  );
}
