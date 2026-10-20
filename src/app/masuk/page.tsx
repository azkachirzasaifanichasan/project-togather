import Link from "next/link";
import { LoginForm } from "@/components/forms";

export const metadata = { title: "Masuk" };

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const callback = typeof sp.callback === "string" ? sp.callback : "/";

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Masuk</h1>
        <p className="mt-1 text-sm text-muted">
          Lanjutkan untuk bergabung, mendaftar event, dan mengikuti komunitas.
        </p>

        <div className="mt-6">
          <LoginForm callback={callback} />
        </div>

        <p className="mt-6 rounded-lg bg-paper px-3.5 py-3 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">Akun demo:</span>{" "}
          <code className="font-mono">demo@togather.id</code> /{" "}
          <code className="font-mono">togather123</code>
        </p>

        <p className="mt-4 text-center text-sm text-muted">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-semibold text-accent-strong hover:underline">
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  );
}