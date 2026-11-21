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
      <h1 className="page-title">Today</h1>
      <p className="lede">Stay with the plan. Complete, reschedule, or skip — don&apos;t ghost it.</p>
      {err && <p className="mt-4 text-[var(--warn)]">{err}</p>}
      {!data && !err && <p className="mt-8 text-[var(--muted)]">Loading your day…</p>}
      {data && (
        <>
          <div className="stats">
            <Stat label="Points" value={data.score.points} />
            <Stat label="Streak" value={`${data.score.streak}d`} />
            <Stat label="Due today" value={data.dueTasks.length} />
            <Stat label="Overdue" value={data.overdue.length} />
          </div>
          {data.overdue.length > 0 && (
            <section className="section">
              <h2 style={{ color: "var(--warn)" }}>Overdue — commit</h2>
              <ul className="stack">
                {data.overdue.map((r) => (
                  <CommitCard key={r.id} rec={r} slug="tasks" onDone={() => act(r.id, "done")} onSkip={() => act(r.id, "blocked")} onMove={() => act(r.id, r.status, { dueAt: new Date(Date.now() + 86400000).toISOString() })} />
                ))}
              </ul>
            </section>
          )}
          <section className="section">
            <h2>Tasks due today</h2>
            {data.dueTasks.length === 0 ? (
              <p className="card lede" style={{ padding: "1rem", marginTop: "0.75rem" }}>
                Nothing due. Add a task if you&apos;re hiding work from yourself.
              </p>
            ) : (
              <ul className="stack">
                {data.dueTasks.map((r) => (
                  <CommitCard key={r.id} rec={r} slug="tasks" onDone={() => act(r.id, "done")} onSkip={() => act(r.id, "blocked")} onMove={() => act(r.id, r.status, { dueAt: new Date(Date.now() + 86400000).toISOString() })} />
                ))}
              </ul>
            )}
          </section>
          <section className="section">
            <h2>Events</h2>
            {data.todayEvents.length === 0 ? (
              <p className="card lede" style={{ padding: "1rem", marginTop: "0.75rem" }}>
                No events on the calendar today.
              </p>
            ) : (
              <ul className="stack">
                {data.todayEvents.map((r) => (
                  <CommitCard key={r.id} rec={r} slug="events" onDone={() => act(r.id, "done")} onSkip={() => act(r.id, "skipped")} onMove={() => act(r.id, r.status, { dueAt: new Date(Date.now() + 86400000).toISOString() })} />
                ))}
              </ul>
            )}
          </section>
          <section className="section">
            <h2>Badges</h2>
            <div className="pills">
              {data.score.badges.map((b) => (
                <span key={b.id} className={b.earnedAt ? "pill on" : "pill"}>
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
    <div className="card stat">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
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
    <li className="card" style={{ padding: "1rem" }}>
      <Link href={`/o/${slug}/${rec.id}`} style={{ fontWeight: 600 }}>
        {rec.title}
      </Link>
      <div className="pills">
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
