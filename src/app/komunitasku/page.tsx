import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Settings, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getMyCommunities, getMyUpcomingEvents } from "@/lib/data";
import { Badge, EmptyState, PrimaryLink } from "@/components/primitives";
import { EventCard } from "@/components/event-card";
import { formatKm } from "@/lib/geo";

export const metadata = {
  title: "Komunitasku",
  description: "Komunitas yang kamu ikuti dan agendamu.",
};

export default async function KomunitaskuPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?callback=/komunitasku");

  const [memberships, agenda] = await Promise.all([
    getMyCommunities(user.id),
    getMyUpcomingEvents(user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Komunitasku</h1>
        <p className="mt-1 text-sm text-muted">
          Komunitas yang kamu ikuti dan kegiatan yang sudah kamu daftari.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold tracking-tight">Keanggotaanmu</h2>
          </div>

          {memberships.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Kamu belum bergabung"
                description="Temukan komunitas yang cocok lalu gabung untuk mulai terhubung."
                action={<PrimaryLink href="/jelajah">Jelajah komunitas</PrimaryLink>}
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {memberships.map((m) => (
                <div key={m.id} className="rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={m.role === "admin" ? "accent" : "neutral"}>
                          {m.role === "admin" ? "Pengurus" : "Anggota"}
                        </Badge>
                        <span className="text-xs text-muted">
                          {m.isOnline ? "Online" : m.distanceKm != null ? `${formatKm(m.distanceKm)}` : m.city}
                        </span>
                      </div>
                      <Link
                        href={`/komunitas/${m.slug}`}
                        className="mt-2 block font-display text-lg font-semibold hover:text-accent-strong"
                      >
                        {m.name}
                      </Link>
                      {m.nextEvent && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                          {m.nextEvent.title}
                        </p>
                      )}
                    </div>
                    {m.role === "admin" && (
                      <Link
                        href={`/komunitas/${m.slug}/kelola`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:border-line-strong hover:text-ink"
                      >
                        <Settings className="h-4 w-4" aria-hidden="true" /> Kelola
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold tracking-tight">Agendamu</h2>
          </div>
          <div className="mt-4 space-y-3">
            {agenda.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
            {agenda.length === 0 && (
              <p className="rounded-xl border border-dashed border-line-strong bg-surface px-5 py-6 text-sm text-muted">
                Belum ada event yang kamu daftari. Jelajahi event untuk mulai.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}