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
    <div className="auth">
      <h1 className="page-title">NunezTracker</h1>
      <p className="lede">Admin sign-in is raypn93@gmail.com with the password saved as ADMIN_INITIAL_PASSWORD. Other accounts stay pending until an admin approves them.</p>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const r = await fetch("/api/auth/login", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
          });
          const d = await r.json();
          if (d.code === "pending") router.replace("/pending");
          else if (!r.ok) setError(d.error || "Could not sign in");
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
        No account? <Link href="/signup" className="underline">Request access</Link>
      </p>
    </div>
  );
}
