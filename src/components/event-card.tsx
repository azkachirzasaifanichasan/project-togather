import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import type { EventSummary } from "@/lib/types";
import { dayNumber, monthShort, formatTime, relativeDay } from "@/lib/format";

export function EventCard({ event }: { event: EventSummary }) {
  const remaining =
    event.capacity != null
      ? Math.max(0, event.capacity - event.registeredCount)
      : null;
  const full = event.capacity != null && remaining === 0;

  return (
    <article className="group relative flex gap-4 rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-soft">
      <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-paper text-center">
        <span className="font-display text-2xl font-semibold leading-none">
          {dayNumber(event.startsAt)}
        </span>
        <span className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted">
          {monthShort(event.startsAt)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="font-semibold uppercase tracking-wide text-accent-strong">
            {relativeDay(event.startsAt)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatTime(event.startsAt)} WIB</span>
        </div>

        <Link href={`/event/${event.slug}`} className="focus:outline-none">
          <span className="absolute inset-0 rounded-2xl" aria-hidden="true" />
          <h3 className="mt-1 font-display text-base font-semibold leading-snug group-hover:text-accent-strong">
            {event.title}
          </h3>
        </Link>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {event.venueName} · {event.community.name}
          </span>
        </p>

        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {event.registeredCount.toLocaleString("id-ID")} terdaftar
          </span>
          {event.capacity != null && (
            <>
              <span aria-hidden="true">·</span>
              <span className={full ? "font-medium text-accent-strong" : ""}>
                {full ? "Penuh — daftar tunggu" : `${remaining} slot tersisa`}
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}