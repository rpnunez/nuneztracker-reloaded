"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">NunezTracker</h1>
      <p className="mt-2 text-[var(--muted)]">Sign in to your isolated workspace. On Cursor private hosting, you are already signed in as the app viewer.</p>
      <form
        className="mt-8 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const r = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const d = await r.json();
          if (!r.ok) setError(d.error || "Could not sign in");
          else router.replace("/");
        }}
      >
        <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-[var(--warn)]">{error}</p>}
        <button className="btn btn-primary w-full" type="submit">
          Sign in
        </button>
      </form>
      <p className="mt-4 text-sm">
        No account? <Link href="/signup" className="underline">Create one</Link>
      </p>
      <button className="mt-6 text-sm underline" onClick={() => router.replace("/")}>
        Continue as local viewer
      </button>
    </div>
  );
}
