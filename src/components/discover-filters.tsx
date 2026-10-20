"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BadgeCheck, MapPin, Search, Wifi } from "lucide-react";
import { cn } from "@/lib/cn";

export interface FilterState {
  q: string;
  sort: string;
  online: boolean;
  verified: boolean;
  radius: string;
}

function buildQuery(state: FilterState): string {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.sort && state.sort !== "relevance") p.set("sort", state.sort);
  if (state.online) p.set("online", "1");
  if (state.verified) p.set("verified", "1");
  if (state.radius) p.set("radius", state.radius);
  return p.toString();
}

export function DiscoverFilters({ initial, showRadius = true }: { initial: FilterState; showRadius?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(initial.q);
  const [sort, setSort] = useState(initial.sort);
  const [online, setOnline] = useState(initial.online);
  const [verified, setVerified] = useState(initial.verified);
  const [radius, setRadius] = useState(initial.radius);

  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const state = { q, sort, online, verified, radius };
    const timer = setTimeout(() => {
      const qs = buildQuery(state);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [q, sort, online, verified, radius, pathname, router]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Cari komunitas</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari komunitas atau kata kunci…"
            className="h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
        </label>

        <label className="flex items-center gap-2 sm:shrink-0">
          <span className="sr-only">Urutkan hasil</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 rounded-lg border border-line bg-surface px-3 text-sm text-ink-soft focus:border-ink focus:outline-none"
          >
            <option value="relevance">Paling relevan</option>
            <option value="nearest">Terdekat</option>
            <option value="active">Paling aktif</option>
            <option value="rating">Rating tertinggi</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOnline((v) => !v)}
          aria-pressed={online}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            online
              ? "border-ink bg-ink text-paper"
              : "border-line bg-surface text-ink-soft hover:border-line-strong",
          )}
        >
          <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
          Online
        </button>
        <button
          type="button"
          onClick={() => setVerified((v) => !v)}
          aria-pressed={verified}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            verified
              ? "border-ink bg-ink text-paper"
              : "border-line bg-surface text-ink-soft hover:border-line-strong",
          )}
        >
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Terverifikasi
        </button>
        {showRadius && (
          <label className="inline-flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              aria-label="Jarak maksimum"
              className="rounded-full border border-line bg-surface px-2.5 py-1.5 text-sm font-medium text-ink-soft focus:border-ink focus:outline-none"
            >
              <option value="">Semua jarak</option>
              <option value="2">≤ 2 km</option>
              <option value="5">≤ 5 km</option>
              <option value="10">≤ 10 km</option>
              <option value="20">≤ 20 km</option>
            </select>
          </label>
        )}
      </div>
    </div>
  );
}