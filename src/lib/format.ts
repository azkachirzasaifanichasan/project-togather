const TZ = "Asia/Jakarta";

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatChatTime(date: Date): string {
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return formatTime(date);
  return `${formatDayMonth(date)} · ${formatTime(date)}`;
}

export function formatDateRange(startsAt: Date, endsAt: Date): string {
  const sameDay = startsAt.toDateString() === endsAt.toDateString();
  if (sameDay) {
    return `${formatDate(startsAt)} · ${formatTime(startsAt)}–${formatTime(endsAt)} WIB`;
  }
  return `${formatShortDate(startsAt)} ${formatTime(startsAt)} – ${formatShortDate(endsAt)} ${formatTime(endsAt)} WIB`;
}

export function dayNumber(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: TZ, day: "numeric" }).format(date);
}

export function monthShort(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: TZ, month: "short" }).format(date);
}

export function relativeDay(date: Date): string {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86400000);
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  if (diffDays === -1) return "Kemarin";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} hari lagi`;
  return formatDayMonth(date);
}