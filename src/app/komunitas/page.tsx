import { getCurrentUser } from "@/lib/auth";
import { getCategories, getCommunities, type CommunitySort } from "@/lib/data";
import { CommunityCard } from "@/components/community-card";
import { CategoryChips } from "@/components/category-chips";
import { DiscoverFilters } from "@/components/discover-filters";
import { EmptyState } from "@/components/primitives";
import { SearchX } from "lucide-react";

export const metadata = {
  title: "Komunitas",
  description: "Direktori komunitas di sekitarmu.",
};

export default async function KomunitasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const sort = (typeof sp.sort === "string" ? sp.sort : "relevance") as CommunitySort;
  const verified = sp.verified === "1";
  const radiusRaw = typeof sp.radius === "string" ? sp.radius : "";
  const radiusKm = ["2", "5", "10", "20"].includes(radiusRaw) ? Number(radiusRaw) : undefined;

  const user = await getCurrentUser();
  const [communities, categories] = await Promise.all([
    getCommunities(user, { q: q || undefined, category, sort, verified, radiusKm }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Komunitas</h1>
        <p className="mt-1 text-sm text-muted">
          {communities.length} komunitas ditemukan
          {category ? ` dalam kategori ini` : ""}.
        </p>
      </div>

      <DiscoverFilters initial={{ q, sort, online: false, verified, radius: radiusRaw }} />

      <div className="mt-5">
        <CategoryChips categories={categories} active={category} />
      </div>

      <div className="mt-6">
        {communities.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="Tidak ada komunitas yang cocok"
            description="Coba kata kunci lain atau kurangi filter pencarian."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {communities.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}