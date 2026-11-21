"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { useEffect, useState } from "react";

type Rec = { id: string; title: string; status: string; dueAt: string | null; objectTypeId: string };

export default function HomePage() {
  const [data, setData] = useState<null | {
    dueTasks: Rec[];
    overdue: Rec[];
    todayEvents: Rec[];
    score: { points: number; streak: number; badges: { id: string; name: string; earnedAt: string | null }[] };
    types: { id: string; slug: string }[];
    sample: boolean;
  }>(null);
  const [err, setErr] = useState("");

  const load = () =>
    import("@/lib/api")
      .then(({ api }) => api<NonNullable<typeof data>>("/api/today"))
      .then(setData)
      .catch((e) => setErr(e.message));

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, status: string, extra?: Record<string, unknown>) {
    await fetch(`/api/records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    load();
  }

  return (
    <AppShell>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Today</h1>
      <p className="mt-1 text-[var(--muted)]">Stay with the plan. Complete, reschedule, or skip — don&apos;t ghost it.</p>
      {err && <p className="mt-4 text-[var(--warn)]">{err}</p>}
      {!data && !err && <p className="mt-8 text-[var(--muted)]">Loading your day…</p>}
      {data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Points" value={data.score.points} />
            <Stat label="Streak" value={`${data.score.streak}d`} />
            <Stat label="Due today" value={data.dueTasks.length} />
            <Stat label="Overdue" value={data.overdue.length} />
          </div>
          {data.overdue.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--warn)]">Overdue — commit</h2>
              <ul className="mt-3 space-y-2">
                {data.overdue.map((r) => (
                  <CommitCard key={r.id} rec={r} slug="tasks" onDone={() => act(r.id, "done")} onSkip={() => act(r.id, "blocked")} onMove={() => act(r.id, r.status, { dueAt: new Date(Date.now() + 86400000).toISOString() })} />
                ))}
              </ul>
            </section>
          )}
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Tasks due today</h2>
            {data.dueTasks.length === 0 ? (
              <p className="card mt-3 p-4 text-[var(--muted)]">Nothing due. Add a task if you&apos;re hiding work from yourself.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.dueTasks.map((r) => (
                  <CommitCard key={r.id} rec={r} slug="tasks" onDone={() => act(r.id, "done")} onSkip={() => act(r.id, "blocked")} onMove={() => act(r.id, r.status, { dueAt: new Date(Date.now() + 86400000).toISOString() })} />
                ))}
              </ul>
            )}
          </section>
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Events</h2>
            {data.todayEvents.length === 0 ? (
              <p className="card mt-3 p-4 text-[var(--muted)]">No events on the calendar today.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.todayEvents.map((r) => (
                  <CommitCard key={r.id} rec={r} slug="events" onDone={() => act(r.id, "done")} onSkip={() => act(r.id, "skipped")} onMove={() => act(r.id, r.status, { dueAt: new Date(Date.now() + 86400000).toISOString() })} />
                ))}
              </ul>
            )}
          </section>
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Badges</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.score.badges.map((b) => (
                <span key={b.id} className={`rounded-full px-3 py-1 text-sm ${b.earnedAt ? "bg-[var(--sage)] text-white" : "bg-black/5 text-[var(--muted)]"}`}>
                  {b.name}
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="font-[family-name:var(--font-display)] text-2xl">{value}</div>
    </div>
  );
}

function CommitCard({
  rec,
  slug,
  onDone,
  onSkip,
  onMove,
}: {
  rec: Rec;
  slug: string;
  onDone: () => void;
  onSkip: () => void;
  onMove: () => void;
}) {
  return (
    <li className="card p-4">
      <Link href={`/o/${slug}/${rec.id}`} className="font-semibold">
        {rec.title}
      </Link>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-primary text-sm" onClick={onDone}>
          Done
        </button>
        <button className="btn btn-ghost text-sm" onClick={onMove}>
          Tomorrow
        </button>
        <button className="btn btn-ghost text-sm" onClick={onSkip}>
          Skip
        </button>
      </div>
    </li>
  );
}
