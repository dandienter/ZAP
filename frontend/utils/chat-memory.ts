/**
 * Memory chat ZAP (sisi klien).
 *
 * Menyimpan riwayat percakapan di localStorage agar sesi tidak hilang
 * saat halaman dimuat ulang, dan menyediakan jendela konteks (windowing)
 * untuk riwayat yang dikirim ke model agar tetap ringkas.
 *
 * Data yang disimpan di sini adalah salinan kerja di perangkat pengguna.
 * Penyimpanan otoritatif yang terenkripsi ada di backend platform
 * (lihat docs/BACKEND_SYSTEM.md).
 */

export interface StoredConversation<M, C> {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: M[];
  activeProblemFirstStep: string | null;
  activeProblemContext: C | null;
  targetVar: string;
}

const STORAGE_KEY = "zap_conversations_v1";
const MAX_CONVERSATIONS = 30;
const MAX_MESSAGES_PER_CONVERSATION = 200;

interface MessageLike {
  sender: "user" | "assistant";
  rawText?: string;
  steps?: string[];
  replyText?: string;
}

export function deriveTitle<M extends MessageLike>(messages: M[]): string {
  const firstUser = messages.find((m) => m.sender === "user");
  if (!firstUser) return "Percakapan baru";
  const raw =
    firstUser.rawText ||
    (firstUser.steps ? firstUser.steps.join("  ") : "") ||
    "Percakapan";
  const clean = raw.replace(/\s+/g, " ").trim();
  return clean.length > 42 ? clean.slice(0, 42) + "…" : clean;
}

export function loadConversations<M, C>(): StoredConversation<M, C>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c) => c && typeof c.id === "string" && Array.isArray(c.messages)
    ) as StoredConversation<M, C>[];
  } catch {
    return [];
  }
}

export function saveConversations<M, C>(list: StoredConversation<M, C>[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = [...list]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CONVERSATIONS)
      .map((c) => ({
        ...c,
        messages: c.messages.slice(-MAX_MESSAGES_PER_CONVERSATION),
      }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Kuota penuh atau mode privat: memory sesi tetap berjalan di state.
  }
}

export function upsertConversation<M, C>(
  list: StoredConversation<M, C>[],
  entry: StoredConversation<M, C>
): StoredConversation<M, C>[] {
  const next = list.filter((c) => c.id !== entry.id);
  next.push(entry);
  return next.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function removeConversation<M, C>(
  list: StoredConversation<M, C>[],
  id: string
): StoredConversation<M, C>[] {
  return list.filter((c) => c.id !== id);
}

/**
 * Jendela konteks: ambil N pesan terakhir dan ubah ke format riwayat
 * {role, content} untuk dikirim ke model.
 */
export function windowHistory<M extends MessageLike>(
  messages: M[],
  maxMessages = 20
): { role: "user" | "assistant"; content: string }[] {
  return messages.slice(-maxMessages).map((m) => ({
    role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
    content:
      m.rawText ||
      (m.steps ? m.steps.join("\n") : "") ||
      m.replyText ||
      "",
  }));
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const menit = Math.floor(diff / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} mnt`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari`;
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}
