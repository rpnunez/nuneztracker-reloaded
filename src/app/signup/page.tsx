"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Create a workspace</h1>
      <p className="mt-2 text-[var(--muted)]">Email and password. Your objects stay private to this account.</p>
      <form
        className="mt-8 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const r = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          const d = await r.json();
          if (!r.ok) setError(d.error || "Could not sign up");
          else router.replace("/onboarding");
        }}
      >
        <input className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" type="password" placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-[var(--warn)]">{error}</p>}
        <button className="btn btn-primary w-full" type="submit">
          Sign up
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account? <Link href="/login" className="underline">Sign in</Link>
      </p>
    </div>
  );
}
