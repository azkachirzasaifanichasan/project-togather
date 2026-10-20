import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reviewVerificationAction } from "@/app/actions/app";
import { formatShortDate } from "@/lib/format";
import { EmptyState } from "@/components/primitives";

export const metadata = { title: "Verifikasi komunitas" };

export default async function VerifikasiPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?callback=/verifikasi");

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (record?.role !== "superadmin") redirect("/");

  const requests = await prisma.verificationRequest.findMany({
    where: { status: "pending" },
    include: {
      community: { select: { id: true, name: true, slug: true, city: true } },
      requestedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Tinjau verifikasi</h1>
      <p className="mt-1 text-sm text-muted">
        Tinjau pengajuan verifikasi komunitas sebelum lencana diberikan.
      </p>

      <div className="mt-6 space-y-4">
        {requests.length === 0 && (
          <EmptyState
            title="Tidak ada pengajuan"
            description="Semua pengajuan verifikasi sudah ditinjau."
          />
        )}
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/komunitas/${r.community.slug}`} className="font-semibold hover:text-accent-strong">
                  {r.community.name}
                </Link>
                <p className="text-xs text-muted">
                  {r.community.city} · diajukan {r.requestedBy.name} · {formatShortDate(r.createdAt)}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{r.message}</p>
                {r.link && (
                  <a href={r.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium text-accent-strong hover:underline">
                    {r.link}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={reviewVerificationAction.bind(null, r.id, "approve")}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg bg-success px-3 py-2 text-sm font-semibold text-white hover:bg-success/90"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" /> Setujui
                  </button>
                </form>
                <form action={reviewVerificationAction.bind(null, r.id, "reject")}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:border-line-strong"
                  >
                    <X className="h-4 w-4" aria-hidden="true" /> Tolak
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}