import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  healthScore,
  scoreMatch,
  type MatchInput,
} from "./matching";
import { coordForCity, DEFAULT_LOCATION, haversineKm, type Coord } from "./geo";
import { parseSlots } from "./slots";
import { formatChatTime } from "./format";
import type { SafeUser } from "./auth";
import type {
  CommunitySummary,
  EventDetail,
  EventSummary,
  CategoryInfo,
  ChatMessage,
} from "./types";

// ---------------------------------------------------------------------------
// Shared include for community list/detail queries.
// ---------------------------------------------------------------------------
const communityInclude = {
  category: { select: { name: true, slug: true } },
  interests: { include: { interest: { select: { name: true } } } },
  events: { select: { id: true, title: true, startsAt: true } },
  _count: { select: { memberships: { where: { status: "active" } } } },
} satisfies Prisma.CommunityInclude;

type RawCommunity = Prisma.CommunityGetPayload<{ include: typeof communityInclude }>;

interface ViewerProfile {
  interests: string[];
  scheduleSlots: string[];
}

interface ViewerInfo extends ViewerProfile {
  coord: Coord | null;
  distanceLabel: string;
  membershipByCommunity: Map<string, { role: string; status: string }>;
}

async function resolveViewer(userId: string | null): Promise<ViewerInfo> {
  if (!userId) {
    return {
      interests: [],
      scheduleSlots: [],
      coord: { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng },
      distanceLabel: "pusat kota Yogyakarta",
      membershipByCommunity: new Map(),
    };
  }

  const [user, interests, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { lat: true, lng: true, city: true, scheduleSlots: true },
    }),
    prisma.userInterest.findMany({
      where: { userId },
      include: { interest: { select: { name: true } } },
    }),
    prisma.membership.findMany({
      where: { userId, status: "active" },
      select: { communityId: true, role: true, status: true },
    }),
  ]);

  let coord: Coord | null = null;
  let distanceLabel = "pusat kota Yogyakarta";
  if (user?.lat != null && user?.lng != null) {
    coord = { lat: user.lat, lng: user.lng };
    distanceLabel = "lokasimu";
  } else if (user?.city) {
    coord = coordForCity(user.city);
    if (coord) distanceLabel = `pusat ${user.city}`;
  }
  if (!coord) {
    coord = DEFAULT_LOCATION;
  }

  const membershipByCommunity = new Map(
    memberships.map((m) => [m.communityId, { role: m.role, status: m.status }]),
  );

  return {
    interests: interests.map((i) => i.interest.name),
    scheduleSlots: parseSlots(user?.scheduleSlots ?? ""),
    coord,
    distanceLabel,
    membershipByCommunity,
  };
}

async function ratingAggregate(): Promise<Map<string, { avg: number; count: number }>> {
  const grouped = await prisma.review.groupBy({
    by: ["communityId"],
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = new Map<string, { avg: number; count: number }>();
  for (const g of grouped) {
    if (g._avg.rating != null) {
      map.set(g.communityId, { avg: g._avg.rating, count: g._count._all });
    }
  }
  return map;
}

interface HealthAgg {
  attendedCount: number;
  messageCount: number;
}

async function healthAggregate(): Promise<Map<string, HealthAgg>> {
  const [attended, messageGroups] = await Promise.all([
    prisma.eventRegistration.findMany({
      where: { status: "attended" },
      select: { event: { select: { communityId: true } } },
    }),
    prisma.chatMessage.groupBy({
      by: ["communityId"],
      _count: { _all: true },
    }),
  ]);

  const map = new Map<string, HealthAgg>();
  for (const a of attended) {
    const cid = a.event.communityId;
    const cur = map.get(cid) ?? { attendedCount: 0, messageCount: 0 };
    cur.attendedCount += 1;
    map.set(cid, cur);
  }
  for (const m of messageGroups) {
    const cur = map.get(m.communityId) ?? { attendedCount: 0, messageCount: 0 };
    cur.messageCount = m._count._all;
    map.set(m.communityId, cur);
  }
  return map;
}

async function pendingVerificationSet(): Promise<Set<string>> {
  const pending = await prisma.verificationRequest.findMany({
    where: { status: "pending" },
    select: { communityId: true },
  });
  return new Set(pending.map((p) => p.communityId));
}

// Per-community count of the viewer's connections who are members.
async function mutualMap(userId: string | null): Promise<Map<string, number>> {
  if (!userId) return new Map();
  const connections = await prisma.userConnection.findMany({
    where: { userId },
    select: { connectionId: true },
  });
  const ids = connections.map((c) => c.connectionId);
  if (ids.length === 0) return new Map();

  const memberships = await prisma.membership.findMany({
    where: { userId: { in: ids }, status: "active" },
    select: { communityId: true },
  });
  const map = new Map<string, number>();
  for (const m of memberships) {
    map.set(m.communityId, (map.get(m.communityId) ?? 0) + 1);
  }
  return map;
}

function buildMatchInput(
  raw: RawCommunity,
  viewer: ViewerInfo,
  distanceKm: number | null,
  avgRating: number | null,
  health: number,
  mutualFriends: number,
): MatchInput {
  return {
    userInterests: viewer.interests,
    userScheduleSlots: viewer.scheduleSlots,
    distanceKm,
    communityInterests: raw.interests.map((i) => i.interest.name),
    communityScheduleSlots: parseSlots(raw.scheduleSlots),
    communityIsOnline: raw.isOnline,
    health,
    avgRating,
    mutualFriends,
  };
}

function toSummary(
  raw: RawCommunity,
  viewer: ViewerInfo,
  rating: { avg: number; count: number } | undefined,
  health: HealthAgg | undefined,
  mutualCount: number,
  verificationPending: boolean,
): CommunitySummary {
  const isOnline = raw.isOnline;
  const coord =
    raw.lat != null && raw.lng != null ? { lat: raw.lat, lng: raw.lng } : null;

  const distanceKm =
    !isOnline && coord && viewer.coord ? haversineKm(viewer.coord, coord) : null;

  const now = Date.now();
  const upcoming = raw.events
    .filter((e) => e.startsAt.getTime() > now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const attendedCount = health?.attendedCount ?? 0;
  const messageCount = health?.messageCount ?? 0;
  const healthVal = healthScore({ attendedCount, messageCount, isOnline });

  const isQuiet =
    upcoming.length === 0 && attendedCount === 0 && messageCount === 0;

  const verificationStatus = raw.isVerified
    ? "verified"
    : verificationPending
      ? "pending"
      : "unverified";

  const avgRating = rating?.count ? rating.avg : null;

  const match = scoreMatch(
    buildMatchInput(raw, viewer, distanceKm, avgRating, healthVal, mutualCount),
  );

  const membership = viewer.membershipByCommunity.get(raw.id);

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    categoryName: raw.category.name,
    categorySlug: raw.category.slug,
    city: raw.city,
    lat: raw.lat ?? null,
    lng: raw.lng ?? null,
    isOnline,
    isVerified: raw.isVerified,
    verifiedBy: raw.verifiedBy ?? null,
    verificationStatus,
    scheduleSlots: parseSlots(raw.scheduleSlots),
    interestNames: raw.interests.map((i) => i.interest.name),
    memberCount: raw._count.memberships,
    avgRating,
    ratingCount: rating?.count ?? 0,
    health: healthVal,
    isQuiet,
    mutualFriends: mutualCount,
    upcomingCount: upcoming.length,
    distanceKm,
    distanceLabel: viewer.distanceLabel,
    matchScore: match.score,
    matchReasons: match.reasons,
    isJoined: membership?.status === "active",
    isAdmin: membership?.role === "admin",
    nextEvent: upcoming[0]
      ? { title: upcoming[0].title, startsAt: upcoming[0].startsAt }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Public queries
// ---------------------------------------------------------------------------
export interface InterestOption {
  id: string;
  name: string;
  categoryName: string;
}

export async function getInterestOptions(): Promise<InterestOption[]> {
  const interests = await prisma.interest.findMany({
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
  return interests.map((i) => ({
    id: i.id,
    name: i.name,
    categoryName: i.category.name,
  }));
}

export async function getCategories(): Promise<CategoryInfo[]> {
  const cats = await prisma.category.findMany({
    include: { _count: { select: { communities: true } } },
    orderBy: { name: "asc" },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c._count.communities,
  }));
}

export type CommunitySort = "relevance" | "nearest" | "active" | "rating";

export interface CommunityFilters {
  q?: string;
  category?: string;
  online?: boolean;
  verified?: boolean;
  radiusKm?: number;
  sort?: CommunitySort;
  limit?: number;
}

export async function getCommunities(
  viewer: SafeUser | null,
  filters: CommunityFilters = {},
): Promise<CommunitySummary[]> {
  const where: Prisma.CommunityWhereInput = {};
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { description: { contains: filters.q } },
      { city: { contains: filters.q } },
    ];
  }
  if (filters.category) {
    where.category = { slug: filters.category };
  }
  if (filters.online) where.isOnline = true;
  if (filters.verified) where.isVerified = true;

  const userId = viewer?.id ?? null;
  const [raws, ratings, viewerInfo, health, mutual, pendingVerify] = await Promise.all([
    prisma.community.findMany({ where, include: communityInclude }),
    ratingAggregate(),
    resolveViewer(userId),
    healthAggregate(),
    mutualMap(userId),
    pendingVerificationSet(),
  ]);

  let list = raws.map((r) =>
    toSummary(
      r,
      viewerInfo,
      ratings.get(r.id),
      health.get(r.id),
      mutual.get(r.id) ?? 0,
      pendingVerify.has(r.id),
    ),
  );

  if (filters.radiusKm != null) {
    list = list.filter(
      (c) => c.distanceKm != null && c.distanceKm <= filters.radiusKm!,
    );
  }

  const sort: CommunitySort = filters.sort ?? "relevance";
  list.sort(comparator(sort));

  if (filters.limit) return list.slice(0, filters.limit);
  return list;
}

function comparator(sort: CommunitySort) {
  return (a: CommunitySummary, b: CommunitySummary): number => {
    switch (sort) {
      case "nearest":
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      case "active":
        return b.health - a.health;
      case "rating":
        return (b.avgRating ?? 0) - (a.avgRating ?? 0);
      case "relevance":
      default:
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
    }
  };
}

export async function getCommunityBySlug(
  viewer: SafeUser | null,
  slug: string,
) {
  const userId = viewer?.id ?? null;
  const [
    raw,
    ratings,
    viewerInfo,
    health,
    mutual,
    pendingVerify,
    events,
    places,
    reviews,
    chat,
  ] = await Promise.all([
    prisma.community.findUniqueOrThrow({
      where: { slug },
      include: {
        ...communityInclude,
        owner: { select: { name: true } },
      },
    }),
    ratingAggregate(),
    resolveViewer(userId),
    healthAggregate(),
    mutualMap(userId),
    pendingVerificationSet(),
    prisma.event.findMany({
      where: { community: { slug } },
      include: {
        _count: {
          select: {
            registrations: { where: { status: { in: ["registered", "attended"] } } },
          },
        },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.place.findMany({
      where: { community: { slug } },
      include: {
        addedBy: { select: { name: true } },
        votes: { select: { emoji: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { community: { slug } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.chatMessage.findMany({
      where: { community: { slug } },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            memberships: {
              where: { community: { slug } },
              select: { role: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
  ]);

  const summary = toSummary(
    raw,
    viewerInfo,
    ratings.get(raw.id),
    health.get(raw.id),
    mutual.get(raw.id) ?? 0,
    pendingVerify.has(raw.id),
  );

  const now = new Date();
  const eventSummaries: EventSummary[] = events.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    description: e.description,
    venueName: e.venueName,
    city: raw.city,
    lat: e.lat ?? null,
    lng: e.lng ?? null,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    capacity: e.capacity ?? null,
    registeredCount: e._count.registrations,
    community: {
      name: raw.name,
      slug: raw.slug,
      isVerified: raw.isVerified,
      city: raw.city,
    },
  }));

  const upcoming = eventSummaries
    .filter((e) => e.startsAt > now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const placesWithVotes = places.map((p) => {
    const voteCounts = new Map<string, number>();
    for (const v of p.votes) voteCounts.set(v.emoji, (voteCounts.get(v.emoji) ?? 0) + 1);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      addedByName: p.addedBy.name,
      votes: Array.from(voteCounts.entries()).map(([emoji, count]) => ({ emoji, count })),
      userVote: p.votes.find((v) => v.userId === userId)?.emoji ?? null,
    };
  });

  const reviewsWithAuthor = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    authorName: r.user.name,
    createdAt: r.createdAt,
  }));

  const messages: ChatMessage[] = chat.map((m) => ({
    id: m.id,
    authorName: m.author.name,
    isOwn: m.author.id === userId,
    isAdmin: m.author.memberships.some((mem) => mem.role === "admin"),
    content: m.content,
    timeLabel: formatChatTime(m.createdAt),
  }));

  return {
    ...summary,
    ownerName: raw.owner?.name ?? null,
    joinLink: raw.joinLink ?? null,
    website: raw.website ?? null,
    upcomingEvents: upcoming,
    places: placesWithVotes,
    reviews: reviewsWithAuthor,
    messages,
  };
}

export async function getEvents(
  filters: { q?: string; community?: string; limit?: number; past?: boolean } = {},
): Promise<EventSummary[]> {
  const now = new Date();
  const where: Prisma.EventWhereInput = {};
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q } },
      { venueName: { contains: filters.q } },
    ];
  }
  if (filters.community) {
    where.community = { slug: filters.community };
  }
  if (!filters.past) {
    where.startsAt = { gte: now };
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      community: { select: { name: true, slug: true, isVerified: true, city: true } },
      _count: {
        select: {
          registrations: { where: { status: { in: ["registered", "attended"] } } },
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  const list: EventSummary[] = events.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    description: e.description,
    venueName: e.venueName,
    city: e.community.city,
    lat: e.lat ?? null,
    lng: e.lng ?? null,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    capacity: e.capacity ?? null,
    registeredCount: e._count.registrations,
    community: {
      name: e.community.name,
      slug: e.community.slug,
      isVerified: e.community.isVerified,
      city: e.community.city,
    },
  }));

  return filters.limit ? list.slice(0, filters.limit) : list;
}

export async function getEventBySlug(
  viewer: SafeUser | null,
  slug: string,
): Promise<EventDetail> {
  const event = await prisma.event.findUniqueOrThrow({
    where: { slug },
    include: {
      community: { select: { name: true, slug: true, isVerified: true, city: true } },
      registrations: { select: { userId: true, status: true } },
    },
  });

  const registeredCount = event.registrations.filter((r) =>
    ["registered", "attended"].includes(r.status),
  ).length;

  const viewerReg = viewer
    ? event.registrations.find((r) => r.userId === viewer.id)
    : null;

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    venueName: event.venueName,
    city: event.community.city,
    lat: event.lat ?? null,
    lng: event.lng ?? null,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    capacity: event.capacity ?? null,
    registeredCount,
    community: {
      name: event.community.name,
      slug: event.community.slug,
      isVerified: event.community.isVerified,
      city: event.community.city,
    },
    isRegistered: viewerReg?.status === "registered" || viewerReg?.status === "attended",
    isWaitlisted: viewerReg?.status === "waitlist",
    remaining:
      event.capacity != null
        ? Math.max(0, event.capacity - registeredCount)
        : null,
    isPast: event.startsAt.getTime() <= Date.now(),
  };
}

export async function getMyCommunities(userId: string): Promise<
  (CommunitySummary & { role: string })[]
> {
  const memberships = await prisma.membership.findMany({
    where: { userId, status: "active" },
    include: { community: { include: communityInclude } },
    orderBy: { joinedAt: "desc" },
  });

  const [ratings, viewerInfo, health, mutual, pendingVerify] = await Promise.all([
    ratingAggregate(),
    resolveViewer(userId),
    healthAggregate(),
    mutualMap(userId),
    pendingVerificationSet(),
  ]);

  return memberships.map((m) => ({
    ...toSummary(
      m.community,
      viewerInfo,
      ratings.get(m.community.id),
      health.get(m.community.id),
      mutual.get(m.community.id) ?? 0,
      pendingVerify.has(m.community.id),
    ),
    role: m.role,
  }));
}

export async function getMembershipRole(
  userId: string,
  communityId: string,
): Promise<string | null> {
  const m = await prisma.membership.findUnique({
    where: { userId_communityId: { userId, communityId } },
    select: { role: true, status: true },
  });
  if (!m || m.status !== "active") return null;
  return m.role;
}

export async function getMyUpcomingEvents(userId: string): Promise<EventSummary[]> {
  const now = new Date();
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      userId,
      status: { in: ["registered", "waitlist", "attended"] },
      event: { startsAt: { gte: now } },
    },
    include: {
      event: {
        include: {
          community: { select: { name: true, slug: true, isVerified: true, city: true } },
          _count: {
            select: {
              registrations: { where: { status: { in: ["registered", "attended"] } } },
            },
          },
        },
      },
    },
    orderBy: { event: { startsAt: "asc" } },
  });

  return registrations.map((r) => {
    const e = r.event;
    return {
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description,
      venueName: e.venueName,
      city: e.community.city,
      lat: e.lat ?? null,
      lng: e.lng ?? null,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      capacity: e.capacity ?? null,
      registeredCount: e._count.registrations,
      community: {
        name: e.community.name,
        slug: e.community.slug,
        isVerified: e.community.isVerified,
        city: e.community.city,
      },
    };
  });
}