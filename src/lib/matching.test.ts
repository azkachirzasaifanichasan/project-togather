import { describe, it, expect } from "vitest";
import {
  healthScore,
  interestOverlap,
  scoreMatch,
  type MatchInput,
} from "./matching";

function base(input: Partial<MatchInput>): MatchInput {
  return {
    userInterests: [],
    userScheduleSlots: [],
    distanceKm: null,
    communityInterests: [],
    communityScheduleSlots: [],
    communityIsOnline: false,
    health: 0.5,
    avgRating: null,
    mutualFriends: 0,
    ...input,
  };
}

describe("interestOverlap", () => {
  it("returns shared interests", () => {
    expect(interestOverlap(["Lari", "Fotografi"], ["Fotografi", "Musik"])).toEqual(["Fotografi"]);
  });
  it("returns empty when none shared", () => {
    expect(interestOverlap(["Lari"], ["Memasak"])).toEqual([]);
  });
});

describe("healthScore", () => {
  it("is bounded 0..1", () => {
    const s = healthScore({ attendedCount: 100, messageCount: 1000, isOnline: true });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
  it("prioritizes attendance over chat over online", () => {
    const withAttendance = healthScore({ attendedCount: 20, messageCount: 0, isOnline: false });
    const withChatOnly = healthScore({ attendedCount: 0, messageCount: 100, isOnline: false });
    const onlineOnly = healthScore({ attendedCount: 0, messageCount: 0, isOnline: true });
    expect(withAttendance).toBeGreaterThan(withChatOnly);
    expect(withChatOnly).toBeGreaterThan(onlineOnly);
  });
});

describe("scoreMatch", () => {
  it("drops signals that are unavailable and renormalizes", () => {
    const result = scoreMatch(base({ distanceKm: 5, health: 0.8 }));
    expect(result.signalsUsed).toBe(2); // distance + health
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("scores a full personalized match higher than a weak match", () => {
    const strong = scoreMatch(
      base({
        userInterests: ["Lari", "Fotografi", "Pemrograman", "Merajut"],
        userScheduleSlots: ["weekend-morning"],
        communityInterests: ["Lari", "Fotografi", "Pemrograman", "Merajut"],
        communityScheduleSlots: ["weekend-morning"],
        distanceKm: 1,
        health: 0.9,
        avgRating: 5,
        mutualFriends: 3,
      }),
    );
    const weak = scoreMatch(
      base({
        userInterests: ["Lari", "Fotografi", "Pemrograman", "Merajut"],
        userScheduleSlots: ["weekend-morning"],
        communityInterests: ["Memasak"],
        communityScheduleSlots: ["weekday-evening"],
        distanceKm: 50,
        health: 0.1,
        avgRating: 2,
      }),
    );
    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("reports shared interest count as a reason", () => {
    const result = scoreMatch(
      base({
        userInterests: ["Lari", "Fotografi"],
        communityInterests: ["Lari", "Membaca", "Fotografi"],
        distanceKm: 3,
      }),
    );
    const interest = result.reasons.find((r) => r.kind === "interest");
    expect(interest).toBeDefined();
    if (interest?.kind === "interest") expect(interest.count).toBe(2);
  });

  it("omits distance for online communities", () => {
    const result = scoreMatch(
      base({
        communityIsOnline: true,
        userInterests: ["Lari"],
        communityInterests: ["Lari"],
        distanceKm: 0,
      }),
    );
    expect(result.reasons.some((r) => r.kind === "distance")).toBe(false);
  });

  it("adds a mutual reason only when connections exist", () => {
    const result = scoreMatch(
      base({
        userInterests: ["Lari"],
        communityInterests: ["Lari"],
        mutualFriends: 2,
      }),
    );
    const mutual = result.reasons.find((r) => r.kind === "mutual");
    expect(mutual).toBeDefined();
    if (mutual?.kind === "mutual") expect(mutual.count).toBe(2);
  });
});