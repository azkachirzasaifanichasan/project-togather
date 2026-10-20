import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getMembershipRole } from "@/lib/data";
import { formatShortDate, formatTime } from "@/lib/format";
import {
  confirmAttendanceAction,
  removeMemberAction,
  setRoleAction,
} from "@/app/actions/app";
import { Badge, InlineNotice, VerifiedBadge } from "@/components/primitives";
import { CommunityEditForm, EventForm, VerificationForm } from "@/components/forms";

export const metadata = { title: "Kelola komunitas" };

const STATUS_LABEL: Record<string, string> = {
  registered: "Terdaftar",
  waitlist: "Daftar tunggu",
  attended: "Hadir",
  cancelled: "Batal",
};

function addPastFlag<T extends { startsAt: Date }>(items: T[]): Array<T & { isPast: boolean }> {
  const now = Date.now();
  return items.map((e) => ({ ...e, isPast: e.startsAt.getTime() <= now }));
}

export default async function KelolaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/masuk?callback=/komunitas/${slug}/kelola`);

  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, id: true } },
    },
  });
  if (!community) notFound();

  const role = await getMembershipRole(user.id, community.id);
  if (role !== "admin") redirect(`/komunitas/${slug}`);

  const [members, events, categories] = await Promise.all([
    prisma.membership.findMany({
      where: { communityId: community.id, status: "active" },
      include: { user: { select: { name: true, email: true, id: true } } },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    }),
    prisma.event.findMany({
      where: { communityId: community.id },
      include: {
        registrations: { include: { user: { select: { name: true, email: true, id: true } } } },
      },
      orderBy: { startsAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const path = `/komunitas/${slug}/kelola`;
  const markedEvents = addPastFlag(events);
  const upcomingCount = markedEvents.filter((e) => !e.isPast).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href={`/komunitas/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke komunitas
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">Kelola</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{community.name}</h1>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="font-display text-2xl font-semibold">{members.length}</p>
            <p className="text-xs text-muted">Anggota</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold">{upcomingCount}</p>
            <p className="text-xs text-muted">Event mendatang</p>
          </div>
        </div>
      </div>

      {/* Verification */}
      <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-xl font-semibold tracking-tight">Status & verifikasi</h2>
        {community.isVerified ? (
          <div className="mt-3">
            <VerifiedBadge source={community.verifiedBy} />
            <p className="mt-1 text-sm text-muted">
              Komunitas kamu sudah terverifikasi dan menampilkan lencana di halaman publik.
            </p>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-muted">
              Verifikasi membantu calon anggota memercayai komunitasmu. Tim meninjau pengajuan
              sebelum lencana diberikan.
            </p>
            <div className="mt-3">
              <VerificationForm communityId={community.id} />
            </div>
          </div>
        )}
      </section>

      {/* Events */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Event & kehadiran</h2>
        </div>

        <div className="mt-4 space-y-4">
          {events.length === 0 && (
            <p className="rounded-xl border border-dashed border-line-strong bg-surface px-5 py-6 text-sm text-muted">
              Belum ada event. Buat event pertamamu di bawah.
            </p>
          )}
          {markedEvents.map((e) => {
            const attended = e.registrations.filter((r) => r.status === "attended").length;
            const booked = e.registrations.filter((r) =>
              ["registered", "attended"].includes(r.status),
            ).length;
            return (
              <div key={e.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/event/${e.slug}`} className="font-semibold hover:text-accent-strong">
                      {e.title}
                    </Link>
                    <p className="text-sm text-muted">
                      {formatShortDate(e.startsAt)} · {formatTime(e.startsAt)} WIB ·{" "}
                      {booked} terdaftar{e.capacity ? ` / ${e.capacity}` : ""} · {attended} hadir
                    </p>
                  </div>
                  {e.isPast && <Badge tone="neutral">Selesai</Badge>}
                </div>

                {e.registrations.length > 0 && (
                  <ul className="mt-4 divide-y divide-line border-t border-line">
                    {e.registrations.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{r.user.name}</p>
                          <p className="truncate text-xs text-muted">{r.user.email}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge tone={r.status === "attended" ? "success" : r.status === "cancelled" ? "neutral" : "amber"}>
                            {STATUS_LABEL[r.status] ?? r.status}
                          </Badge>
                          {(r.status === "registered" || r.status === "waitlist") && (
                            <form action={confirmAttendanceAction.bind(null, e.id, r.user.id, path)}>
                              <button type="submit" className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-line-strong hover:text-ink">
                                Tandai hadir
                              </button>
                            </form>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-semibold">Buat event baru</h3>
          <p className="mt-1 mb-4 text-sm text-muted">
            Event akan muncul di halaman komunitas dan daftar event Togather.
          </p>
          <EventForm communityId={community.id} communityCity={community.city} />
        </div>
      </section>

      {/* Members */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Anggota</h2>
        </div>

        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
          {members.map((m) => {
            const isSelf = m.user.id === user.id;
            return (
              <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {m.user.name} {isSelf && <span className="text-muted">(kamu)</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{m.user.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={m.role === "admin" ? "accent" : "neutral"}>
                    {m.role === "admin" ? "Pengurus" : "Anggota"}
                  </Badge>
                  {!isSelf && (
                    <>
                      {m.role === "admin" ? (
                        <form action={setRoleAction.bind(null, community.id, m.user.id, "member", path)}>
                          <button type="submit" className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-line-strong">
                            Jadikan anggota
                          </button>
                        </form>
                      ) : (
                        <form action={setRoleAction.bind(null, community.id, m.user.id, "admin", path)}>
                          <button type="submit" className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-line-strong">
                            Jadikan pengurus
                          </button>
                        </form>
                      )}
                      <form action={removeMemberAction.bind(null, community.id, m.user.id, path)}>
                        <button type="submit" className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-accent-strong hover:border-line-strong">
                          Keluarkan
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Profile edit */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Profil komunitas</h2>
        <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
          <InlineNotice tone="neutral">
            Perubahan di sini memperbarui informasi yang tampil di halaman publik komunitas.
          </InlineNotice>
          <div className="mt-4">
            <CommunityEditForm
              communityId={community.id}
              initial={{
                name: community.name,
                description: community.description,
                categoryId: community.categoryId,
                city: community.city,
                isOnline: community.isOnline,
                scheduleSlots: community.scheduleSlots,
                joinLink: community.joinLink ?? "",
                website: community.website ?? "",
              }}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}