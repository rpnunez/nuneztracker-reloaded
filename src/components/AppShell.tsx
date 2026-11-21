"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Cog, Home, Medal, Plus, Shapes } from "lucide-react";
import { useEffect, useState } from "react";
import { CheckinBanner } from "./CheckinBanner";

type TypeNav = { slug: string; name: string };

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [types, setTypes] = useState<TypeNav[]>([]);
  const [name, setName] = useState("");
  const [onboarded, setOnboarded] = useState(true);
  const [sample, setSample] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/login");
          return null;
        }
        if (r.status === 403) {
          router.replace("/pending");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setTypes(d.types ?? []);
        setName(d.user?.name || d.user?.email || "");
        setOnboarded(Boolean(d.user?.onboarded));
        setSample(Boolean(d.sample));
        setIsAdmin(d.user?.role === "admin");
        if (d.user && !d.user.onboarded && path !== "/onboarding") router.replace("/onboarding");
      })
      .catch(() => router.replace("/login"));
  }, [path, router]);

  const nav = [
    { href: "/", label: "Today", icon: Home },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/score", label: "Score", icon: Medal },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shapes }] : []),
    { href: "/settings", label: "Settings", icon: Cog },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--line)] p-5 md:flex">
        <Link href="/" className="font-[family-name:var(--font-display)] text-2xl">
          NunezTracker
        </Link>
        <p className="mt-1 text-sm text-[var(--muted)]">{name}</p>
        {sample && (
          <p className="mt-2 rounded-lg bg-amber-100 px-2 py-1 text-xs text-amber-900">Sample data — no database yet</p>
        )}
        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${path === n.href ? "bg-[var(--ink)] text-[var(--paper)]" : "hover:bg-black/5"}`}
            >
              <n.icon size={16} />
              {n.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 text-xs uppercase tracking-wide text-[var(--muted)]">Objects</p>
        <nav className="mt-2 flex flex-col gap-1">
          {types.map((t) => (
            <Link key={t.slug} href={`/o/${t.slug}`} className={`rounded-xl px-3 py-2 text-sm ${path.startsWith(`/o/${t.slug}`) ? "bg-black/5" : "hover:bg-black/5"}`}>
              {t.name}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 md:hidden">
          <span className="font-[family-name:var(--font-display)] text-xl">NunezTracker</span>
          <Link href="/o/tasks/new" className="btn btn-primary px-3 py-1.5 text-sm">
            <Plus size={16} /> Add
          </Link>
        </header>
        {sample && onboarded && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950 md:hidden">Sample data</div>
        )}
        <CheckinBanner />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[var(--line)] bg-[var(--paper)] md:hidden">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-1 py-2 text-[11px] ${path === n.href ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
            <n.icon size={18} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
