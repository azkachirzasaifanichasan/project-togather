"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./map-inner";

export interface MapViewProps {
  markers: MapMarker[];
  center: { lat: number; lng: number };
  focusId: string | null;
  onMarkerClick?: (id: string) => void;
}

const Inner = dynamic(() => import("./map-inner").then((m) => m.MapInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-paper">
      <p className="text-sm text-muted">Memuat peta…</p>
    </div>
  ),
});

export function MapView(props: MapViewProps) {
  return <Inner {...props} />;
}