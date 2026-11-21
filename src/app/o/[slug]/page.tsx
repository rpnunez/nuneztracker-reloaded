"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Field = { key: string; label: string; type: string; options?: string[] };
type Type = { id: string; slug: string; name: string; statuses: string[]; fields: Field[] };
type Rec = {
  id: string;
  objectTypeId: string;
  title: string;
  description: string;
  status: string;
  folder: string;
  dueAt: string | null;
  updatedAt: string;
};

export default function TypeListPage() {
  const { slug } = useParams<{ slug: string }>();
  const [type, setType] = useState<Type | null>(null);
  const [rows, setRows] = useState<Rec[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [folder, setFolder] = useState("all");
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/types").then((r) => r.json()),
      fetch("/api/records").then((r) => r.json()),
    ])
      .then(([types, records]) => {
        if (!Array.isArray(types)) {
          setErr(types.error || "Sign in required");
          return;
        }
        const t = (types as Type[]).find((x) => x.slug === slug);
        if (!t) {
          setErr("This object type does not exist.");
          return;
        }
        setType(t);
        setRows(Array.isArray(records) ? (records as Rec[]).filter((r) => r.objectTypeId === t.id) : []);
      })
      .catch(() => setErr("Could not load objects."));
  }, [slug]);

  const folders = useMemo(() => Array.from(new Set(rows.map((r) => r.folder).filter(Boolean))), [rows]);
  const shown = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (folder !== "all" && r.folder !== folder) return false;
    if (q && !`${r.title} ${r.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">{type?.name ?? slug}</h1>
          <p className="text-[var(--muted)]">{shown.length} shown</p>
        </div>
        <Link className="btn btn-primary" href={`/o/${slug}/new`}>
          New
        </Link>
      </div>
      {err && <p className="mt-4 text-[var(--warn)]">{err}</p>}
      {!type && !err && <p className="mt-8 text-[var(--muted)]">Loading…</p>}
      {type && (
        <>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <input className="field" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {type.statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className="field" value={folder} onChange={(e) => setFolder(e.target.value)}>
              <option value="all">All folders</option>
              {folders.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          {shown.length === 0 ? (
            <p className="card mt-6 p-6 text-[var(--muted)]">Nothing here yet. Create the first {type.name.slice(0, -1).toLowerCase()}.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {shown.map((r) => (
                <li key={r.id}>
                  <Link href={`/o/${slug}/${r.id}`} className="card block p-4 hover:border-[var(--accent)]">
                    <div className="flex items-center justify-between gap-2">
                      <strong>{r.title}</strong>
                      <span className="text-xs uppercase tracking-wide text-[var(--muted)]">{r.status}</span>
                    </div>
                    {r.description && <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{r.description}</p>}
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {r.folder || "No folder"} · updated {new Date(r.updatedAt).toLocaleString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </AppShell>
  );
}
