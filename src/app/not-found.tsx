import Link from "next/link";
import { MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-paper text-muted">
        <MapPinOff className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 text-sm text-muted">
        Tautan mungkin salah, atau halaman sudah dipindahkan.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink/90"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}