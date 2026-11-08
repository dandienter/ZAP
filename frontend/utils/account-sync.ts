/**
 * ZAP Account Cloud Sync & Auto-Backup
 * Menghubungkan riwayat chat, API keys, dan konfigurasi ke Akun Google pengguna.
 */

import { type ZAPUser } from "@/components/GoogleAuthButton";
import { type StoredConversation } from "@/utils/chat-memory";

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
 * Mengumpulkan semua data lokal saat ini dari browser pengguna
 */
export function collectLocalUserData(user: ZAPUser): UserAccountBackupPayload {
  if (typeof window === "undefined") {
    return {
      user,
      configs: {},
      conversations: [],
    };
  }

  // 1. Baca percakapan dari kedua key agar tidak ada yang terlewat
  let convs: StoredConversation<unknown, unknown>[] = [];
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY_PRIMARY) ||
      localStorage.getItem(STORAGE_KEY_LEGACY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        convs = parsed;
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
  };

  // 3. Workspaces & files
  let workspaces: unknown[] = [];
  let workspaceFiles: unknown[] = [];
  try {
    const wsRaw = localStorage.getItem("zap_workspaces");
    if (wsRaw) workspaces = JSON.parse(wsRaw);
    const filesRaw = localStorage.getItem("zap_workspace_files");
    if (filesRaw) workspaceFiles = JSON.parse(filesRaw);
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

/**
 * Menyimpan data backup akun ke penyimpanan lokal browser dan sinkronisasi ke server
 */
export async function syncAccountBackup(
  user: ZAPUser,
  overrides?: Partial<UserAccountBackupPayload>
): Promise<boolean> {
  if (typeof window === "undefined" || !user) return false;

  const current = collectLocalUserData(user);
  const payload: UserAccountBackupPayload = {
    user,
    updatedAt: Date.now(),
    configs: {
      ...current.configs,
      ...(overrides?.configs || {}),
    },
    conversations: overrides?.conversations !== undefined ? overrides.conversations : current.conversations,
    workspaces: overrides?.workspaces !== undefined ? overrides.workspaces : current.workspaces,
    workspaceFiles: overrides?.workspaceFiles !== undefined ? overrides.workspaceFiles : current.workspaceFiles,
  };

  // 1. Simpan salinan lokal terisolasi per akun pengguna
  try {
    const userStorageKey = `zap_user_backup_${user.email || user.id}`;
    localStorage.setItem(userStorageKey, JSON.stringify(payload));

    // Sinkronkan key percakapan utama & legacy agar konsisten
    if (payload.conversations && payload.conversations.length > 0) {
      const convsStr = JSON.stringify(payload.conversations);
      localStorage.setItem(STORAGE_KEY_PRIMARY, convsStr);
      localStorage.setItem(STORAGE_KEY_LEGACY, convsStr);
    }
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

  // 2. Jika server belum ada data atau offline, ambil dari cache akun lokal
  if (!serverBackup) {
    try {
      const userStorageKey = `zap_user_backup_${user.email || user.id}`;
      const cached = localStorage.getItem(userStorageKey);
      if (cached) {
        serverBackup = JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Gagal membaca cache lokal akun:", e);
    }
  }

  // 3. Gabungkan percakapan yang mungkin sudah ada di browser dengan percakapan dari backup
  const localCurrent = collectLocalUserData(user);
  const convMap = new Map<string, StoredConversation<unknown, unknown>>();

  // Masukkan dari server/cache terlebih dahulu
  if (serverBackup?.conversations && Array.isArray(serverBackup.conversations)) {
    for (const c of serverBackup.conversations) {
      if (c && c.id) convMap.set(c.id, c);
    }
  }

  // Masukkan dari browser lokal (jika ada yang lebih baru)
  if (localCurrent.conversations && Array.isArray(localCurrent.conversations)) {
    for (const c of localCurrent.conversations) {
      if (c && c.id) {
        const existing = convMap.get(c.id);
        if (!existing || (c.updatedAt || 0) >= (existing.updatedAt || 0)) {
          convMap.set(c.id, c);
        }
      }
    }
  }

  const mergedConversations = Array.from(convMap.values()).sort(
    (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
  );

  // 4. Pulihkan konfigurasi & API keys
  const mergedConfigs: AccountConfigs = {
    ...(serverBackup?.configs || {}),
    ...localCurrent.configs,
  };

  // Terapkan ke localStorage agar seluruh halaman langsung mendapatkan nilainya
  try {
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

    // Tulis percakapan ke kedua storage key
    const convJson = JSON.stringify(mergedConversations);
    localStorage.setItem(STORAGE_KEY_PRIMARY, convJson);
    localStorage.setItem(STORAGE_KEY_LEGACY, convJson);

    // Pulihkan workspaces jika tersedia
    if (serverBackup?.workspaces && Array.isArray(serverBackup.workspaces) && serverBackup.workspaces.length > 0) {
      localStorage.setItem("zap_workspaces", JSON.stringify(serverBackup.workspaces));
    }
    if (serverBackup?.workspaceFiles && Array.isArray(serverBackup.workspaceFiles) && serverBackup.workspaceFiles.length > 0) {
      localStorage.setItem("zap_workspace_files", JSON.stringify(serverBackup.workspaceFiles));
    }
  } catch (storageErr) {
    console.warn("Gagal memulihkan data ke localStorage:", storageErr);
  }

  return {
    conversations: mergedConversations as unknown as StoredConversation<M, C>[],
    configs: mergedConfigs,
    workspaces: (serverBackup?.workspaces || localCurrent.workspaces || []) as unknown as W[],
    workspaceFiles: (serverBackup?.workspaceFiles || localCurrent.workspaceFiles || []) as unknown as F[],
  };
}
