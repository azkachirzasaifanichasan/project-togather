// Canonical schedule slots. Communities declare which slots they meet in;
// users declare when they are free. Matching compares these two sets.
export interface ScheduleSlot {
  slug: string;
  label: string;
  short: string;
}

export const SCHEDULE_SLOTS: ScheduleSlot[] = [
  { slug: "weekday-morning", label: "Pagi (hari kerja)", short: "pagi" },
  { slug: "weekday-evening", label: "Malam (hari kerja)", short: "malam" },
  { slug: "weekend-morning", label: "Pagi (akhir pekan)", short: "akhir pekan pagi" },
  { slug: "weekend-afternoon", label: "Siang (akhir pekan)", short: "akhir pekan siang" },
  { slug: "weekend-evening", label: "Malam (akhir pekan)", short: "akhir pekan malam" },
];

const SLOT_BY_SLUG = new Map(SCHEDULE_SLOTS.map((s) => [s.slug, s]));

export function slotLabel(slug: string): string {
  return SLOT_BY_SLUG.get(slug)?.label ?? slug;
}

export function slotShort(slug: string): string {
  return SLOT_BY_SLUG.get(slug)?.short ?? slug;
}

const WEEKEND = new Set(["weekend-morning", "weekend-afternoon", "weekend-evening"]);

export function isWeekendSlot(slug: string): boolean {
  return WEEKEND.has(slug);
}

export function parseSlots(csv: string): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}