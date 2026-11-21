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
    <div className="shell">
      <aside className="shell-side">
        <Link href="/" className="brand">
          NunezTracker
        </Link>
        <p className="user-name">{name}</p>
        {sample && (
          <p className="card" style={{ marginTop: "0.75rem", padding: "0.45rem 0.6rem", fontSize: "0.75rem" }}>
            Sample data — no database yet
          </p>
        )}
        <nav className="side-nav">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={path === n.href ? "active" : undefined}>
              <n.icon size={16} />
              {n.label}
            </Link>
          ))}
        </nav>
        <p className="obj-label">Objects</p>
        <nav className="obj-nav">
          {types.map((t) => (
            <Link key={t.slug} href={`/o/${t.slug}`} className={path.startsWith(`/o/${t.slug}`) ? "active" : undefined}>
              {t.name}
            </Link>
          ))}
        </nav>
        <Link href="/o/tasks/new" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
          <Plus size={16} /> New task
        </Link>
      </aside>
      <div className="shell-main">
        <header className="topbar">
          <span className="brand">NunezTracker</span>
          <Link href="/o/tasks/new" className="btn btn-primary" style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}>
            <Plus size={16} /> Add
          </Link>
        </header>
        {sample && onboarded && (
          <div style={{ background: "#fde68a", padding: "0.5rem 1rem", textAlign: "center", fontSize: "0.85rem" }}>
            Sample data
          </div>
        )}
        <CheckinBanner />
        <main className="page">{children}</main>
      </div>
      <nav className="tabbar" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={path === n.href ? "active" : undefined}>
            <n.icon size={18} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
