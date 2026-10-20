import type { Reason } from "@/lib/matching";
import { formatKm } from "@/lib/geo";
import { isWeekendSlot } from "@/lib/slots";

export function reasonSegments(reasons: Reason[]): string[] {
  const segments: string[] = [];

  const mutual = reasons.find((r) => r.kind === "mutual");
  if (mutual && mutual.kind === "mutual") {
    segments.push(`${mutual.count} temanmu bergabung`);
  }

  for (const r of reasons) {
    if (r.kind === "interest") {
      segments.push(`${r.count} minat cocok`);
    } else if (r.kind === "distance") {
      segments.push(`${formatKm(r.km)}`);
    } else if (r.kind === "schedule" && r.labels.length > 0) {
      const allWeekend = r.labels.every(isWeekendSlot);
      const allEvening = r.labels.every((l) => l.includes("evening"));
      if (allWeekend) segments.push("jadwal akhir pekan");
      else if (allEvening) segments.push("jadwal malam");
      else segments.push("jadwal cocok");
    }
  }

  if (segments.length === 0) {
    const health = reasons.find((r) => r.kind === "health");
    if (health && health.kind === "health") {
      segments.push(`komunitas ${health.label}`);
    }
  }

  return segments;
}

export function isPersonalized(reasons: Reason[]): boolean {
  return reasons.some((r) => r.kind === "interest" || r.kind === "schedule");
}

export function MatchReasons({
  reasons,
  className,
}: {
  reasons: Reason[];
  className?: string;
}) {
  const segments = reasonSegments(reasons);
  if (segments.length === 0) return null;
  return (
    <span className={className} aria-label={segments.join(", ")}>
      {segments.join(" · ")}
    </span>
  );
}