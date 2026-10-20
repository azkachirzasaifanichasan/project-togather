"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Trash2 } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { sendMessageAction, deleteMessageAction } from "@/app/actions/app";
import { cn } from "@/lib/cn";

export function CommunityChat({
  communityId,
  communitySlug,
  isAdmin,
  initialMessages,
}: {
  communityId: string;
  communitySlug: string;
  isAdmin: boolean;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const [messages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  function send() {
    if (!content.trim() || pending) return;
    start(async () => {
      const res = await sendMessageAction(communityId, communitySlug, content);
      if (res.ok) {
        setContent("");
        setError(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function remove(id: string) {
    start(async () => {
      await deleteMessageAction(id, communitySlug);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold">Discan anggota</p>
        <p className="text-xs text-muted">Kanal koordinasi internal komunitas</p>
      </div>

      <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">
            Belum ada pesan. Mulai percakapan dengan anggota lain.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.isOwn ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                m.isOwn ? "rounded-br-sm bg-ink text-paper" : "rounded-bl-sm bg-paper text-ink",
              )}
            >
              <div className="flex items-baseline gap-2">
                {!m.isOwn && <span className="text-xs font-semibold">{m.authorName}</span>}
                <span className={cn("text-[10px]", m.isOwn ? "text-paper/60" : "text-muted")}>
                  {m.timeLabel}
                </span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed">
                {m.content}
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label="Hapus pesan"
                className="ml-1.5 self-center rounded-md p-1 text-muted hover:bg-line/50 hover:text-ink"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Tulis pesan…"
            aria-label="Pesan"
            className="max-h-28 min-h-[2.5rem] flex-1 resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={pending || !content.trim()}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only">Kirim</span>
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-accent-strong" role="alert">{error}</p>}
      </div>
    </div>
  );
}