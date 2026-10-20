# Togather

**Togather** adalah platform penemuan komunitas berbasis lokasi — *"Temukan lingkarmu,
mulai dari sekitarmu."* Ia membantu orang menemukan komunitas yang cocok dengan minat,
lokasi, dan jadwal mereka, lalu menghubungkan mereka ke komunitas dan kegiatan nyata di kotanya.

> Nama sebelumnya (LingkarKita / TitikKumpul) telah diganti menjadi **Togather**.

## Apa yang dilakukan Togather

- **Penemuan komunitas** — cari & jelajahi berdasarkan minat, kategori, jarak (radius), keaktifan, dan status verifikasi.
- **Peta komunitas** — peta interaktif (Leaflet + OpenStreetMap) yang menampilkan komunitas dan lokasi event.
- **Rekomendasi yang bisa dijelaskan** — setiap kartu menunjukkan *mengapa* komunitas cocok
  (mis. "4 minat cocok · 2,3 km · jadwal akhir pekan · 2 temanmu bergabung"). Skor dihitung dari
  data nyata (minat 0.30, jarak 0.25, jadwal 0.15, kesehatan 0.15, rating 0.10, mutual 0.05), bukan model black-box.
- **Skor kesehatan komunitas** — memprioritaskan kehadiran event, lalu aktivitas chat, lalu status online;
  komunitas yang sepi ditandai dengan peringatan yang menghormati ritme kegiatan.
- **Profil & event** — deskripsi, jadwal, event mendatang, pendaftaran (kapasitas + daftar tunggu), pencatatan kehadiran.
- **Chat internal** — satu kanal per komunitas, khusus anggota, dengan validasi & moderasi ringan (rate limit, filter spam, hapus oleh pengurus). *(real-time via Socket.IO direncanakan — saat ini berbasis request/response)*.
- **Verifikasi komunitas** — pengurus mengajukan verifikasi (dengan tautan bukti), ditinjau oleh admin platform sebelum lencana diberikan.
- **Collaborative lists** — anggota menambah tempat + catatan dan memberi suara emoji.
- **Komunitasku** — daftar komunitas yang diikuti + agenda event pribadi.
- **Dashboard pengurus** — kelola profil, event, konfirmasi kehadiran, anggota & peran, dan ajukan verifikasi.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Prisma + SQLite (dev) · Leaflet/OpenStreetMap · Zod · Vitest.

## Menjalankan secara lokal

Persyaratan: Node.js 20+.

```bash
# 1. Salin konfigurasi lingkungan (baca catatan di dalam file)
cp .env.example .env

# 2. Install dependensi (otomatis menjalankan `prisma generate`)
npm install

# 3. Siapkan basis data (generate client, push skema, seed data demo)
npm run db:setup

# 4. Jalankan server pengembangan
npm run dev
```

Buka http://localhost:3000.

### Akun demo

| Peran | Email | Kata sandi |
|---|---|---|
| Pencari (anggota + pengurus) | `demo@togather.id` | `togather123` |
| Pengurus komunitas | `owner@togather.id` | `togather123` |
| Pengurus (teknologi) | `owner2@togather.id` | `togather123` |
| Admin platform (tinjau verifikasi di `/verifikasi`) | `admin@togather.id` | `togather123` |

Data komunitas & event pada demo bersifat **ilustratif** (kota pilot: Yogyakarta) dan dirancang
agar mudah diganti dengan data nyata — lihat `prisma/seed.ts`.

## Skrip

| Perintah | Keterangan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | Cek tipe TypeScript |
| `npm test` | Unit test (Vitest) |
| `npm run db:push` | Sinkronkan skema ke database |
| `npm run db:seed` | Isi ulang data demo |
| `npm run db:setup` | generate + push + seed |

## Lingkungan & produksi

- Dev lokal memakai **SQLite** (`prisma/dev.db`) sehingga tidak memerlukan layanan eksternal.
- Untuk produksi, ubah `provider` di `prisma/schema.prisma` menjadi `"postgresql"` dan isi
  `DATABASE_URL` dengan string koneksi PostgreSQL (PostGIS direkomendasikan untuk pencarian geospasial lebih lanjut).
- `AUTH_SECRET` menandatangani cookie sesi. Buat string acak yang kuat di produksi.
- **Autentikasi saat ini:** email/kata sandi (bcrypt) dengan sesi cookie `httpOnly` yang
  ditandatangani — implementasi ringan tanpa ketergantungan eksternal. Login **Google/Discord
  (Auth.js)** dan **OAuth** belum dikonfigurasi; saat kredensial tersedia, tambahkan Auth.js
  dengan provider Google/Discord dan variabel `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

## Struktur

```
src/app/            Rute & halaman (App Router)
src/app/actions/    Server actions (mutasi, validasi Zod, otorisasi server-side)
src/components/     UI: navbar, kartu, peta (Leaflet), formulir, interaksi
src/lib/            Logika: auth, session, data access (Prisma), matching, geo
prisma/             Skema + seed data
src/lib/*.test.ts   Unit test untuk matching & geo
```

## Batasan & roadmap

Tidak termasuk dalam build ini (direncanakan kemudian): chat realtime via Socket.IO (chat kini
berbasis request/response), login OAuth Google/ Discord, berbagi lokasi langsung (live location),
feed sosial, DM pribadi, pencarian bahasa natural (LLM), kalender/tiket QR, dan notifikasi push.
Keputusan ini sengaja diambil agar fokus pada alur penemuan komunitas yang kohesif, sesuai skala MVP lomba.

Kota pilot demo: **Yogyakarta**. Data komunitas & event bersifat ilustratif dan mudah diganti —
lihat `prisma/seed.ts`.