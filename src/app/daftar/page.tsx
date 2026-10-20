import Link from "next/link";
import { RegisterForm } from "@/components/forms";

export const metadata = { title: "Daftar" };

export default function DaftarPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Daftar</h1>
        <p className="mt-1 text-sm text-muted">
          Buat akun untuk menemukan komunitas yang cocok dan ikut berkumpul.
        </p>

        <div className="mt-6">
          <RegisterForm />
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-semibold text-accent-strong hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}