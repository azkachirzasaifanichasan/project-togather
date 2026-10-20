import { Search } from "lucide-react";
import { getEvents } from "@/lib/data";
import { EventCard } from "@/components/event-card";
import { EmptyState } from "@/components/primitives";

export const metadata = {
  title: "Event",
  description: "Event dan kegiatan komunitas terdekat di sekitarmu.",
};

export default async function EventPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const events = await getEvents({ q: q || undefined });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Event komunitas</h1>
        <p className="mt-1 text-sm text-muted">
          Kegiatan terjadwal dari komunitas di sekitarmu. Daftar dan datanglah.
        </p>
      </div>

      <form action="/event" method="GET" className="mb-6">
        <label className="relative block">
          <span className="sr-only">Cari event</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari event, lokasi, atau komunitas…"
            className="h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-sm placeholder:text-muted focus:border-ink focus:outline-none"
          />
        </label>
      </form>

      {events.length === 0 ? (
        <EmptyState
          title="Belum ada event"
          description="Belum ada event yang cocok dengan pencarianmu. Coba kata kunci lain atau cek lagi nanti."
        />
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}