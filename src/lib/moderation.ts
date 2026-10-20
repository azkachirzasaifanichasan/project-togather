// Lightweight content moderation for community chat.
// This is intentionally not the only safety layer: sendMessage also enforces
// membership authorization, length limits, and a per-user rate limit, and
// admins can delete messages. The blocked-term list is a configurable seed;
// extend it to match the platform's Code of Conduct.

const BLOCKED_TERMS: string[] = []; // e.g. "word1", "word2" — fill per policy

export const MAX_MESSAGE_LENGTH = 500;

export type ModerationResult = { ok: true } | { ok: false; reason: string };

export function moderateMessage(raw: string): ModerationResult {
  const content = raw.trim();
  if (!content) return { ok: false, reason: "Pesan tidak boleh kosong." };
  if (content.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, reason: `Pesan maksimal ${MAX_MESSAGE_LENGTH} karakter.` };
  }

  // Blocked-term filter (case-insensitive, whole-ish word match).
  const lower = content.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      return { ok: false, reason: "Pesan mengandung kata yang tidak diizinkan." };
    }
  }

  // Link-spam guard: more than a couple of URLs is almost always spam.
  const urlCount = (content.match(/https?:\/\/\S+/gi) ?? []).length;
  if (urlCount > 2) {
    return { ok: false, reason: "Terlalu banyak tautan dalam satu pesan." };
  }

  // Repeated-character spam guard.
  if (/(.)\1{15,}/.test(content)) {
    return { ok: false, reason: "Pesan mengandung pengulangan karakter berlebihan." };
  }

  return { ok: true };
}