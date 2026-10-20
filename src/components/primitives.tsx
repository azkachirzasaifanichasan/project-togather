import Link from "next/link";
import { BadgeCheck, CircleAlert, Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "amber";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-line/60 text-ink-soft",
    accent: "bg-accent-soft text-accent-strong",
    success: "bg-success-soft text-success",
    amber: "bg-amber-soft text-amber-deep",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function VerifiedBadge({ source }: { source: string | null }) {
  if (!source) return null;
  const label = source === "team" ? "Diverifikasi tim" : "Diverifikasi pengurus";
  return (
    <span
      title={label}
      className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success"
    >
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">Terverifikasi</span>
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function StarRating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Rating ${value.toFixed(1)} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d="M10 1.7l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.4l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.7z"
            fill={i <= Math.round(value) ? "currentColor" : "none"}
            className={i <= Math.round(value) ? "text-amber-deep" : "text-line-strong"}
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      ))}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper text-muted">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Chip({
  active,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

export function PrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink/90",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-line-strong",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function InlineNotice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "warning" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    neutral: "bg-line/50 text-ink-soft",
    warning: "bg-amber-soft text-amber-deep",
    success: "bg-success-soft text-success",
  };
  const Icon = tone === "warning" ? CircleAlert : Check;
  return (
    <div className={cn("flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm", styles[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}