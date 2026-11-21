"use client";

import { AppShell } from "@/components/AppShell";
import { RecordForm } from "@/components/RecordForm";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecordDetailPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const router = useRouter();
  const [type, setType] = useState<null | { id: string; slug: string; name: string; statuses: string[]; fields: { key: string; label: string; type: string; options?: string[]; required: boolean }[] }>(null);
  const [rec, setRec] = useState<null | {
    id: string;
    title: string;
    description: string;
    status: string;
    folder: string;
    dueAt: string | null;
    createdAt: string;
    updatedAt: string;
    fieldValues: Record<string, unknown>;
    linked: { id: string; title: string; objectTypeId: string }[];
    attachments: { id: string; filename: string }[];
  }>(null);
  const [types, setTypes] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<{ id: string; title: string }[]>([]);
  const [err, setErr] = useState("");

  const load = () => {
    Promise.all([fetch("/api/types").then((r) => r.json()), fetch(`/api/records/${id}`).then((r) => r.json())]).then(
      ([ts, r]) => {
        if (r.error) {
          setErr(r.error);
          return;
        }
        setTypes(ts);
        setType(ts.find((t: { slug: string }) => t.slug === slug) ?? null);
        setRec(r);
      },
    );
  };

  useEffect(() => {
    load();
  }, [id, slug]);

  async function onSearch(q: string) {
    setSearch(q);
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const all = await fetch("/api/records").then((r) => r.json());
    setHits(all.filter((x: { id: string; title: string }) => x.id !== id && x.title.toLowerCase().includes(q.toLowerCase())).slice(0, 8));
  }

  if (err) {
    return (
      <AppShell>
        <p className="text-[var(--warn)]">{err}</p>
      </AppShell>
    );
  }
  if (!rec || !type) {
    return (
      <AppShell>
        <p className="text-[var(--muted)]">Loading object…</p>
      </AppShell>
    );
  }

  const slugOf = (objectTypeId: string) => types.find((t) => t.id === objectTypeId)?.slug ?? slug;

  return (
    <AppShell>
      <p className="text-sm text-[var(--muted)]">
        Created {new Date(rec.createdAt).toLocaleString()} · Modified {new Date(rec.updatedAt).toLocaleString()}
      </p>
      <RecordForm
        type={type}
        initial={rec}
        onSave={async (payload) => {
          const r = await fetch(`/api/records/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!r.ok) throw new Error("Save failed");
          load();
        }}
      />
      <section className="mt-10">
        <h2 className="font-semibold">Attachments</h2>
        <ul className="mt-2 space-y-1">
          {rec.attachments.map((a) => (
            <li key={a.id}>
              <a className="underline" href={`/api/attachments/${a.id}`}>
                {a.filename}
              </a>
            </li>
          ))}
          {rec.attachments.length === 0 && <li className="text-[var(--muted)]">No files yet.</li>}
        </ul>
        <input
          className="mt-3"
          type="file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.set("file", file);
            await fetch(`/api/records/${id}/attachments`, { method: "POST", body: fd });
            load();
          }}
        />
      </section>
      <section className="mt-10">
        <h2 className="font-semibold">Links</h2>
        <ul className="mt-2 space-y-1">
          {rec.linked.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2">
              <Link className="underline" href={`/o/${slugOf(l.objectTypeId)}/${l.id}`}>
                {l.title}
              </Link>
              <button
                className="text-sm text-[var(--warn)]"
                onClick={async () => {
                  await fetch(`/api/records/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ op: "unlink", toId: l.id }),
                  });
                  load();
                }}
              >
                Unlink
              </button>
            </li>
          ))}
          {rec.linked.length === 0 && <li className="text-[var(--muted)]">Link notes, tasks, events, or any custom object.</li>}
        </ul>
        <input className="field mt-3" placeholder="Search objects to link" value={search} onChange={(e) => onSearch(e.target.value)} />
        <ul className="mt-2">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                className="text-sm underline"
                onClick={async () => {
                  await fetch(`/api/records/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ op: "link", toId: h.id }),
                  });
                  setSearch("");
                  setHits([]);
                  load();
                }}
              >
                Link “{h.title}”
              </button>
            </li>
          ))}
        </ul>
      </section>
      <button
        className="mt-10 text-sm text-[var(--warn)]"
        onClick={async () => {
          if (!confirm("Delete this object?")) return;
          await fetch(`/api/records/${id}`, { method: "DELETE" });
          router.replace(`/o/${slug}`);
        }}
      >
        Delete
      </button>
    </AppShell>
  );
}
