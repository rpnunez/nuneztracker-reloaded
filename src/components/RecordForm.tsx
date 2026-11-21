"use client";

import { useState } from "react";

type Field = { key: string; label: string; type: string; options?: string[]; required?: boolean };
type Type = { statuses: string[]; fields: Field[] };

export function RecordForm({
  type,
  initial,
  onSave,
}: {
  type: Type;
  initial?: {
    title?: string;
    description?: string;
    status?: string;
    folder?: string;
    dueAt?: string | null;
    fieldValues?: Record<string, unknown>;
  };
  onSave: (payload: {
    title: string;
    description: string;
    status: string;
    folder: string;
    dueAt: string | null;
    fieldValues: Record<string, unknown>;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState(initial?.status ?? type.statuses[0]);
  const [folder, setFolder] = useState(initial?.folder ?? "");
  const [dueAt, setDueAt] = useState(initial?.dueAt ? initial.dueAt.slice(0, 16) : "");
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(initial?.fieldValues ?? {});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <form
      className="mt-6 max-w-xl space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        try {
          await onSave({
            title,
            description,
            status,
            folder,
            dueAt: dueAt ? new Date(dueAt).toISOString() : null,
            fieldValues,
          });
        } catch (ex) {
          setErr(ex instanceof Error ? ex.message : "Save failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input className="field" required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="field min-h-28" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid gap-3 md:grid-cols-2">
        <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
          {type.statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input className="field" placeholder="Folder / label" value={folder} onChange={(e) => setFolder(e.target.value)} />
      </div>
      <label className="block text-sm text-[var(--muted)]">Due / event date</label>
      <input className="field" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
      {type.fields.map((f) => (
        <label key={f.key} className="block">
          <span className="mb-1 block text-sm text-[var(--muted)]">{f.label}</span>
          {f.type === "select" ? (
            <select className="field" value={String(fieldValues[f.key] ?? "")} onChange={(e) => setFieldValues({ ...fieldValues, [f.key]: e.target.value })}>
              <option value="">—</option>
              {(f.options ?? []).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : f.type === "checkbox" ? (
            <input type="checkbox" checked={Boolean(fieldValues[f.key])} onChange={(e) => setFieldValues({ ...fieldValues, [f.key]: e.target.checked })} />
          ) : f.type === "textarea" ? (
            <textarea className="field" value={String(fieldValues[f.key] ?? "")} onChange={(e) => setFieldValues({ ...fieldValues, [f.key]: e.target.value })} />
          ) : (
            <input
              className="field"
              type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "url" ? "url" : "text"}
              value={String(fieldValues[f.key] ?? "")}
              onChange={(e) => setFieldValues({ ...fieldValues, [f.key]: e.target.value })}
            />
          )}
        </label>
      ))}
      {err && <p className="text-[var(--warn)]">{err}</p>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
