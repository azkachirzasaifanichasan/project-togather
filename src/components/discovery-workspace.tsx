"use client";

import { useState } from "react";
import { List, Map as MapIcon, SearchX } from "lucide-react";
import type { CommunitySummary } from "@/lib/types";
import { CommunityCard } from "@/components/community-card";
import { MapView, type MapViewProps } from "@/components/map/map-view";
import { EmptyState, SecondaryLink } from "@/components/primitives";
import { cn } from "@/lib/cn";

export function DiscoveryWorkspace({
  communities,
  center,
}: {
  communities: CommunitySummary[];
  center: { lat: number; lng: number };
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");

  const markers: MapViewProps["markers"] = communities
    .filter((c) => c.lat != null && c.lng != null)
    .map((c) => ({
      id: c.id,
      lat: c.lat!,
      lng: c.lng!,
      label: c.name,
      sublabel: `${c.categoryName}${
        c.distanceKm != null
          ? ` · ${c.distanceKm < 10 ? c.distanceKm.toFixed(1).replace(".", ",") : Math.round(c.distanceKm)} km`
          : ""
      }`,
      href: `/komunitas/${c.slug}`,
    }));

  function select(id: string) {
    setSelectedId(id);
    const el = document.getElementById(`k-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  if (communities.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="h-6 w-6" />}
        title="Tidak ada hasil"
        description="Coba ubah kata kunci atau kurangi filter untuk menemukan komunitas di sekitarmu."
        action={<SecondaryLink href="/jelajah">Reset filter</SecondaryLink>}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <p className="text-sm text-muted">
          {communities.length} komunitas ditemukan
        </p>
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                view === v ? "bg-ink text-paper" : "text-ink-soft",
              )}
            >
              {v === "list" ? (
                <List className="h-4 w-4" aria-hidden="true" />
              ) : (
                <MapIcon className="h-4 w-4" aria-hidden="true" />
              )}
              {v === "list" ? "Daftar" : "Peta"}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div className={cn("space-y-3", view === "map" && "hidden lg:block")}>
          {communities.map((c) => (
            <div
              key={c.id}
              id={`k-${c.id}`}
              onMouseEnter={() => setSelectedId(c.id)}
              onFocusCapture={() => setSelectedId(c.id)}
              className={cn(
                "rounded-2xl transition-[box-shadow] duration-150",
                selectedId === c.id && "ring-2 ring-accent ring-offset-2 ring-offset-paper",
              )}
            >
              <CommunityCard community={c} />
            </div>
          ))}
        </div>

        <div className={cn("lg:block", view === "list" && "hidden")}>
          <div className="sticky top-20 h-[62vh] overflow-hidden rounded-2xl border border-line lg:h-[calc(100vh-7rem)]">
            <MapView
              markers={markers}
              center={center}
              focusId={selectedId}
              onMarkerClick={(id) => select(id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}