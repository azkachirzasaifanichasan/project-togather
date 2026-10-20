import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getInterestOptions } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { parseSlots, SCHEDULE_SLOTS } from "@/lib/slots";
import { ProfileForm } from "@/components/forms";

export const metadata = { title: "Profil & minat" };

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?callback=/profil");

  const sp = await searchParams;
  const isNew = sp.baru === "1";

  const [interests, userInterests] = await Promise.all([
    getInterestOptions(),
    prisma.userInterest.findMany({
      where: { userId: user.id },
      select: { interestId: true },
    }),
  ]);

  const slotSlugs = parseSlots(
    (await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { scheduleSlots: true },
    })).scheduleSlots,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Profil & minat</h1>
      <p className="mt-1 text-sm text-muted">
        {isNew
          ? "Selamat datang! Pilih minat dan waktu luangmu supaya rekomendasi komunitas lebih tepat."
          : "Perbarui minat, lokasi, dan waktu luang yang dipakai untuk rekomendasi."}
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <ProfileForm
          initial={{
            name: user.name,
            city: user.city ?? "Yogyakarta",
            bio: user.bio ?? "",
            interestIds: userInterests.map((i) => i.interestId),
            slotSlugs,
          }}
          interests={interests}
          slots={SCHEDULE_SLOTS}
        />
      </div>
    </div>
  );
}