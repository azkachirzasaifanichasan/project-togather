import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/data";
import { CommunityForm } from "@/components/forms";

export const metadata = { title: "Daftarkan komunitas" };

export default async function CommunityBaruPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?callback=/komunitas/baru");

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Daftarkan komunitas</h1>
      <p className="mt-1 text-sm text-muted">
        Buat rumah untuk komunitasmu di Togather — kelola event, anggota, dan jangkau orang baru.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <CommunityForm categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
      </div>
    </div>
  );
}