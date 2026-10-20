import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Togather — Temukan komunitas di sekitarmu",
    template: "%s · Togather",
  },
  description:
    "Togather — Temukan lingkarmu, mulai dari sekitarmu. Platform penemuan komunitas berbasis lokasi: temukan komunitas aktif, event terdekat, dan orang-orang dengan minat yang sama.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="id" className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <SiteHeader user={user} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}