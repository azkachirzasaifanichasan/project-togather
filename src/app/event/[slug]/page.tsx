import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getEventBySlug } from "@/lib/data";
import { formatDateRange, formatShortDate } from "@/lib/format";
import { Badge, VerifiedBadge } from "@/components/primitives";
import { EventRegisterButton } from "@/components/interactions";
import { MapView } from "@/components/map/map-view";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  let event;
  try {
    event = await getEventBySlug(user, slug);
  } catch {
    notFound();
  }

  const status: "none" | "registered" | "waitlist" = event.isWaitlisted
    ? "waitlist"
    : event.isRegistered
      ? "registered"
      : "none";

  const isPast = event.isPast;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/event"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Semua event
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            {isPast && (
              <Badge tone="neutral" className="mb-3">Event telah berlalu</Badge>
            )}
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
              {event.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {formatShortDate(event.startsAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {event.venueName}
              </span>
            </div>

            <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-ink-soft">
              {event.description}
            </p>

            <div className="mt-6 rounded-xl bg-paper p-4 text-sm">
              <p className="font-medium text-ink">Waktu & tempat</p>
              <p className="mt-1 text-ink-soft">{formatDateRange(event.startsAt, event.endsAt)}</p>
              <p className="mt-1 text-ink-soft">{event.venueName}, {event.city}</p>
            </div>
          </div>

          {event.lat != null && event.lng != null && (
            <div className="mt-6 h-64 overflow-hidden rounded-2xl border border-line">
              <MapView
                markers={[
                  {
                    id: event.id,
                    lat: event.lat,
                    lng: event.lng,
                    label: event.title,
                    sublabel: event.venueName,
                    href: `/event/${event.slug}`,
                  },
                ]}
                center={{ lat: event.lat, lng: event.lng }}
                focusId={null}
              />
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <Link href={`/komunitas/${event.community.slug}`} className="group block">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold group-hover:text-accent-strong">
                  {event.community.name}
                </span>
                {event.community.isVerified && <VerifiedBadge source="team" />}
              </div>
              <p className="mt-0.5 text-xs text-muted">Diselenggarakan oleh komunitas ini</p>
            </Link>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Users className="h-4 w-4" aria-hidden="true" />
              {event.registeredCount.toLocaleString("id-ID")} terdaftar
            </div>
            {event.capacity != null && (
              <p className="mt-1 text-xs text-muted">
                Kapasitas {event.capacity.toLocaleString("id-ID")} ·{" "}
                {event.remaining != null && event.remaining === 0
                  ? "terisi penuh (daftar tunggu)"
                  : event.remaining != null
                    ? `${event.remaining.toLocaleString("id-ID")} slot tersisa`
                    : ""}
              </p>
            )}

            <div className="mt-5">
              {isPast ? (
                <p className="text-sm text-muted">Pendaftaran untuk event ini telah ditutup.</p>
              ) : (
                <EventRegisterButton
                  eventId={event.id}
                  eventSlug={event.slug}
                  initialStatus={status}
                />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}