import { describe, it, expect } from "vitest";
import { distanceScore, formatKm, haversineKm } from "./geo";

describe("haversineKm", () => {
  it("returns ~0 for identical points", () => {
    expect(haversineKm({ lat: -7.8, lng: 110.36 }, { lat: -7.8, lng: 110.36 })).toBeCloseTo(0, 5);
  });

  it("computes a plausible Yogyakarta distance", () => {
    // Alun-alun Utara to Tugu Pal Putih (~2.5 km).
    const d = haversineKm({ lat: -7.807, lng: 110.3637 }, { lat: -7.7829, lng: 110.367 });
    expect(d).toBeGreaterThan(1);
    expect(d).toBeLessThan(5);
  });
});

describe("distanceScore", () => {
  it("is 1 at 0 km and decreases with distance", () => {
    expect(distanceScore(0)).toBe(1);
    expect(distanceScore(10)).toBeLessThan(distanceScore(2));
  });
  it("floors at 0 beyond the radius", () => {
    expect(distanceScore(100)).toBe(0);
  });
});

describe("formatKm", () => {
  it("formats meters under 1 km", () => {
    expect(formatKm(0.5).replace(" ", "")).toMatch(/500/);
  });
  it("uses Indonesian decimal comma", () => {
    expect(formatKm(2.3)).toContain("2,3");
  });
});