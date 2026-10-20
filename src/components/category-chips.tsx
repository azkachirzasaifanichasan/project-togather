import Link from "next/link";
import type { CategoryInfo } from "@/lib/types";
import { cn } from "@/lib/cn";

export function CategoryChips({
  categories,
  active,
  basePath = "/komunitas",
}: {
  categories: CategoryInfo[];
  active?: string;
  basePath?: string;
}) {
  return (
    <nav aria-label="Kategori komunitas" className="flex flex-wrap gap-2">
      <Link
        href={basePath}
        className={cn(
          "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
          !active
            ? "border-ink bg-ink text-paper"
            : "border-line bg-surface text-ink-soft hover:border-line-strong",
        )}
      >
        Semua
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`${basePath}?category=${c.slug}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            active === c.slug
              ? "border-ink bg-ink text-paper"
              : "border-line bg-surface text-ink-soft hover:border-line-strong",
          )}
        >
          {c.name}
          <span className={cn("text-xs", active === c.slug ? "text-paper/70" : "text-muted")}>
            {c.count}
          </span>
        </Link>
      ))}
    </nav>
  );
}