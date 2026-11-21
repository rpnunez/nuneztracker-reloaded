"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Rec = { id: string; title: string; dueAt: string | null; objectTypeId: string; status: string; fieldValues: Record<string, unknown> };

export default function CalendarPage() {
  const [records, setRecords] = useState<Rec[]>([]);
  const [types, setTypes] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [cursor, setCursor] = useState(() => new Date());

  useEffect(() => {
    Promise.all([fetch("/api/records").then((r) => r.json()), fetch("/api/types").then((r) => r.json())]).then(
      ([recs, ts]) => {
        setRecords(recs);
        setTypes(ts);
      },
    );
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const start = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = useMemo(() => {
    const arr: (number | null)[] = [...Array(start).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
    return arr;
  }, [start, days]);

  const slugOf = (id: string) => types.find((t) => t.id === id)?.slug ?? "notes";
  const onDay = (d: number) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return records.filter((r) => {
      const iso = r.dueAt || String(r.fieldValues.starts_at ?? "");
      return iso.slice(0, 10) === key;
    });
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h1>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            Prev
          </button>
          <button className="btn btn-ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            Next
          </button>
        </div>
      </div>
      <div className="mt-6 hidden md:grid md:grid-cols-7 md:gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-xs uppercase text-[var(--muted)]">
            {d}
          </div>
        ))}
        {cells.map((d, i) => (
          <div key={i} className="card min-h-28 p-2">
            {d && (
              <>
                <div className="text-sm font-semibold">{d}</div>
                {onDay(d).map((r) => (
                  <Link key={r.id} href={`/o/${slugOf(r.objectTypeId)}/${r.id}`} className="mt-1 block truncate text-xs text-[var(--accent)]">
                    {r.title}
                  </Link>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
      <ol className="mt-6 space-y-2 md:hidden">
        {Array.from({ length: days }, (_, i) => i + 1)
          .map((d) => ({ d, items: onDay(d) }))
          .filter((x) => x.items.length)
          .map((x) => (
            <li key={x.d} className="card p-3">
              <div className="text-sm font-semibold">
                {month + 1}/{x.d}
              </div>
              {x.items.map((r) => (
                <Link key={r.id} className="mt-1 block" href={`/o/${slugOf(r.objectTypeId)}/${r.id}`}>
                  {r.title}
                </Link>
              ))}
            </li>
          ))}
      </ol>
    </AppShell>
  );
}
