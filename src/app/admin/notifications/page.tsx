"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

export default function NotificationEmailPage() {
  const [email, setEmail] = useState("");
  const [sample, setSample] = useState(false);
  const [saved, setSaved] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then((r) => {
        if (!r.ok) throw new Error("Admin only");
        return r.json();
      })
      .then((d) => {
        setEmail(d.notificationEmail ?? "");
        setSample(Boolean(d.sampleMail));
      })
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <AppShell>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Notification email</h1>
      <p className="text-[var(--muted)]">
        Alerts such as “a new user signed up and is pending activation” go to this address.
      </p>
      {sample && (
        <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-950">
          Sample mail — Resend is not configured, so messages are logged locally instead of delivered.
        </p>
      )}
      {err && <p className="mt-3 text-[var(--warn)]">{err}</p>}
      <form
        className="mt-6 max-w-lg space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaved("");
          const r = await fetch("/api/settings/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationEmail: email }),
          });
          if (!r.ok) setErr("Could not save");
          else setSaved("Saved");
        }}
      >
        <input className="field" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn btn-primary">Save</button>
        {saved && <span className="ml-2 text-sm text-[var(--sage)]">{saved}</span>}
      </form>
    </AppShell>
  );
}
