import { getCurrentUser } from "@/lib/auth";
import { getCategories, getCommunities, type CommunitySort } from "@/lib/data";
import { DEFAULT_LOCATION, type Coord } from "@/lib/geo";
import { DiscoverFilters } from "@/components/discover-filters";
import { DiscoveryWorkspace } from "@/components/discovery-workspace";
import { CategoryChips } from "@/components/category-chips";

export const metadata = {
  title: "Jelajah",
  description: "Jelajahi peta komunitas dan kegiatan yang terbukti aktif di sekitarmu.",
};

export default async function JelajahPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const sort = (typeof sp.sort === "string" ? sp.sort : "relevance") as CommunitySort;
  const online = sp.online === "1";
  const verified = sp.verified === "1";
  const radiusRaw = typeof sp.radius === "string" ? sp.radius : "";
  const radiusKm = ["2", "5", "10", "20"].includes(radiusRaw) ? Number(radiusRaw) : undefined;

  const user = await getCurrentUser();
  const [communities, categories] = await Promise.all([
    getCommunities(user, {
      q: q || undefined,
      category,
      sort,
      online,
      verified,
      radiusKm,
    }),
    getCategories(),
  ]);

  const center: Coord =
    user?.lat != null && user?.lng != null
      ? { lat: user.lat, lng: user.lng }
      : DEFAULT_LOCATION;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Jelajah komunitas</h1>
        <p className="mt-1 text-sm text-muted">
          Temukan komunitas di peta, lalu lihat alasannya cocok untukmu.
        </p>
      </div>

      <DiscoverFilters initial={{ q, sort, online, verified, radius: radiusRaw }} />

      <div className="mt-5">
        <CategoryChips categories={categories} active={category} basePath="/jelajah" />
      </div>

      <div className="mt-6">
        <DiscoveryWorkspace communities={communities} center={center} />
      </div>
    </div>
  );
}