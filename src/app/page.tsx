import Link from "next/link";
import { ArrowRight, CalendarDays, Compass, MapPinned, Search, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCommunities, getEvents, getCategories } from "@/lib/data";
import { CommunityCard } from "@/components/community-card";
import { EventCard } from "@/components/event-card";
import { PrimaryLink, SecondaryLink } from "@/components/primitives";
import { isPersonalized } from "@/components/match-reasons";
import { CategoryChips } from "@/components/category-chips";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [communities, events, categories] = await Promise.all([
    getCommunities(user, {}),
    getEvents({ limit: 4 }),
    getCategories(),
  ]);

  const recommended = [...communities].sort(
    (a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0),
  );
  const personalized = user != null && recommended.some((c) => isPersonalized(c.matchReasons));
  const nearby = communities
    .filter((c) => !c.isOnline && c.distanceKm != null)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, 4);

  return (
    <div>
      {/* Hero / discovery intro */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-muted">
            <MapPinned className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Penemuan komunitas berbasis lokasi
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Temukan lingkarmu, <span className="text-accent">mulai dari sekitarmu</span>.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
            Togather memetakan komunitas dan kegiatan yang terbukti aktif di sekitarmu —
            berdasarkan minat, lokasi, dan jadwalmu, dengan alasan yang jelas di setiap
            rekomendasi.
          </p>

          <form action="/jelajah" method="GET" className="mt-6 flex max-w-xl gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Cari komunitas atau minat</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                name="q"
                placeholder="Coba &quot;lari&quot;, &quot;fotografi&quot;, atau &quot;merajut&quot;…"
                className="h-12 w-full rounded-lg border border-line bg-white pl-10 pr-4 text-sm placeholder:text-muted focus:border-ink focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
            >
              Jelajah
            </button>
          </form>

          <div className="mt-6">
            <CategoryChips categories={categories.slice(0, 8)} basePath="/jelajah" />
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {personalized ? "Rekomendasi untukmu" : "Komunitas aktif terdekat"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {personalized
                ? "Disusun dari minat, lokasi, dan jadwalmu."
                : "Masuk dan pilih minatmu untuk rekomendasi yang lebih personal."}
            </p>
          </div>
          <Link href="/jelajah" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent-strong hover:underline">
            Lihat semua <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.slice(0, 6).map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>
      </section>

      {/* Nearby + upcoming events */}
      <section className="border-t border-line bg-surface/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-accent" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold tracking-tight">Terdekat darimu</h2>
            </div>
            <div className="mt-5 space-y-3">
              {nearby.map((c) => (
                <CommunityCard key={c.id} community={c} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="font-display text-xl font-semibold tracking-tight">Event terdekat</h2>
              </div>
              <Link href="/event" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline">
                Semua <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works + organizer CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl border border-line bg-surface p-8 sm:p-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Bagaimana Togather bekerja</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Temukan",
                body: "Cari komunitas berdasarkan minat, kategori, dan jarak. Setiap hasil menjelaskan mengapa cocok untukmu.",
              },
              {
                icon: Users,
                title: "Gabung",
                body: "Lihat profil komunitas, jadwal rutin, dan event-nya — lalu gabung dan terhubung langsung ke kanal mereka.",
              },
              {
                icon: CalendarDays,
                title: "Berkumpul",
                body: "Daftar event terdekat, datanglah, dan menjadi bagian dari kegiatan nyata di kotamu.",
              },
            ].map((step) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-ink p-6 text-paper sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-lg font-semibold">Punya komunitas sendiri?</h3>
              <p className="mt-1 text-sm text-paper/70">
                Daftarkan komunitasmu, kelola event, dan jangkau anggota baru di sekitarmu.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <PrimaryLink href="/komunitas/baru" className="bg-accent text-white hover:bg-accent-strong">
                Daftarkan komunitas
              </PrimaryLink>
              <SecondaryLink href="/jelajah" className="bg-transparent text-paper border-paper/30 hover:border-paper/60">
                Jelajah peta
              </SecondaryLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}