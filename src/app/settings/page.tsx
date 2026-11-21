"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [hours, setHours] = useState("09:00,13:00,19:00");
  const [dueReminders, setDueReminders] = useState(true);
  const [pushNote, setPushNote] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setName(d.user?.name ?? "");
        setTimezone(d.user?.timezone ?? "America/New_York");
        setHours((d.user?.checkInHours ?? []).join(","));
        setDueReminders(d.user?.dueReminders !== false);
      });
  }, []);

  async function enablePush() {
    setPushNote("");
    const cfg = await fetch("/api/push/subscribe").then((r) => r.json());
    if (!cfg.publicKey) {
      setPushNote("Push keys are not set. In-app local reminders still run.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setPushNote("Notifications were blocked.");
      return;
    }
    const reg = await navigator.serviceWorker.register("/sw.js");
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(cfg.publicKey),
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
    setPushNote("Push subscription saved.");
  }

  return (
    <AppShell>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Settings</h1>
      <form
        className="mt-6 max-w-lg space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              timezone,
              checkInHours: hours.split(",").map((s) => s.trim()).filter(Boolean),
              dueReminders,
            }),
          });
          setSaved("Saved");
        }}
      >
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="field" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Timezone" />
        <input className="field" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Check-in hours, comma-separated" />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={dueReminders} onChange={(e) => setDueReminders(e.target.checked)} />
          Remind me when tasks are due
        </label>
        <button className="btn btn-primary">Save</button>
        {saved && <span className="ml-2 text-sm text-[var(--sage)]">{saved}</span>}
      </form>
      <p className="mt-8">
        <a className="underline" href="/admin/notifications">
          Notification email (admin)
        </a>
      </p>
      <button className="btn btn-ghost mt-6" onClick={enablePush}>
        Enable push notifications
      </button>
      {pushNote && <p className="mt-2 text-sm text-[var(--muted)]">{pushNote}</p>}
      <button
        className="mt-10 text-sm underline"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          location.href = "/login";
        }}
      >
        Sign out
      </button>
    </AppShell>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}
