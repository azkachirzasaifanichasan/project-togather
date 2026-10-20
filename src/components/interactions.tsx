"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LogIn, UserMinus, UserPlus } from "lucide-react";
import {
  membershipAction,
  registerEventAction,
  cancelEventAction,
  votePlaceAction,
} from "@/app/actions/app";
import { cn } from "@/lib/cn";

export function JoinButton({
  communityId,
  communitySlug,
  joined,
}: {
  communityId: string;
  communitySlug: string;
  joined: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [isJoined, setIsJoined] = useState(joined);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    start(async () => {
      const res = await membershipAction(communityId, `/komunitas/${communitySlug}`);
      if (res.ok) {
        setIsJoined(res.data?.joined ?? false);
        setError(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 sm:w-auto",
          isJoined
            ? "border border-line bg-surface text-ink hover:border-line-strong"
            : "bg-accent text-white hover:bg-accent-strong",
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : isJoined ? (
          <UserMinus className="h-4 w-4" aria-hidden="true" />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden="true" />
        )}
        {pending ? "Memproses…" : isJoined ? "Keluar dari komunitas" : "Gabung komunitas"}
      </button>
      {error && <p className="mt-1.5 text-xs text-accent-strong">{error}</p>}
    </div>
  );
}

export function EventRegisterButton({
  eventId,
  eventSlug,
  initialStatus,
}: {
  eventId: string;
  eventSlug: string;
  initialStatus: "none" | "registered" | "waitlist";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onRegister() {
    start(async () => {
      const res = await registerEventAction(eventId, eventSlug);
      if (res.ok) {
        setStatus(res.data?.status ?? "registered");
        setError(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  async function onCancel() {
    start(async () => {
      const res = await cancelEventAction(eventId, eventSlug);
      if (res.ok) {
        setStatus("none");
        setError(null);
        router.refresh();
      }
    });
  }

  if (status === "registered" || status === "waitlist") {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
              status === "waitlist" ? "bg-amber-soft text-amber-deep" : "bg-success-soft text-success",
            )}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {status === "waitlist" ? "Di daftar tunggu" : "Terdaftar"}
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="text-sm font-medium text-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-60"
          >
            {pending ? "Membatalkan…" : "Batalkan pendaftaran"}
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-accent-strong">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onRegister}
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogIn className="h-4 w-4" aria-hidden="true" />
        )}
        {pending ? "Mendaftarkan…" : "Daftar event"}
      </button>
      {error && <p className="mt-1.5 text-xs text-accent-strong">{error}</p>}
    </div>
  );
}

const VOTE_EMOJIS = ["👍", "❤️", "🔥", "📍"];

export function PlaceVoteButton({
  placeId,
  communitySlug,
  userVote,
}: {
  placeId: string;
  communitySlug: string;
  userVote: string | null;
}) {
  const router = useRouter();
  const [vote, setVote] = useState(userVote);
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClick(emoji: string) {
    setPendingEmoji(emoji);
    const res = await votePlaceAction(placeId, emoji, communitySlug);
    if (res.ok) {
      setVote(res.data?.userVote ?? null);
      setError(null);
      router.refresh();
    } else {
      setError(res.error);
    }
    setPendingEmoji(null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Beri suara pada tempat ini">
        {VOTE_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onClick(emoji)}
            aria-pressed={vote === emoji}
            disabled={pendingEmoji === emoji}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-colors disabled:opacity-50",
              vote === emoji ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-line-strong",
            )}
          >
            <span aria-hidden="true">{emoji}</span>
            <span className="sr-only">Beri suara {emoji}</span>
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-accent-strong">{error}</p>}
    </div>
  );
}