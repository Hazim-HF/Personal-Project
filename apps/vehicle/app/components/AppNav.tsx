"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/services", label: "Services" },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <a
          href="https://portfolio.hazimfitri.com"
          className="text-lg font-semibold tracking-wide text-white transition hover:text-cyan-300"
        >
          Hazim<span className="text-fuchsia-400">.</span>
        </a>
        <div className="h-6 w-px bg-white/15" />
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">AutoTrack</p>
          <p className="text-xs text-slate-400">Vehicle maintenance, simplified</p>
        </div>
      </div>

      <nav className="flex items-center gap-1 text-sm text-slate-300">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 font-medium transition ${
                active ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
      >
        Sign Out
      </button>
    </header>
  );
}
