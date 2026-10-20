export interface Coord {
  lat: number;
  lng: number;
}

// City-level reference coordinates. Kept coarse on purpose: Togather v1 does
// not collect or share precise user location — only city + public venue coords.
export const CITY_COORDS: Record<string, Coord> = {
  Yogyakarta: { lat: -7.7971, lng: 110.3688 },
  Sleman: { lat: -7.7056, lng: 110.3354 },
  Bantul: { lat: -7.8886, lng: 110.3227 },
  "Jakarta": { lat: -6.2088, lng: 106.8456 },
  Bandung: { lat: -6.9175, lng: 107.6191 },
  Surabaya: { lat: -7.2575, lng: 112.7521 },
  Semarang: { lat: -6.9667, lng: 110.4167 },
};

export const DEFAULT_LOCATION: Coord = CITY_COORDS.Yogyakarta;

export function coordForCity(city: string | null | undefined): Coord | null {
  if (!city) return null;
  const normalized = city.trim();
  return CITY_COORDS[normalized] ?? CITY_COORDS.Yogyakarta;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: Coord, b: Coord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

const DISTANCE_RADIUS_KM = 20;

export function distanceScore(distanceKm: number): number {
  return Math.max(0, Math.min(1, 1 - distanceKm / DISTANCE_RADIUS_KM));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  const rounded = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  return `${Number(rounded).toLocaleString("id-ID")} km`;
}