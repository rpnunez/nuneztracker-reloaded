"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SUGGESTED = [
  { title: "Morning review", folder: "Daily" },
  { title: "Inbox sweep", folder: "Daily" },
  { title: "Weekly planning", folder: "Weekly" },
  { title: "Move for 20 minutes", folder: "Daily" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [timezone, setTimezone] = useState("America/New_York");
  const [hours, setHours] = useState(["09:00", "13:00", "19:00"]);
  const [picked, setPicked] = useState<string[]>(["Morning review"]);
  const [focusBlock, setFocusBlock] = useState(true);
  const [error, setError] = useState("");

  async function finish() {
    setError("");
    const r = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timezone,
        checkInHours: hours,
        dueReminders: true,
        focusBlock,
        recurring: SUGGESTED.filter((s) => picked.includes(s.title)),
      }),
    });
    if (!r.ok) {
      setError("Could not save onboarding");
      return;
    }
    router.replace("/");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg p-6">
      <p className="text-sm text-[var(--muted)]">Setup {step + 1} / 3</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
        {step === 0 && "How often should we check in?"}
        {step === 1 && "Recurring work to seed"}
        {step === 2 && "Protect time on the calendar"}
      </h1>
      {step === 0 && (
        <div className="mt-6 space-y-3">
          <label className="block text-sm">Timezone</label>
          <input className="field" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          <p className="text-sm text-[var(--muted)]">Pick check-in hours (24h). We&apos;ll ask if today&apos;s tasks are done, and if you want to add more.</p>
          {["08:00", "09:00", "12:00", "13:00", "18:00", "19:00", "21:00"].map((h) => (
            <label key={h} className="flex items-center gap-2">
              <input type="checkbox" checked={hours.includes(h)} onChange={() => setHours((cur) => (cur.includes(h) ? cur.filter((x) => x !== h) : [...cur, h].sort()))} />
              {h}
            </label>
          ))}
        </div>
      )}
      {step === 1 && (
        <div className="mt-6 space-y-3">
          {SUGGESTED.map((s) => (
            <label key={s.title} className="card flex items-center gap-3 p-3">
              <input type="checkbox" checked={picked.includes(s.title)} onChange={() => setPicked((c) => (c.includes(s.title) ? c.filter((x) => x !== s.title) : [...c, s.title]))} />
              <span>
                <strong>{s.title}</strong>
                <span className="ml-2 text-sm text-[var(--muted)]">{s.folder}</span>
              </span>
            </label>
          ))}
        </div>
      )}
      {step === 2 && (
        <div className="mt-6">
          <label className="card flex items-start gap-3 p-4">
            <input type="checkbox" checked={focusBlock} onChange={(e) => setFocusBlock(e.target.checked)} />
            <span>Add a morning focus block so the calendar isn&apos;t empty on day one.</span>
          </label>
        </div>
      )}
      {error && <p className="mt-4 text-[var(--warn)]">{error}</p>}
      <div className="mt-8 flex gap-2">
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
        {step < 2 ? (
          <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
            Continue
          </button>
        ) : (
          <button className="btn btn-primary" onClick={finish}>
            Start tracking
          </button>
        )}
      </div>
    </div>
  );
}
