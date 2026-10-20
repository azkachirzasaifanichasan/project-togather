"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(60, "Nama terlalu panjang."),
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export interface AuthState {
  error?: string;
}

function safeCallback(raw: FormDataEntryValue | null): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/";
}

export async function loginAction(
  prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email atau kata sandi salah." };
  }

  await setSessionCookie(user.id);
  redirect(safeCallback(formData.get("callback")));
}

export async function registerAction(
  prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email ini sudah terdaftar. Silakan masuk." };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      city: "Yogyakarta",
    },
  });

  await setSessionCookie(user.id);
  redirect("/profil?baru=1");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}