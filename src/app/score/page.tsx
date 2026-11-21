"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

export default function ScorePage() {
  const [data, setData] = useState<null | {
    points: number;
    streak: number;
    events: { id: string; kind: string; points: number; note: string; createdAt: string }[];
    badges: { id: string; name: string; description: string; earnedAt: string | null }[];
  }>(null);

  useEffect(() => {
    fetch("/api/score")
      .then(async (r) => {
        if (r.status === 401) {
          window.location.replace("/login");
          return null;
        }
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => d && setData(d));
  }, []);

  return (
    <AppShell>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Score</h1>
      <p className="text-[var(--muted)]">Points for finishing work. Skip never pays.</p>
      {!data && <p className="mt-6 text-[var(--muted)]">Loading…</p>}
      {data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="text-xs uppercase text-[var(--muted)]">Points</div>
              <div className="font-[family-name:var(--font-display)] text-4xl">{data.points}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs uppercase text-[var(--muted)]">Streak</div>
              <div className="font-[family-name:var(--font-display)] text-4xl">{data.streak}d</div>
            </div>
          </div>
          <h2 className="mt-8 font-semibold">Milestones</h2>
          <ul className="mt-3 space-y-2">
            {data.badges.map((b) => (
              <li key={b.id} className="card p-4">
                <div className="font-semibold">{b.name}</div>
                <p className="text-sm text-[var(--muted)]">{b.description}</p>
                <p className="mt-1 text-xs uppercase tracking-wide">{b.earnedAt ? `Earned ${new Date(b.earnedAt).toLocaleDateString()}` : "Locked"}</p>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-semibold">Recent</h2>
          {data.events.length === 0 ? (
            <p className="mt-2 text-[var(--muted)]">Complete a task to start the log.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {data.events.map((e) => (
                <li key={e.id}>
                  +{e.points} {e.note}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </AppShell>
  );
}
