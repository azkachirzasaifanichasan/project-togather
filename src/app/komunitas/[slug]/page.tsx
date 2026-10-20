import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityBySlug } from "@/lib/data";
import { slotLabel } from "@/lib/slots";
import { formatKm } from "@/lib/geo";
import { formatDayMonth } from "@/lib/format";
import { Badge, VerifiedBadge, StarRating, InlineNotice } from "@/components/primitives";
import { JoinButton, PlaceVoteButton } from "@/components/interactions";
import { PlaceForm, ReviewForm } from "@/components/forms";
import { EventCard } from "@/components/event-card";
import { CommunityChat } from "@/components/community-chat";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const community = await prisma.community.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!community) return {};
  return {
    title: community.name,
    description: community.description.slice(0, 160),
  };
}

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  let data;
  try {
    data = await getCommunityBySlug(user, slug);
  } catch {
    notFound();
  }
  const c = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/komunitas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Semua komunitas
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column */}
        <div className="min-w-0">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{c.categoryName}</Badge>
              <VerifiedBadge source={c.verifiedBy} />
              {c.verificationStatus === "pending" && (
                <Badge tone="amber">Menunggu verifikasi</Badge>
              )}
              {c.isOnline && <Badge tone="accent">Online</Badge>}
            </div>

            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight">
              {c.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              {c.distanceKm != null && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {formatKm(c.distanceKm)} · {c.city}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" aria-hidden="true" />
                {c.memberCount.toLocaleString("id-ID")} anggota
              </span>
              {c.mutualFriends > 0 && (
                <span className="inline-flex items-center gap-1.5 text-accent-strong">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  {c.mutualFriends} temanmu bergabung
                </span>
              )}
              {c.avgRating != null && (
                <span className="inline-flex items-center gap-1.5">
                  <StarRating value={c.avgRating} />
                  {c.avgRating.toFixed(1).replace(".", ",")}
                </span>
              )}
            </div>

            <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-ink-soft">
              {c.description}
            </p>

            {c.scheduleSlots.length > 0 && (
              <div className="mt-5 flex items-start gap-2 rounded-lg bg-paper px-4 py-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <p className="text-sm text-ink-soft">
                  <span className="font-medium text-ink">Jadwal rutin:</span>{" "}
                  {c.scheduleSlots.map(slotLabel).join(", ")}
                </p>
              </div>
            )}

            {c.interestNames.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.interestNames.map((i) => (
                  <span key={i} className="rounded-full bg-line/60 px-2.5 py-1 text-xs font-medium text-ink-soft">
                    {i}
                  </span>
                ))}
              </div>
            )}

            {c.isQuiet && (
              <div className="mt-5">
                <InlineNotice tone="warning">
                  Komunitas ini belum tercatat aktivitas baru-baru ini. Jadwal kegiatan bisa
                  mengikuti ritme yang jarang — konfirmasi langsung ke kanal resminya sebelum datang.
                </InlineNotice>
              </div>
            )}
          </div>

          {/* Upcoming events */}
          <section className="mt-8">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold tracking-tight">Event mendatang</h2>
            </div>
            {c.upcomingEvents.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface px-5 py-6 text-sm text-muted">
                Belum ada event yang dijadwalkan. Pantau halaman ini atau kanal resmi komunitas.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {c.upcomingEvents.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </section>

          {/* Chat */}
          <section className="mt-10">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-accent" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold tracking-tight">Discan anggota</h2>
            </div>
            <div className="mt-4">
              {c.isJoined ? (
                <CommunityChat
                  key={c.messages.length}
                  communityId={c.id}
                  communitySlug={c.slug}
                  isAdmin={c.isAdmin}
                  initialMessages={c.messages}
                />
              ) : (
                <InlineNotice tone="neutral">
                  Discan hanya untuk anggota. Gabung komunitas ini untuk ikut berkoordinasi.
                </InlineNotice>
              )}
            </div>
          </section>

          {/* Places */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold tracking-tight">Tempat bersama</h2>
            <p className="mt-1 text-sm text-muted">
              Titik kumpul dan tempat favorit yang dikurasi anggota.
            </p>
            <div className="mt-4 space-y-3">
              {c.places.map((p) => (
                <div key={p.id} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{p.name}</h3>
                        {p.category && <Badge tone="neutral">{p.category}</Badge>}
                      </div>
                      {p.description && (
                        <p className="mt-1 text-sm text-muted">{p.description}</p>
                      )}
                      <p className="mt-1.5 text-xs text-muted">Ditambahkan oleh {p.addedByName}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                      {p.votes.map((v) => (
                        <span key={v.emoji} className="inline-flex items-center gap-1">
                          <span aria-hidden="true">{v.emoji}</span> {v.count}
                        </span>
                      ))}
                      {p.votes.length === 0 && <span>Belum ada suara</span>}
                    </div>
                    <PlaceVoteButton
                      placeId={p.id}
                      communitySlug={c.slug}
                      userVote={p.userVote}
                    />
                  </div>
                </div>
              ))}
              {c.places.length === 0 && (
                <p className="rounded-xl border border-dashed border-line-strong bg-surface px-5 py-6 text-sm text-muted">
                  Belum ada tempat yang ditambahkan.
                </p>
              )}
            </div>

            {c.isJoined ? (
              <div className="mt-4 rounded-xl border border-line bg-surface p-5">
                <h3 className="font-semibold">Tambahkan tempat</h3>
                <p className="mt-1 mb-4 text-sm text-muted">
                  Bagikan titik kumpul atau tempat yang menurutmu berguna bagi komunitas.
                </p>
                <PlaceForm communityId={c.id} communitySlug={c.slug} />
              </div>
            ) : (
              <div className="mt-4">
                <InlineNotice tone="neutral">
                  Gabung komunitas untuk ikut menambahkan dan memberi suara pada tempat bersama.
                </InlineNotice>
              </div>
            )}
          </section>

          {/* Reviews */}
          <section className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold tracking-tight">Ulasan anggota</h2>
              {c.avgRating != null && (
                <span className="inline-flex items-center gap-2 text-sm text-muted">
                  <StarRating value={c.avgRating} />
                  {c.avgRating.toFixed(1).replace(".", ",")} ({c.ratingCount})
                </span>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {c.reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <StarRating value={r.rating} />
                    <span className="text-sm font-medium">{r.authorName}</span>
                    <span className="text-xs text-muted">· {formatDayMonth(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.comment}</p>}
                </div>
              ))}
              {c.reviews.length === 0 && (
                <p className="rounded-xl border border-dashed border-line-strong bg-surface px-5 py-6 text-sm text-muted">
                  Belum ada ulasan. Jadilah yang pertama berbagi pengalaman.
                </p>
              )}
            </div>

            {c.isJoined ? (
              <div className="mt-4 rounded-xl border border-line bg-surface p-5">
                <h3 className="font-semibold">Beri ulasan</h3>
                <p className="mt-1 mb-4 text-sm text-muted">Penilaianmu membantu orang lain.</p>
                <ReviewForm communityId={c.id} communitySlug={c.slug} />
              </div>
            ) : (
              <div className="mt-4">
                <InlineNotice tone="neutral">
                  Hanya anggota yang bisa memberi ulasan. Gabung untuk berbagi pengalaman.
                </InlineNotice>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-5">
            {c.isJoined ? (
              <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                Kamu anggota komunitas ini
              </p>
            ) : (
              <p className="mb-3 text-sm text-muted">
                Gabung untuk mengikuti event dan ikut berkontribusi.
              </p>
            )}
            <JoinButton communityId={c.id} communitySlug={c.slug} joined={c.isJoined} />

            {c.isAdmin && (
              <Link
                href={`/komunitas/${c.slug}/kelola`}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink hover:border-line-strong"
              >
                <Settings className="h-4 w-4" aria-hidden="true" /> Kelola komunitas
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="text-sm font-semibold">Informasi</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Lokasi</dt>
                <dd className="mt-0.5 text-ink-soft">
                  {c.isOnline ? "Komunitas daring" : `${c.city}${c.distanceKm != null ? ` · ${formatKm(c.distanceKm)} dari lokasimu` : ""}`}
                </dd>
              </div>
              {c.scheduleSlots.length > 0 && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Jadwal</dt>
                  <dd className="mt-0.5 text-ink-soft">{c.scheduleSlots.map(slotLabel).join(", ")}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Sumber data</dt>
                <dd className="mt-0.5 text-ink-soft">
                  {c.verifiedBy === "team" ? "Didaftarkan & diverifikasi tim" : c.isVerified ? "Didaftarkan pengurus" : "Data demo — belum diverifikasi"}
                </dd>
              </div>
            </dl>

            {(c.joinLink || c.website) && (
              <div className="mt-4 space-y-2 border-t border-line pt-4">
                {c.joinLink && (
                  <a
                    href={c.joinLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> Buka kanal komunitas
                  </a>
                )}
                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> Situs web
                  </a>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}