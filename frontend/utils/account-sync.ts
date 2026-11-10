/**
 * ZAP Account Cloud Sync & Auto-Backup
 * Menghubungkan riwayat chat, API keys, dan konfigurasi ke Akun Google pengguna.
 */

import { type ZAPUser } from "@/components/GoogleAuthButton";
import { type StoredConversation, getUserStorageKey } from "@/utils/chat-memory";

export interface AccountConfigs {
  nvidiaApiKey?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  bazaarlinkApiKey?: string;
  mistralApiKey?: string;
  customBaseUrl?: string;
  customModelName?: string;
  customApiKey?: string;
  selectedModelId?: string;
  reasoningEffort?: string;
  theme?: string;
}

export interface UserAccountBackupPayload {
  user: ZAPUser;
  updatedAt?: number;
  configs: AccountConfigs;
  conversations: StoredConversation<unknown, unknown>[];
  workspaces?: unknown[];
  workspaceFiles?: unknown[];
}

const STORAGE_KEY_PRIMARY = "zap_conversations";
const STORAGE_KEY_LEGACY = "zap_conversations_v1";

/**
 * Membersihkan working state sesi lokal saat pengguna keluar atau berganti akun
 */
export function clearLocalWorkingSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("zap_authenticated_user");
    localStorage.removeItem(STORAGE_KEY_PRIMARY);
    localStorage.removeItem(STORAGE_KEY_LEGACY);
    localStorage.removeItem("zap_active_conversation_id");
    localStorage.removeItem("zap_last_active_user_email");
  } catch {}
}

/**
 * Mengumpulkan data lokal saat ini khusus untuk akun pengguna yang bersangkutan
 */
export function collectLocalUserData(user: ZAPUser): UserAccountBackupPayload {
  if (typeof window === "undefined" || !user) {
    return {
      user,
      configs: {},
      conversations: [],
    };
  }

  const userEmail = (user.email || user.id || "").toLowerCase().trim();
  const userKey = getUserStorageKey(userEmail);
  let convs: StoredConversation<unknown, unknown>[] = [];

  try {
    const raw = localStorage.getItem(userKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter ketat: HANYA ambil percakapan yang eksplisit milik user ini
        convs = parsed.filter(
          (c: any) => c && c.userEmail && c.userEmail.toLowerCase().trim() === userEmail
        );
      }
    }
  } catch (e) {
    console.warn("Gagal membaca conversations lokal:", e);
  }

  // 2. Kumpulkan konfigurasi & API keys
  const configs: AccountConfigs = {
    nvidiaApiKey: localStorage.getItem("zap_nvidia_api_key") || undefined,
    geminiApiKey: localStorage.getItem("zap_gemini_api_key") || undefined,
    openaiApiKey: localStorage.getItem("zap_openai_api_key") || undefined,
    claudeApiKey: localStorage.getItem("zap_claude_api_key") || undefined,
    bazaarlinkApiKey: localStorage.getItem("zap_bazaarlink_api_key") || undefined,
    mistralApiKey: localStorage.getItem("zap_mistral_api_key") || undefined,
    customBaseUrl: localStorage.getItem("zap_custom_base_url") || undefined,
    customModelName: localStorage.getItem("zap_custom_model_name") || undefined,
    customApiKey: localStorage.getItem("zap_custom_api_key") || undefined,
    selectedModelId: localStorage.getItem("zap_selected_model_id") || undefined,
    reasoningEffort: localStorage.getItem("zap_reasoning_effort") || undefined,
    theme: localStorage.getItem("zap_theme") || undefined,
  };

  // 3. Workspaces & files (Filter out any legacy "default" or "Default workspace")
  let workspaces: unknown[] = [];
  let workspaceFiles: unknown[] = [];
  try {
    const wsRaw = localStorage.getItem("zap_workspaces");
    if (wsRaw) {
      const parsed = JSON.parse(wsRaw);
      if (Array.isArray(parsed)) {
        workspaces = parsed.filter((w: any) => w && w.id !== "default" && w.name !== "Default workspace");
      }
    }
    const filesRaw = localStorage.getItem("zap_workspace_files");
    if (filesRaw) {
      const parsed = JSON.parse(filesRaw);
      if (Array.isArray(parsed)) {
        workspaceFiles = parsed.filter((f: any) => f && f.workspaceId !== "default");
      }
    }
  } catch (e) {
    console.warn("Gagal membaca workspaces lokal:", e);
  }

  return {
    user,
    updatedAt: Date.now(),
    configs,
    conversations: convs,
    workspaces,
    workspaceFiles,
  };
}

export interface SyncBackupOverrides extends Partial<UserAccountBackupPayload> {
  deletedConversationId?: string;
  replaceConversations?: boolean;
}

/**
 * Mencatat ID percakapan yang dihapus ke dalam daftar penolakan lokal (Tombstone),
 * agar tidak pernah dibangkitkan kembali (anti-resurrection) saat sinkronisasi cloud.
 */
export function recordDeletedConversation(userEmailOrId: string, convId: string): void {
  if (typeof window === "undefined" || !userEmailOrId || !convId) return;
  try {
    const cleanKey = userEmailOrId.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
    const key = `zap_deleted_convs_${cleanKey}`;
    const raw = localStorage.getItem(key);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(convId)) {
      list.push(convId);
      localStorage.setItem(key, JSON.stringify(list.slice(-100)));
    }
  } catch {}
}

/**
 * Mengambil daftar ID percakapan yang telah dihapus untuk akun pengguna
 */
export function getDeletedConversations(userEmailOrId: string): Set<string> {
  if (typeof window === "undefined" || !userEmailOrId) return new Set();
  try {
    const cleanKey = userEmailOrId.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
    const key = `zap_deleted_convs_${cleanKey}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    return new Set<string>(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

/**
 * Menyimpan data backup akun ke penyimpanan lokal browser dan sinkronisasi ke server
 */
export async function syncAccountBackup(
  user: ZAPUser,
  overrides?: SyncBackupOverrides
): Promise<boolean> {
  if (typeof window === "undefined" || !user) return false;

  const userEmail = (user.email || user.id || "").toLowerCase().trim();
  const current = collectLocalUserData(user);
  const rawConvs = overrides?.conversations !== undefined ? overrides.conversations : current.conversations;

  // Berikan tag kepemilikan akun secara eksplisit pada setiap sesi percakapan
  const taggedConvs = rawConvs.map((c: any) => ({
    ...c,
    userEmail,
  }));

  const payload: UserAccountBackupPayload & {
    deletedConversationId?: string;
    replaceConversations?: boolean;
  } = {
    user,
    updatedAt: Date.now(),
    configs: {
      ...current.configs,
      ...(overrides?.configs || {}),
    },
    conversations: taggedConvs,
    workspaces: overrides?.workspaces !== undefined ? overrides.workspaces : current.workspaces,
    workspaceFiles: overrides?.workspaceFiles !== undefined ? overrides.workspaceFiles : current.workspaceFiles,
    deletedConversationId: overrides?.deletedConversationId,
    replaceConversations: overrides?.replaceConversations,
  };

  // 1. Simpan salinan lokal terisolasi per akun pengguna
  try {
    const userStorageKey = `zap_user_backup_${userEmail}`;
    localStorage.setItem(userStorageKey, JSON.stringify(payload));

    const userConvKey = getUserStorageKey(userEmail);
    const convsStr = JSON.stringify(taggedConvs);
    localStorage.setItem(userConvKey, convsStr);

    // Sinkronkan key aktif saat ini (tanpa mengotori key global)
    localStorage.setItem("zap_last_active_user_email", userEmail);
  } catch (e) {
    console.warn("Gagal menyimpan backup akun lokal:", e);
  }

  // 2. Kirim pencadangan otomatis ke server (Cloud Auto-Backup)
  try {
    const res = await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (netErr) {
    console.warn("Gagal sinkronisasi cloud akun (offline mode):", netErr);
    return false;
  }
}

/**
 * Mengambil data akun dari server / backup lokal dan memulihkan sesi & konfigurasi ke browser
 */
export async function restoreAccountData<M = unknown, C = unknown, W = unknown, F = unknown>(user: ZAPUser): Promise<{
  conversations: StoredConversation<M, C>[];
  configs: AccountConfigs;
  workspaces: W[];
  workspaceFiles: F[];
}> {
  if (typeof window === "undefined" || !user) {
    return { conversations: [], configs: {}, workspaces: [], workspaceFiles: [] };
  }

  const userEmail = (user.email || user.id || "").toLowerCase().trim();
  let serverBackup: UserAccountBackupPayload | null = null;

  // 1. Coba ambil dari cloud endpoint
  try {
    const url = `/api/user/sync?email=${encodeURIComponent(user.email || "")}&userId=${encodeURIComponent(user.id || "")}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.exists && json.data) {
        serverBackup = json.data;
      }
    }
  } catch (netErr) {
    console.warn("Tidak dapat menghubungi endpoint backup server, beralih ke cache lokal:", netErr);
  }

  // 2. Jika server belum ada data atau offline, ambil HANYA dari cache akun ini
  if (!serverBackup) {
    try {
      const userStorageKey = `zap_user_backup_${userEmail}`;
      const cached = localStorage.getItem(userStorageKey);
      if (cached) {
        serverBackup = JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Gagal membaca cache lokal akun:", e);
    }
  }

  // 3. Ambil percakapan lokal dari key terisolasi user ini
  const userConvKey = getUserStorageKey(userEmail);
  let localUserConvs: StoredConversation<unknown, unknown>[] = [];
  try {
    const raw = localStorage.getItem(userConvKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localUserConvs = parsed;
      }
    }
  } catch {}

  const deletedSet = getDeletedConversations(userEmail);

  // Kumpulkan HANYA percakapan milik akun ini yang BELUM dihapus
  const convMap = new Map<string, StoredConversation<unknown, unknown>>();
  if (serverBackup?.conversations && Array.isArray(serverBackup.conversations)) {
    for (const c of serverBackup.conversations) {
      if (c && c.id && !deletedSet.has(c.id)) {
        convMap.set(c.id, { ...c, userEmail });
      }
    }
  }
  if (localUserConvs && Array.isArray(localUserConvs)) {
    for (const c of localUserConvs) {
      if (
        c &&
        c.id &&
        !deletedSet.has(c.id) &&
        c.userEmail &&
        c.userEmail.toLowerCase().trim() === userEmail
      ) {
        const existing = convMap.get(c.id);
        const existingCount = Array.isArray(existing?.messages) ? existing.messages.length : 0;
        const localCount = Array.isArray(c.messages) ? c.messages.length : 0;
        if (!existing || localCount > existingCount) {
          convMap.set(c.id, { ...c, userEmail });
        } else if (localCount === existingCount && (c.updatedAt || 0) >= (existing.updatedAt || 0)) {
          convMap.set(c.id, { ...c, userEmail });
        }
      }
    }
  }

  const mergedConversations = Array.from(convMap.values()).sort(
    (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
  );

  let cleanedWorkspaces: any[] = [];
  let cleanedFiles: any[] = [];

  // 4. Update localStorage secara bersih dan terisolasi untuk user ini
  try {
    localStorage.setItem("zap_last_active_user_email", userEmail);
    const convJson = JSON.stringify(mergedConversations);
    localStorage.setItem(userConvKey, convJson);

    // Pulihkan konfigurasi akun jika ada
    const mergedConfigs: AccountConfigs = {
      ...(serverBackup?.configs || {}),
    };
    if (mergedConfigs.nvidiaApiKey) localStorage.setItem("zap_nvidia_api_key", mergedConfigs.nvidiaApiKey);
    if (mergedConfigs.geminiApiKey) localStorage.setItem("zap_gemini_api_key", mergedConfigs.geminiApiKey);
    if (mergedConfigs.openaiApiKey) localStorage.setItem("zap_openai_api_key", mergedConfigs.openaiApiKey);
    if (mergedConfigs.claudeApiKey) localStorage.setItem("zap_claude_api_key", mergedConfigs.claudeApiKey);
    if (mergedConfigs.bazaarlinkApiKey) localStorage.setItem("zap_bazaarlink_api_key", mergedConfigs.bazaarlinkApiKey);
    if (mergedConfigs.mistralApiKey) localStorage.setItem("zap_mistral_api_key", mergedConfigs.mistralApiKey);
    if (mergedConfigs.customBaseUrl) localStorage.setItem("zap_custom_base_url", mergedConfigs.customBaseUrl);
    if (mergedConfigs.customModelName) localStorage.setItem("zap_custom_model_name", mergedConfigs.customModelName);
    if (mergedConfigs.customApiKey) localStorage.setItem("zap_custom_api_key", mergedConfigs.customApiKey);
    if (mergedConfigs.selectedModelId) localStorage.setItem("zap_selected_model_id", mergedConfigs.selectedModelId);
    if (mergedConfigs.theme) {
      localStorage.setItem("zap_theme", mergedConfigs.theme);
      if (typeof window !== "undefined") {
        const isDark = mergedConfigs.theme === "dark" || (mergedConfigs.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("dark", isDark);
        document.documentElement.classList.toggle("light", !isDark);
      }
    }

    // Pulihkan workspaces & workspace files jika tersedia (abaikan "default" atau "Default workspace")
    if (serverBackup?.workspaces && Array.isArray(serverBackup.workspaces)) {
      cleanedWorkspaces = (serverBackup.workspaces as any[]).filter(
        (w: any) => w && w.id !== "default" && w.name !== "Default workspace"
      );
      localStorage.setItem("zap_workspaces", JSON.stringify(cleanedWorkspaces));
    }
    if (serverBackup?.workspaceFiles && Array.isArray(serverBackup.workspaceFiles)) {
      cleanedFiles = (serverBackup.workspaceFiles as any[]).filter(
        (f: any) => f && f.workspaceId !== "default"
      );
      localStorage.setItem("zap_workspace_files", JSON.stringify(cleanedFiles));
    }
  } catch (storageErr) {
    console.warn("Gagal memulihkan data ke localStorage:", storageErr);
  }

  return {
    conversations: mergedConversations as unknown as StoredConversation<M, C>[],
    configs: serverBackup?.configs || {},
    workspaces: cleanedWorkspaces as unknown as W[],
    workspaceFiles: cleanedFiles as unknown as F[],
  };
}
