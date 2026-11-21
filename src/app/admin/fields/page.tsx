"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

type Field = { id: string; key: string; label: string; type: string; options?: string[]; required: boolean; builtin: boolean };
type Type = { id: string; name: string; slug: string; fields: Field[] };

const TYPES = ["text", "textarea", "number", "date", "datetime", "select", "checkbox", "url"];

export default function FieldsPage() {
  const [types, setTypes] = useState<Type[]>([]);
  const [typeId, setTypeId] = useState("");
  const [label, setLabel] = useState("");
  const [ftype, setFtype] = useState("text");
  const [options, setOptions] = useState("");

  const load = () =>
    fetch("/api/types")
      .then((r) => r.json())
      .then((t: Type[]) => {
        setTypes(t);
        setTypeId((id) => id || t[0]?.id || "");
      });
  useEffect(() => {
    load();
  }, []);

  const current = types.find((t) => t.id === typeId);

  return (
    <AppShell>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Object fields</h1>
      <p className="text-[var(--muted)]">Add a Priority dropdown, a URL, a date — the record form updates for that type.</p>
      <select className="field mt-4 max-w-sm" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
        {types.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <ul className="mt-4 space-y-2">
        {current?.fields.map((f) => (
          <li key={f.id} className="card flex items-center justify-between gap-2 p-3">
            <div>
              <strong>{f.label}</strong>
              <span className="ml-2 text-sm text-[var(--muted)]">
                {f.key} · {f.type}
                {f.builtin ? " · built-in" : ""}
              </span>
            </div>
            {!f.builtin && (
              <button
                className="text-sm text-[var(--warn)]"
                onClick={() => fetch(`/api/fields?id=${f.id}`, { method: "DELETE" }).then(load)}
              >
                Delete
              </button>
            )}
          </li>
        ))}
        {current && current.fields.length === 0 && <li className="text-[var(--muted)]">No extra fields yet.</li>}
      </ul>
      <form
        className="mt-8 max-w-lg space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/fields", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              objectTypeId: typeId,
              label,
              type: ftype,
              options: ftype === "select" ? options.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
            }),
          });
          setLabel("");
          setOptions("");
          load();
        }}
      >
        <h2 className="font-semibold">Add field</h2>
        <input className="field" placeholder="Label (e.g. Priority)" value={label} onChange={(e) => setLabel(e.target.value)} required />
        <select className="field" value={ftype} onChange={(e) => setFtype(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {ftype === "select" && (
          <input className="field" placeholder="Options, comma-separated" value={options} onChange={(e) => setOptions(e.target.value)} />
        )}
        <button className="btn btn-primary">Add field</button>
      </form>
    </AppShell>
  );
}
