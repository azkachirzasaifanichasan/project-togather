import "server-only";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  city: string | null;
  bio: string | null;
  lat: number | null;
  lng: number | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      bio: true,
      lat: true,
      lng: true,
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    city: user.city,
    bio: user.bio,
    lat: user.lat,
    lng: user.lng,
  };
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/masuk");
  }
  return user;
}

export function authRedirect(callback: string): string {
  return `/masuk?callback=${encodeURIComponent(callback)}`;
}