import { distanceScore } from "./geo";

// ---------------------------------------------------------------------------
// Togather's explainable matching.
//
// The score is a deterministic, weighted average over the signals actually
// available for a given user+community pair. Weights reflect the product brief:
//   minat 0.30 · jarak 0.25 · jadwal 0.15 · kesehatan 0.15 · rating 0.10 · mutual 0.05
// When a signal is unavailable (guest with no interests, online community with
// no distance, no connection data…), it is dropped and the remaining weights
// are renormalized so the score stays in 0..100.
// ---------------------------------------------------------------------------

export type InterestReason = { kind: "interest"; count: number };
export type DistanceReason = { kind: "distance"; km: number };
export type ScheduleReason = { kind: "schedule"; labels: string[] };
export type HealthReason = { kind: "health"; label: string };
export type RatingReason = { kind: "rating"; value: number };
export type MutualReason = { kind: "mutual"; count: number };
export type Reason =
  | InterestReason
  | DistanceReason
  | ScheduleReason
  | HealthReason
  | RatingReason
  | MutualReason;

export interface MatchResult {
  score: number; // 0..100
  reasons: Reason[];
  signalsUsed: number;
}

const WEIGHTS = {
  interest: 0.3,
  distance: 0.25,
  schedule: 0.15,
  health: 0.15,
  rating: 0.1,
  mutual: 0.05,
} as const;

export interface MatchInput {
  userInterests: string[];
  userScheduleSlots: string[];
  distanceKm: number | null; // null when unknown or community is online-only
  communityInterests: string[];
  communityScheduleSlots: string[];
  communityIsOnline: boolean;
  health: number; // 0..1 health score
  avgRating: number | null; // 1..5 or null
  mutualFriends: number; // viewer's connections who joined this community
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function interestOverlap(userInterests: string[], communityInterests: string[]): string[] {
  const set = new Set(communityInterests);
  return userInterests.filter((i) => set.has(i));
}

export function scoreMatch(input: MatchInput): MatchResult {
  const parts: { weight: number; value: number; reason: Reason }[] = [];

  // Interest — only meaningful when the user has declared interests.
  if (input.userInterests.length > 0) {
    const overlap = interestOverlap(input.userInterests, input.communityInterests);
    const value = overlap.length / input.userInterests.length;
    parts.push({
      weight: WEIGHTS.interest,
      value: clamp01(value),
      reason: { kind: "interest", count: overlap.length },
    });
  }

  // Distance — skip for online communities or unknown location.
  if (!input.communityIsOnline && input.distanceKm != null) {
    parts.push({
      weight: WEIGHTS.distance,
      value: distanceScore(input.distanceKm),
      reason: { kind: "distance", km: input.distanceKm },
    });
  }

  // Schedule — only meaningful when both sides declare slots.
  if (input.userScheduleSlots.length > 0 && input.communityScheduleSlots.length > 0) {
    const communitySet = new Set(input.communityScheduleSlots);
    const overlap = input.userScheduleSlots.filter((s) => communitySet.has(s));
    const value = overlap.length / input.userScheduleSlots.length;
    parts.push({
      weight: WEIGHTS.schedule,
      value: clamp01(value),
      reason: { kind: "schedule", labels: overlap },
    });
  }

  // Health — always available.
  parts.push({
    weight: WEIGHTS.health,
    value: clamp01(input.health),
    reason: { kind: "health", label: healthLabel(input.health) },
  });

  // Rating — only when reviews exist.
  if (input.avgRating != null) {
    const value = (input.avgRating - 1) / 4;
    parts.push({
      weight: WEIGHTS.rating,
      value: clamp01(value),
      reason: { kind: "rating", value: input.avgRating },
    });
  }

  // Mutual connections — only when data exists.
  if (input.mutualFriends > 0) {
    parts.push({
      weight: WEIGHTS.mutual,
      value: clamp01(Math.min(input.mutualFriends / 5, 1)),
      reason: { kind: "mutual", count: input.mutualFriends },
    });
  }

  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) {
    return { score: 0, reasons: [], signalsUsed: 0 };
  }

  const weighted = parts.reduce((sum, p) => sum + p.weight * p.value, 0);
  const score = Math.round((weighted / totalWeight) * 100);

  return {
    score,
    reasons: parts.map((p) => p.reason),
    signalsUsed: parts.length,
  };
}

export function healthLabel(health: number): string {
  if (health >= 0.5) return "sangat aktif";
  if (health >= 0.25) return "aktif";
  if (health >= 0.08) return "mulai ramai";
  return "belum banyak aktivitas";
}

// Community health prioritizes event attendance, then chat activity, then
// online/offline presence — per the product brief. Uses saturating curves so
// small-but-active communities (the pilot uses small groups) still register
// as healthy. Bounded 0..1.
export interface HealthSignals {
  attendedCount: number;
  messageCount: number;
  isOnline: boolean;
}

export function healthScore({ attendedCount, messageCount, isOnline }: HealthSignals): number {
  const attendance = 1 - Math.exp(-attendedCount / 3);
  const chat = 1 - Math.exp(-messageCount / 8);
  const online = isOnline ? 1 : 0;
  return clamp01(0.5 * attendance + 0.3 * chat + 0.2 * online);
}