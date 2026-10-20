"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  href: string;
}

function pinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -34],
    html: `<svg width="30" height="38" viewBox="0 0 24 30" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 18 12 18s12-9 12-18C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fffdf9" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4.5" fill="#fffdf9"/>
    </svg>`,
  });
}

export function MapInner({
  markers,
  center,
  focusId,
  onMarkerClick,
}: {
  markers: MapMarker[];
  center: { lat: number; lng: number };
  focusId: string | null;
  onMarkerClick?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    });
    map.setView([center.lat, center.lng], 13);

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      },
    );
    tiles.on("tileerror", () => setTileError(true));
    tiles.addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const byId = new Map<string, L.Marker>();
    for (const m of markers) {
      if (m.lat == null || m.lng == null) continue;
      const existing = markersRef.current.get(m.id);
      if (existing) {
        existing.setLatLng([m.lat, m.lng]);
        byId.set(m.id, existing);
        continue;
      }
      const marker = L.marker([m.lat, m.lng], { icon: pinIcon("#e4572e") }).addTo(map);
      marker.bindPopup(
        `<div style="min-width:160px">
          <div style="font-weight:600;font-size:13px;line-height:1.3">${escapeHtml(m.label)}</div>
          ${m.sublabel ? `<div style="font-size:12px;color:#7d766c;margin-top:2px">${escapeHtml(m.sublabel)}</div>` : ""}
          <a href="${m.href}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:#c7441d">Lihat detail →</a>
        </div>`,
        { closeButton: false },
      );
      marker.on("click", () => onMarkerClick?.(m.id));
      byId.set(m.id, marker);
    }

    for (const [id, marker] of markersRef.current.entries()) {
      if (!byId.has(id)) {
        marker.remove();
      }
    }
    markersRef.current = byId;
  }, [markers, onMarkerClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusId) return;
    const marker = markersRef.current.get(focusId);
    if (marker) {
      marker.openPopup();
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 14), { animate: true });
    }
  }, [focusId]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {tileError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-muted">
            Peta tidak dapat dimuat — coba lagi nanti.
          </p>
        </div>
      )}
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}