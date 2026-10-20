"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, Menu, Settings, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SafeUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/jelajah", label: "Jelajah" },
  { href: "/komunitas", label: "Komunitas" },
  { href: "/event", label: "Event" },
  { href: "/komunitasku", label: "Komunitasku" },
];

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
      fill="none"
    >
      <path
        d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z"
        fill="currentColor"
        className="text-accent"
      />
      <circle cx="12" cy="10.5" r="2.25" fill="#fffdf9" />
    </svg>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function SiteHeader({ user }: { user: SafeUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight"
        >
          <BrandMark />
          <span>Togather</span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-line/50 hover:text-ink",
                isActive(item.href) && "bg-line/60 text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-sm font-medium transition-colors hover:border-line-strong"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
                  {initials(user.name)}
                </span>
                <span className="hidden max-w-[10rem] truncate sm:inline">{user.name}</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-strong"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/profil"
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-paper"
                    >
                      <Settings className="h-4 w-4" /> Profil & minat
                    </Link>
                    <Link
                      href="/komunitasku"
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-paper"
                    >
                      <Users className="h-4 w-4" /> Komunitasku
                    </Link>
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper"
                      >
                        <LogOut className="h-4 w-4" /> Keluar
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/masuk"
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-paper transition-colors hover:bg-ink/90"
              >
                Daftar
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-paper md:hidden">
          <nav aria-label="Navigasi seluler" className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-line/50",
                  isActive(item.href) && "bg-line/60 text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/masuk"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-semibold"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg bg-ink px-3 py-2.5 text-center text-sm font-semibold text-paper"
                >
                  Daftar
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}