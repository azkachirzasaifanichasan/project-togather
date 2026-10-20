"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getMembershipRole } from "@/lib/data";
import { coordForCity } from "@/lib/geo";
import { moderateMessage } from "@/lib/moderation";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

async function assertAdmin(userId: string, communityId: string) {
  const role = await getMembershipRole(userId, communityId);
  if (role !== "admin") {
    throw new Error("FORBIDDEN");
  }
}

async function requireSuperadmin() {
  const user = await requireUser();
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (record?.role !== "superadmin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Membership (join / leave)
// ---------------------------------------------------------------------------
export async function membershipAction(
  communityId: string,
  callback: string,
): Promise<ActionResult<{ joined: boolean }>> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/masuk?callback=${encodeURIComponent(callback || "/")}`);
  }

  const existing = await prisma.membership.findUnique({
    where: {
      userId_communityId: { userId: user.id, communityId },
    },
  });

  if (existing) {
    await prisma.membership.delete({ where: { id: existing.id } });
    revalidatePath(`/komunitas/${communityId}`);
    revalidatePath("/komunitasku");
    return { ok: true, data: { joined: false } };
  }

  await prisma.membership.create({
    data: { userId: user.id, communityId, role: "member", status: "active" },
  });
  revalidatePath(`/komunitas/${communityId}`);
  revalidatePath("/komunitasku");
  return { ok: true, data: { joined: true } };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export async function registerEventAction(
  eventId: string,
  eventSlug: string,
): Promise<ActionResult<{ status: "registered" | "waitlist" }>> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/masuk?callback=${encodeURIComponent(`/event/${eventSlug}`)}`);
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: { where: { status: { in: ["registered", "attended"] } } },
    },
  });
  if (!event) return { ok: false, error: "Event tidak ditemukan." };

  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });
  if (existing) {
    return { ok: false, error: "Kamu sudah terdaftar pada event ini." };
  }

  const full = event.capacity != null && event.registrations.length >= event.capacity;
  const status = full ? "waitlist" : "registered";

  await prisma.eventRegistration.create({
    data: { eventId, userId: user.id, status },
  });

  revalidatePath(`/event/${eventSlug}`);
  return { ok: true, data: { status } };
}

export async function cancelEventAction(
  eventId: string,
  eventSlug: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/masuk?callback=${encodeURIComponent(`/event/${eventSlug}`)}`);
  }

  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });
  if (existing) {
    await prisma.eventRegistration.delete({ where: { id: existing.id } });
  }
  revalidatePath(`/event/${eventSlug}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Places (collaborative lists)
// ---------------------------------------------------------------------------
export async function addPlaceAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const communityId = String(formData.get("communityId") ?? "");
  const communitySlug = String(formData.get("communitySlug") ?? "");

  const role = await getMembershipRole(user.id, communityId);
  if (!role) {
    return { ok: false, error: "Gabung komunitas ini dulu untuk menambahkan tempat." };
  }

  const schema = z.object({
    name: z.string().trim().min(2, "Nama tempat minimal 2 karakter.").max(80),
    description: z.string().trim().max(300).optional(),
    category: z.string().trim().max(40).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  });

  const latRaw = formData.get("lat");
  const lngRaw = formData.get("lng");

  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    lat: latRaw === "" || latRaw == null ? undefined : latRaw,
    lng: lngRaw === "" || lngRaw == null ? undefined : lngRaw,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  await prisma.place.create({
    data: {
      communityId,
      addedById: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
    },
  });

  revalidatePath(`/komunitas/${communitySlug}`);
  return { ok: true };
}

export async function votePlaceAction(
  placeId: string,
  emoji: string,
  communitySlug: string,
): Promise<ActionResult<{ userVote: string | null }>> {
  const user = await getCurrentUser();
  if (!user) redirect(`/masuk?callback=${encodeURIComponent(`/komunitas/${communitySlug}`)}`);

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) return { ok: false, error: "Tempat tidak ditemukan." };

  const role = await getMembershipRole(user.id, place.communityId);
  if (!role) {
    return { ok: false, error: "Gabung komunitas ini dulu untuk memberi suara." };
  }

  const existing = await prisma.placeVote.findUnique({
    where: { placeId_userId: { placeId, userId: user.id } },
  });

  if (existing) {
    if (existing.emoji === emoji) {
      await prisma.placeVote.delete({ where: { id: existing.id } });
      revalidatePath(`/komunitas/${communitySlug}`);
      return { ok: true, data: { userVote: null } };
    }
    await prisma.placeVote.update({ where: { id: existing.id }, data: { emoji } });
  } else {
    await prisma.placeVote.create({ data: { placeId, userId: user.id, emoji } });
  }

  revalidatePath(`/komunitas/${communitySlug}`);
  return { ok: true, data: { userVote: emoji } };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export async function reviewAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const communityId = String(formData.get("communityId") ?? "");
  const communitySlug = String(formData.get("communitySlug") ?? "");

  const role = await getMembershipRole(user.id, communityId);
  if (!role) {
    return { ok: false, error: "Gabung komunitas ini dulu untuk memberi ulasan." };
  }

  const schema = z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).optional(),
  });
  const parsed = schema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Pilih rating 1–5." };
  }

  const existing = await prisma.review.findUnique({
    where: { communityId_userId: { communityId, userId: user.id } },
  });
  if (existing) {
    await prisma.review.update({
      where: { id: existing.id },
      data: {
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
    });
  } else {
    await prisma.review.create({
      data: {
        communityId,
        userId: user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
    });
  }

  revalidatePath(`/komunitas/${communitySlug}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function profileAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const schema = z.object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(60),
    city: z.string().trim().min(1, "Kota wajib diisi.").max(60),
    bio: z.string().trim().max(300).optional(),
  });
  const parsed = schema.safeParse({
    name: formData.get("name"),
    city: formData.get("city"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const interestIds = formData.getAll("interest").map(String);
  const slotSlugs = formData.getAll("slot").map(String);

  const coord = coordForCity(parsed.data.city);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        city: parsed.data.city,
        bio: parsed.data.bio ?? null,
        lat: coord?.lat ?? null,
        lng: coord?.lng ?? null,
        scheduleSlots: slotSlugs.join(","),
      },
    });
    await tx.userInterest.deleteMany({ where: { userId: user.id } });
    if (interestIds.length > 0) {
      await tx.userInterest.createMany({
        data: interestIds.map((interestId) => ({ userId: user.id, interestId })),
      });
    }
  });

  revalidatePath("/profil");
  revalidatePath("/");
  revalidatePath("/jelajah");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Community management
// ---------------------------------------------------------------------------
const communitySchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter.").max(80),
  description: z.string().trim().min(20, "Deskripsi minimal 20 karakter.").max(2000),
  categoryId: z.string().min(1),
  city: z.string().trim().min(1).max(60),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  scheduleSlots: z.string().optional(),
  joinLink: z.string().trim().url("Tautan gabung harus URL valid.").or(z.literal("")).optional(),
  website: z.string().trim().url("Tautan situs harus URL valid.").or(z.literal("")).optional(),
  isOnline: z.string().optional(),
});

export async function createCommunityAction(formData: FormData): Promise<ActionResult<{ slug: string }>> {
  const user = await requireUser();

  const parsed = communitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    city: formData.get("city"),
    lat: formData.get("lat") || undefined,
    lng: formData.get("lng") || undefined,
    scheduleSlots: formData.get("scheduleSlots") || "",
    joinLink: formData.get("joinLink") || "",
    website: formData.get("website") || "",
    isOnline: formData.get("isOnline"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const d = parsed.data;
  const coord = d.isOnline ? null : coordForCity(d.city) ?? { lat: d.lat ?? 0, lng: d.lng ?? 0 };
  const slugBase = d.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

  const community = await prisma.community.create({
    data: {
      name: d.name,
      slug,
      description: d.description,
      categoryId: d.categoryId,
      city: d.city,
      lat: coord ? coord.lat : null,
      lng: coord ? coord.lng : null,
      isOnline: Boolean(d.isOnline),
      scheduleSlots: d.scheduleSlots ?? "",
      joinLink: d.joinLink || null,
      website: d.website || null,
      ownerId: user.id,
    },
  });

  await prisma.membership.create({
    data: { userId: user.id, communityId: community.id, role: "admin", status: "active" },
  });

  revalidatePath("/komunitas");
  revalidatePath("/jelajah");
  return { ok: true, data: { slug } };
}

export async function updateCommunityAction(
  communityId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  await assertAdmin(user.id, communityId);

  const parsed = communitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    city: formData.get("city"),
    lat: formData.get("lat") || undefined,
    lng: formData.get("lng") || undefined,
    scheduleSlots: formData.get("scheduleSlots") || "",
    joinLink: formData.get("joinLink") || "",
    website: formData.get("website") || "",
    isOnline: formData.get("isOnline"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const d = parsed.data;
  const coord = d.isOnline ? null : coordForCity(d.city) ?? null;

  await prisma.community.update({
    where: { id: communityId },
    data: {
      name: d.name,
      description: d.description,
      categoryId: d.categoryId,
      city: d.city,
      lat: coord?.lat ?? d.lat ?? null,
      lng: coord?.lng ?? d.lng ?? null,
      isOnline: Boolean(d.isOnline),
      scheduleSlots: d.scheduleSlots ?? "",
      joinLink: d.joinLink || null,
      website: d.website || null,
    },
  });

  revalidatePath("/komunitas");
  revalidatePath("/komunitas");
  return { ok: true };
}

const eventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  venueName: z.string().trim().min(2).max(120),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  capacity: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) > 0), "Kapasitas harus angka positif."),
});

export async function createEventAction(
  communityId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  await assertAdmin(user.id, communityId);

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    venueName: formData.get("venueName"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    capacity: formData.get("capacity") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const d = parsed.data;
  if (d.endsAt <= d.startsAt) {
    return { ok: false, error: "Waktu selesai harus setelah waktu mulai." };
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { slug: true, city: true, lat: true, lng: true },
  });
  if (!community) return { ok: false, error: "Komunitas tidak ditemukan." };

  const coord = coordForCity(community.city);
  const slug = `${d.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${Math.random().toString(36).slice(2, 6)}`;

  await prisma.event.create({
    data: {
      communityId,
      slug,
      title: d.title,
      description: d.description,
      venueName: d.venueName,
      lat: community.lat ?? coord?.lat ?? null,
      lng: community.lng ?? coord?.lng ?? null,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      capacity: d.capacity ? Number(d.capacity) : null,
    },
  });

  revalidatePath(`/komunitas/${community.slug}/kelola`);
  revalidatePath("/event");
  return { ok: true };
}

export async function confirmAttendanceAction(
  eventId: string,
  userId: string,
  path: string,
): Promise<void> {
  const me = await requireUser();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { communityId: true },
  });
  if (!event) throw new Error("Event tidak ditemukan.");
  await assertAdmin(me.id, event.communityId);

  await prisma.eventRegistration.updateMany({
    where: { eventId, userId },
    data: { status: "attended" },
  });

  revalidatePath(path);
}

export async function removeMemberAction(
  communityId: string,
  userId: string,
  path: string,
): Promise<void> {
  const me = await requireUser();
  await assertAdmin(me.id, communityId);
  if (me.id === userId) {
    throw new Error("Kamu tidak bisa menghapus dirimu sendiri.");
  }

  await prisma.membership.deleteMany({ where: { communityId, userId } });
  revalidatePath(path);
}

export async function setRoleAction(
  communityId: string,
  userId: string,
  role: "admin" | "member",
  path: string,
): Promise<void> {
  const me = await requireUser();
  await assertAdmin(me.id, communityId);

  await prisma.membership.update({
    where: { userId_communityId: { communityId, userId } },
    data: { role },
  });

  revalidatePath(path);
}

// ---------------------------------------------------------------------------
// Community chat (one channel per community, members only)
// ---------------------------------------------------------------------------
export async function sendMessageAction(
  communityId: string,
  communitySlug: string,
  content: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/masuk?callback=${encodeURIComponent(`/komunitas/${communitySlug}`)}`);
  }

  const role = await getMembershipRole(user.id, communityId);
  if (!role) {
    return { ok: false, error: "Gabung komunitas ini untuk ikut berdiskusi." };
  }

  const check = moderateMessage(content);
  if (!check.ok) {
    return { ok: false, error: check.reason };
  }

  // Simple per-user rate limit (max 10 messages / minute).
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const recentCount = await prisma.chatMessage.count({
    where: { authorId: user.id, communityId, createdAt: { gte: oneMinuteAgo } },
  });
  if (recentCount >= 10) {
    return { ok: false, error: "Kamu mengirim terlalu cepat. Coba lagi sebentar lagi." };
  }

  await prisma.chatMessage.create({
    data: { communityId, authorId: user.id, content: content.trim() },
  });

  revalidatePath(`/komunitas/${communitySlug}`);
  return { ok: true };
}

export async function deleteMessageAction(
  messageId: string,
  communitySlug: string,
): Promise<ActionResult> {
  const me = await requireUser();

  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: { communityId: true },
  });
  if (!message) return { ok: false, error: "Pesan tidak ditemukan." };
  await assertAdmin(me.id, message.communityId);

  await prisma.chatMessage.delete({ where: { id: messageId } });
  revalidatePath(`/komunitas/${communitySlug}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Verification (documents reviewed before the badge is granted)
// ---------------------------------------------------------------------------
export async function requestVerificationAction(
  communityId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  await assertAdmin(user.id, communityId);

  const message = String(formData.get("message") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();

  if (message.length < 20) {
    return { ok: false, error: "Jelaskan komunitasmu, minimal 20 karakter." };
  }

  // One active request at a time.
  const activeRequest = await prisma.verificationRequest.findFirst({
    where: { communityId, status: "pending" },
  });
  if (activeRequest) {
    return { ok: false, error: "Kamu sudah mengajukan verifikasi yang sedang ditinjau." };
  }

  await prisma.verificationRequest.create({
    data: {
      communityId,
      requestedById: user.id,
      message,
      link: link || null,
      status: "pending",
    },
  });

  revalidatePath("/komunitas");
  return { ok: true };
}

export async function reviewVerificationAction(
  requestId: string,
  decision: "approve" | "reject",
): Promise<void> {
  const me = await requireSuperadmin();

  const request = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    select: { communityId: true, status: true },
  });
  if (!request || request.status !== "pending") {
    throw new Error("Permintaan tidak ditemukan.");
  }

  const status = decision === "approve" ? "approved" : "rejected";
  await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status, reviewedById: me.id, reviewedAt: new Date() },
    }),
    ...(decision === "approve"
      ? [
          prisma.community.update({
            where: { id: request.communityId },
            data: { isVerified: true, verifiedBy: "team" },
          }),
        ]
      : []),
  ]);

  revalidatePath("/verifikasi");
}