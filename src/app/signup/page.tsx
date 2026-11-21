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
    <div className="auth">
      <h1 className="page-title">Request access</h1>
      <p className="lede">New accounts stay pending until an admin approves them. Signup is not a path to admin.</p>
      <form
        className="form-stack"
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
          else router.replace("/pending");
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
        Already approved? <Link href="/login" className="underline">Sign in</Link>
      </p>
    </div>
  );
}
