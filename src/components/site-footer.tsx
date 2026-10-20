import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div className="max-w-sm">
            <p className="font-display text-lg font-semibold">Togather</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Temukan lingkarmu, mulai dari sekitarmu. Platform penemuan komunitas berbasis
              lokasi yang menghubungkan kamu dengan komunitas aktif dan kegiatan nyata.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-semibold">Jelajahi</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link className="hover:text-ink" href="/jelajah">Peta komunitas</Link></li>
                <li><Link className="hover:text-ink" href="/komunitas">Daftar komunitas</Link></li>
                <li><Link className="hover:text-ink" href="/event">Event terdekat</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Akun</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link className="hover:text-ink" href="/masuk">Masuk</Link></li>
                <li><Link className="hover:text-ink" href="/daftar">Daftar</Link></li>
                <li><Link className="hover:text-ink" href="/komunitasku">Komunitasku</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Togather. Data komunitas pada demo ini bersifat ilustratif.</p>
          <p>Dibangun untuk menghubungkan orang lewat komunitas lokal.</p>
        </div>
      </div>
    </footer>
  );
}