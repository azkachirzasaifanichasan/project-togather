import Link from "next/link";
import { MapPin, Users, CalendarClock, Wifi } from "lucide-react";
import type { CommunitySummary } from "@/lib/types";
import { Badge, VerifiedBadge } from "@/components/primitives";
import { MatchReasons, isPersonalized } from "@/components/match-reasons";
import { relativeDay } from "@/lib/format";

export function CommunityCard({ community }: { community: CommunitySummary }) {
  const u = community;
  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{u.categoryName}</Badge>
          <VerifiedBadge source={u.verifiedBy} />
          {u.isOnline && (
            <Badge tone="accent">
              <Wifi className="h-3 w-3" aria-hidden="true" /> Online
            </Badge>
          )}
        </div>
        {u.distanceKm != null && (
          <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {u.distanceKm < 10 ? u.distanceKm.toFixed(1).replace(".", ",") : Math.round(u.distanceKm)}{" "}
            km
          </span>
        )}
      </div>

      <Link href={`/komunitas/${u.slug}`} className="mt-3 focus:outline-none">
        <span className="absolute inset-0 rounded-2xl" aria-hidden="true" />
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight group-hover:text-accent-strong">
          {u.name}
        </h3>
      </Link>

      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{u.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
        {u.interestNames.length > 0 && (
          <span className="truncate">{u.interestNames.slice(0, 3).join(" · ")}</span>
        )}
        <span className="inline-flex items-center gap-1">
          <Users className="h-4 w-4" aria-hidden="true" />
          {u.memberCount.toLocaleString("id-ID")} anggota
        </span>
      </div>

      {u.nextEvent && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-soft">
          <CalendarClock className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className="line-clamp-1">
            {relativeDay(u.nextEvent.startsAt)} — {u.nextEvent.title}
          </span>
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5">
        <span className="text-sm text-muted">
          <MatchReasons reasons={u.matchReasons} />
        </span>
        {u.matchScore != null && isPersonalized(u.matchReasons) && (
          <span className="shrink-0 rounded-md bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-strong">
            {u.matchScore}% cocok
          </span>
        )}
      </div>
    </article>
  );
}