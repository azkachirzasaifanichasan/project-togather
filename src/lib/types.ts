import type { Reason } from "./matching";

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export type VerificationStatus = "verified" | "pending" | "unverified";

export interface CommunitySummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryName: string;
  categorySlug: string;
  city: string;
  lat: number | null;
  lng: number | null;
  isOnline: boolean;
  isVerified: boolean;
  verifiedBy: string | null;
  verificationStatus: VerificationStatus;
  scheduleSlots: string[];
  interestNames: string[];
  memberCount: number;
  avgRating: number | null;
  ratingCount: number;
  health: number;
  isQuiet: boolean;
  mutualFriends: number;
  upcomingCount: number;
  distanceKm: number | null;
  distanceLabel: string | null;
  matchScore: number | null;
  matchReasons: Reason[];
  isJoined: boolean;
  isAdmin: boolean;
  nextEvent: { title: string; startsAt: Date } | null;
}

export interface ChatMessage {
  id: string;
  authorName: string;
  isOwn: boolean;
  isAdmin: boolean;
  content: string;
  timeLabel: string;
}

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  venueName: string;
  city: string;
  lat: number | null;
  lng: number | null;
  startsAt: Date;
  endsAt: Date;
  capacity: number | null;
  registeredCount: number;
  community: {
    name: string;
    slug: string;
    isVerified: boolean;
    city: string;
  };
}

export interface EventDetail extends EventSummary {
  isRegistered: boolean;
  isWaitlisted: boolean;
  remaining: number | null;
  isPast: boolean;
}