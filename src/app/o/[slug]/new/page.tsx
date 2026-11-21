"use client";

import { AppShell } from "@/components/AppShell";
import { RecordForm } from "@/components/RecordForm";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewRecordPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [type, setType] = useState<null | { id: string; name: string; statuses: string[]; fields: { key: string; label: string; type: string; options?: string[]; required: boolean }[] }>(null);

  useEffect(() => {
    fetch("/api/types")
      .then((r) => r.json())
      .then((types) => {
        if (!Array.isArray(types)) return;
        setType(types.find((t: { slug: string }) => t.slug === slug) ?? null);
      });
  }, [slug]);

  return (
    <AppShell>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">New {type?.name ?? slug}</h1>
      {!type && <p className="mt-4 text-[var(--muted)]">Loading form…</p>}
      {type && (
        <RecordForm
          type={type}
          onSave={async (payload) => {
            const r = await fetch("/api/records", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, objectTypeId: type.id }),
            });
            const d = await r.json();
            router.replace(`/o/${slug}/${d.id}`);
          }}
        />
      )}
    </AppShell>
  );
}
