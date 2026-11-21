"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { id: string; title: string; body: string };

export function CheckinBanner() {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/reminders/pending")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setMsg(d?.messages?.[0] ?? null))
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => clearInterval(t);
  }, []);

  if (!msg) return null;

  return (
    <div className="mx-4 mt-3 rounded-2xl border border-[var(--accent)] bg-white p-4 md:mx-8">
      <p className="text-xs uppercase tracking-wide text-[var(--accent)]">{msg.title} · local reminder</p>
      <p className="mt-1 font-medium">{msg.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="btn btn-primary text-sm"
          onClick={async () => {
            await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "checkin" }) });
            await fetch("/api/reminders/pending", { method: "POST" });
            setMsg(null);
            router.refresh();
          }}
        >
          I&apos;m on it
        </button>
        <a className="btn btn-ghost text-sm" href="/o/tasks/new">
          Add a task
        </a>
        <button className="btn btn-ghost text-sm" onClick={() => fetch("/api/reminders/pending", { method: "POST" }).then(() => setMsg(null))}>
          Later
        </button>
      </div>
    </div>
  );
}
