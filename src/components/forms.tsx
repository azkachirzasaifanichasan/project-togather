"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  loginAction,
  registerAction,
  type AuthState,
} from "@/app/actions/auth";
import {
  addPlaceAction,
  createCommunityAction,
  createEventAction,
  profileAction,
  requestVerificationAction,
  reviewAction,
  updateCommunityAction,
} from "@/app/actions/app";
import type { ScheduleSlot } from "@/lib/slots";
import { cn } from "@/lib/cn";

const inputCls =
  "h-11 w-full rounded-lg border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none";
const labelCls = "text-sm font-medium text-ink-soft";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Auth forms
// ---------------------------------------------------------------------------
export function LoginForm({ callback }: { callback: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callback" value={callback} />
      <Field label="Email">
        <input type="email" name="email" required autoComplete="email" className={inputCls} placeholder="nama@email.com" />
      </Field>
      <Field label="Kata sandi">
        <input type="password" name="password" required autoComplete="current-password" className={inputCls} placeholder="••••••••" />
      </Field>
      {state.error && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-strong" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-between gap-4 pt-1">
        <SubmitButton pending={pending}>{pending ? "Memproses…" : "Masuk"}</SubmitButton>
        <a href="/daftar" className="text-sm font-medium text-accent-strong hover:underline">
          Belum punya akun?
        </a>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Nama lengkap">
        <input type="text" name="name" required autoComplete="name" className={inputCls} placeholder="Nama kamu" />
      </Field>
      <Field label="Email">
        <input type="email" name="email" required autoComplete="email" className={inputCls} placeholder="nama@email.com" />
      </Field>
      <Field label="Kata sandi" hint="Minimal 8 karakter.">
        <input type="password" name="password" required minLength={8} autoComplete="new-password" className={inputCls} placeholder="••••••••" />
      </Field>
      {state.error && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-strong" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-between gap-4 pt-1">
        <SubmitButton pending={pending}>{pending ? "Membuat akun…" : "Daftar"}</SubmitButton>
        <a href="/masuk" className="text-sm font-medium text-accent-strong hover:underline">
          Sudah punya akun?
        </a>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Generic form state + adapters
// ---------------------------------------------------------------------------
interface FormState {
  ok?: boolean;
  error?: string;
  slug?: string;
}

function adapt(fn: (fd: FormData) => Promise<{ ok: boolean; error?: string; data?: { slug?: string } }>) {
  return async (_prev: FormState, fd: FormData): Promise<FormState> => {
    const res = await fn(fd);
    if (res.ok) return { ok: true, slug: res.data?.slug };
    return { error: res.error ?? "Terjadi kesalahan." };
  };
}

// ---------------------------------------------------------------------------
// Place form
// ---------------------------------------------------------------------------
export function PlaceForm({ communityId, communitySlug }: { communityId: string; communitySlug: string }) {
  const router = useRouter();
  const action = adapt(addPlaceAction);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  if (state.ok) {
    return (
      <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
        Tempat berhasil ditambahkan.{" "}
        <button type="button" onClick={() => router.refresh()} className="font-medium underline">
          Muat ulang
        </button>
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="communityId" value={communityId} />
      <input type="hidden" name="communitySlug" value={communitySlug} />
      <Field label="Nama tempat">
        <input type="text" name="name" required className={inputCls} placeholder="mis. Kafe tempat nongkrong" />
      </Field>
      <Field label="Kategori">
        <input type="text" name="category" className={inputCls} placeholder="mis. Titik kumpul, Rute, Tempat favorit" />
      </Field>
      <Field label="Catatan">
        <textarea name="description" rows={2} className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" placeholder="Kenapa tempat ini cocok untuk komunitas? (opsional)" />
      </Field>
      {state.error && <p className="text-sm text-accent-strong" role="alert">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? "Menambahkan…" : "Tambahkan tempat"}</SubmitButton>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Review form
// ---------------------------------------------------------------------------
export function ReviewForm({ communityId, communitySlug }: { communityId: string; communitySlug: string }) {
  const action = adapt(reviewAction);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  if (state.ok) {
    return <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">Terima kasih, ulasanmu tersimpan.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="communityId" value={communityId} />
      <input type="hidden" name="communitySlug" value={communitySlug} />
      <Field label="Rating">
        <select name="rating" required defaultValue="5" className={inputCls}>
          <option value="5">5 — Sangat baik</option>
          <option value="4">4 — Baik</option>
          <option value="3">3 — Cukup</option>
          <option value="2">2 — Kurang</option>
          <option value="1">1 — Buruk</option>
        </select>
      </Field>
      <Field label="Ulasan">
        <textarea name="comment" rows={3} className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" placeholder="Ceritakan pengalamanmu di komunitas ini…" />
      </Field>
      {state.error && <p className="text-sm text-accent-strong" role="alert">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? "Mengirim…" : "Kirim ulasan"}</SubmitButton>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Profile form
// ---------------------------------------------------------------------------
export interface InterestOption {
  id: string;
  name: string;
  categoryName: string;
}

export function ProfileForm({
  initial,
  interests,
  slots,
}: {
  initial: {
    name: string;
    city: string;
    bio: string;
    interestIds: string[];
    slotSlugs: string[];
  };
  interests: InterestOption[];
  slots: ScheduleSlot[];
}) {
  const router = useRouter();
  const action = adapt(profileAction);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [picked, setPicked] = useState<string[]>(initial.interestIds);

  const groupByCategory = interests.reduce<Record<string, InterestOption[]>>((acc, i) => {
    (acc[i.categoryName] ??= []).push(i);
    return acc;
  }, {});

  if (state.ok) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-sm text-success">Profil tersimpan. Rekomendasi kini disesuaikan dengan minatmu.</p>
        <button type="button" onClick={() => router.replace("/")} className="mt-3 text-sm font-semibold text-accent-strong hover:underline">
          Lanjut ke beranda →
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama">
          <input type="text" name="name" defaultValue={initial.name} required className={inputCls} />
        </Field>
        <Field label="Kota">
          <input type="text" name="city" defaultValue={initial.city} required className={inputCls} />
        </Field>
      </div>
      <Field label="Tentang kamu">
        <textarea name="bio" rows={2} defaultValue={initial.bio} className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted focus:border-ink focus:outline-none" placeholder="Singkat saja: apa yang sedang kamu cari?" />
      </Field>

      <div>
        <p className="text-sm font-medium text-ink-soft">Minat kamu</p>
        <p className="mt-1 text-xs text-muted">Pilih semua yang relevan — ini dasar rekomendasi komunitas.</p>
        <div className="mt-3 space-y-3">
          {Object.entries(groupByCategory).map(([cat, list]) => (
            <fieldset key={cat}>
              <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{cat}</legend>
              <div className="flex flex-wrap gap-2">
                {list.map((i) => {
                  const checked = picked.includes(i.id);
                  return (
                    <label
                      key={i.id}
                      className={cn(
                        "inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        checked ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-soft hover:border-line-strong",
                      )}
                    >
                      <input
                        type="checkbox"
                        name="interest"
                        value={i.id}
                        className="sr-only"
                        checked={checked}
                        onChange={(e) =>
                          setPicked((prev) =>
                            e.target.checked ? [...prev, i.id] : prev.filter((x) => x !== i.id),
                          )
                        }
                      />
                      {i.name}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-ink-soft">Waktu luang kamu</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {slots.map((s) => (
            <label
              key={s.slug}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-soft has-checked:border-ink has-checked:bg-ink has-checked:text-paper"
            >
              <input type="checkbox" name="slot" value={s.slug} defaultChecked={initial.slotSlugs.includes(s.slug)} className="sr-only" />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {state.error && <p className="text-sm text-accent-strong" role="alert">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? "Menyimpan…" : "Simpan profil"}</SubmitButton>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Community create / edit + event forms
// ---------------------------------------------------------------------------
export function CommunityForm({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const router = useRouter();
  const action = adapt(createCommunityAction);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  if (state.ok && state.slug) {
    router.replace(`/komunitas/${state.slug}`);
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nama komunitas">
        <input type="text" name="name" required className={inputCls} placeholder="mis. Komunitas Lari Kota" />
      </Field>
      <Field label="Kategori">
        <select name="categoryId" required defaultValue={categories[0]?.id} className={inputCls}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Deskripsi" hint="Jelaskan kegiatan, siapa yang cocok bergabung, dan suasana komunitas. Minimal 20 karakter.">
        <textarea name="description" rows={4} required className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted focus:border-ink focus:outline-none" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kota">
          <input type="text" name="city" required defaultValue="Yogyakarta" className={inputCls} />
        </Field>
        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-3 text-sm font-medium text-ink-soft">
            <input type="checkbox" name="isOnline" value="1" className="h-4 w-4 rounded border-line" /> Komunitas online (tanpa lokasi)
          </label>
        </div>
      </div>
      <Field label="Jadwal rutin" hint="Pisahkan dengan koma, mis. weekend-morning,weekday-evening.">
        <input type="text" name="scheduleSlots" className={inputCls} placeholder="weekend-morning" />
      </Field>
      <Field label="Tautan gabung (WA / Instagram)">
        <input type="url" name="joinLink" className={inputCls} placeholder="https://instagram.com/namakomunitas" />
      </Field>
      <Field label="Situs web">
        <input type="url" name="website" className={inputCls} placeholder="https://… (opsional)" />
      </Field>
      {state.error && <p className="text-sm text-accent-strong" role="alert">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? "Membuat…" : "Daftarkan komunitas"}</SubmitButton>
    </form>
  );
}

export function CommunityEditForm({
  communityId,
  initial,
  categories,
}: {
  communityId: string;
  initial: {
    name: string;
    description: string;
    categoryId: string;
    city: string;
    isOnline: boolean;
    scheduleSlots: string;
    joinLink: string;
    website: string;
  };
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const action = async (_prev: FormState, fd: FormData): Promise<FormState> => {
    const res = await updateCommunityAction(communityId, fd);
    if (res.ok) return { ok: true };
    return { error: res.error };
  };
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  if (state.ok) {
    return (
      <div className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
        Perubahan tersimpan.{" "}
        <button type="button" onClick={() => router.refresh()} className="font-medium underline">
          Muat ulang
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nama komunitas">
        <input type="text" name="name" defaultValue={initial.name} required className={inputCls} />
      </Field>
      <Field label="Kategori">
        <select name="categoryId" defaultValue={initial.categoryId} className={inputCls}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Deskripsi">
        <textarea name="description" rows={4} defaultValue={initial.description} required className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted focus:border-ink focus:outline-none" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kota">
          <input type="text" name="city" defaultValue={initial.city} required className={inputCls} />
        </Field>
        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-3 text-sm font-medium text-ink-soft">
            <input type="checkbox" name="isOnline" value="1" defaultChecked={initial.isOnline} className="h-4 w-4 rounded border-line" /> Komunitas online
          </label>
        </div>
      </div>
      <Field label="Jadwal rutin" hint="Slug dipisah koma: weekend-morning,weekday-evening.">
        <input type="text" name="scheduleSlots" defaultValue={initial.scheduleSlots} className={inputCls} />
      </Field>
      <Field label="Tautan gabung (WA / Instagram)">
        <input type="url" name="joinLink" defaultValue={initial.joinLink} className={inputCls} />
      </Field>
      <Field label="Situs web">
        <input type="url" name="website" defaultValue={initial.website} className={inputCls} />
      </Field>
      {state.error && <p className="text-sm text-accent-strong" role="alert">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? "Menyimpan…" : "Simpan perubahan"}</SubmitButton>
    </form>
  );
}

export function VerificationForm({ communityId }: { communityId: string }) {
  const action = async (_prev: FormState, fd: FormData): Promise<FormState> => {
    const res = await requestVerificationAction(communityId, fd);
    if (res.ok) return { ok: true };
    return { error: res.error };
  };
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  if (state.ok) {
    return (
      <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
        Pengajuan verifikasi terkirim. Tim kami akan meninjau dan menghubungi kamu.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Ceritakan tentang komunitasmu" hint="Siapa yang mengelola, sejak kapan aktif, dan kegiatan rutin apa yang diadakan.">
        <textarea name="message" rows={3} required minLength={20} className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted focus:border-ink focus:outline-none" placeholder="Komunitas kami berdiri sejak…" />
      </Field>
      <Field label="Tautan bukti (Instagram / WhatsApp / situs)">
        <input type="url" name="link" className={inputCls} placeholder="https://… (opsional)" />
      </Field>
      {state.error && <p className="text-sm text-accent-strong" role="alert">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? "Mengirim…" : "Ajukan verifikasi"}</SubmitButton>
    </form>
  );
}

export function EventForm({ communityId, communityCity }: { communityId: string; communityCity: string }) {
  const action = async (_prev: FormState, fd: FormData): Promise<FormState> => {
    const res = await createEventAction(communityId, fd);
    if (res.ok) return { ok: true };
    return { error: res.error };
  };
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  if (state.ok) {
    return (
      <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">Event berhasil dibuat.</p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Judul event">
        <input type="text" name="title" required className={inputCls} placeholder="mis. Lari Pagi Bersama" />
      </Field>
      <Field label="Deskripsi">
        <textarea name="description" rows={3} required className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted focus:border-ink focus:outline-none" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Lokasi / tempat">
          <input type="text" name="venueName" required className={inputCls} placeholder="mis. Alun-Alun Utara" />
        </Field>
        <Field label={`Kota (${communityCity})`}>
          <input type="text" value={communityCity} readOnly className={cn(inputCls, "opacity-70")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Mulai">
          <input type="datetime-local" name="startsAt" required className={inputCls} />
        </Field>
        <Field label="Selesai">
          <input type="datetime-local" name="endsAt" required className={inputCls} />
        </Field>
        <Field label="Kapasitas" hint="Kosongkan jika tanpa batas.">
          <input type="number" name="capacity" min={1} className={inputCls} placeholder="mis. 20" />
        </Field>
      </div>
      {state.error && <p className="text-sm text-accent-strong" role="alert">{state.error}</p>}
      <SubmitButton pending={pending}>{pending ? "Membuat…" : "Buat event"}</SubmitButton>
    </form>
  );
}