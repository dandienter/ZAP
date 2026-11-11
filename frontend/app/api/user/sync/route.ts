import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface SyncUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
  jenjang?: string;
  provider?: string;
  tier?: string;
  isGuest?: boolean;
}

interface ConversationItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: unknown[];
  activeProblemFirstStep?: string | null;
  activeProblemContext?: unknown;
  targetVar?: string;
}

interface VaultData {
  user?: SyncUser;
  configs?: Record<string, string>;
  conversations?: ConversationItem[];
  workspaces?: unknown[];
  workspaceFiles?: unknown[];
  updatedAt?: number;
}

interface SyncRequestBody {
  user: SyncUser;
  configs?: Record<string, string>;
  conversations?: ConversationItem[];
  workspaces?: unknown[];
  workspaceFiles?: unknown[];
  deletedConversationId?: string;
  replaceConversations?: boolean;
}

// ---------------- Autentikasi wajib (Google ID token) ----------------
// Semua method route ini WAJIB membawa header:
//   Authorization: Bearer <Google ID token>
// Token diverifikasi ke Google (tokeninfo), aud harus cocok dengan client ID
// server, email_verified harus true, dan email di token harus sama dengan
// email yang disinkronkan. Tidak ada jalur tanpa auth (fail-closed).

type AuthResult = { email: string } | { errorResponse: NextResponse };

async function requireGoogleIdentity(req: Request): Promise<AuthResult> {
  const unauthorized = (message: string, status: number = 401) => ({
    errorResponse: NextResponse.json({ error: message }, { status }),
  });

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return unauthorized("Autentikasi diperlukan. Sertakan Google ID token pada header Authorization.");
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    return unauthorized("Autentikasi diperlukan. Sertakan Google ID token pada header Authorization.");
  }

  const expectedAud =
    process.env.ZAP_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  if (!expectedAud) {
    return unauthorized(
      "Server belum dikonfigurasi untuk verifikasi Google (ZAP_GOOGLE_CLIENT_ID kosong).",
      500
    );
  }

  let info: Record<string, unknown>;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) {
      return unauthorized("Token Google tidak valid atau sudah kedaluwarsa.");
    }
    info = (await res.json()) as Record<string, unknown>;
  } catch {
    return unauthorized("Gagal memverifikasi token Google. Silakan coba lagi.");
  }

  if (info.aud !== expectedAud) {
    return unauthorized("Token Google tidak diterbitkan untuk aplikasi ini.");
  }
  if (info.email_verified !== "true" && info.email_verified !== true) {
    return unauthorized("Email Google belum terverifikasi.");
  }
  const email = typeof info.email === "string" ? info.email.trim().toLowerCase() : "";
  if (!email) {
    return unauthorized("Token Google tidak memuat email.");
  }

  return { email };
}

function assertEmailMatches(identityEmail: string, targetEmail: string): NextResponse | null {
  if (targetEmail && targetEmail.trim().toLowerCase() !== identityEmail) {
    return NextResponse.json(
      { error: "Email yang disinkronkan tidak cocok dengan identitas token." },
      { status: 403 }
    );
  }
  return null;
}

// Serverless-safe fallback in-memory store for environments with read-only filesystems (Vercel, Cloudflare, Lambda)
const memoryVault = new Map<string, VaultData>();

function getVaultDir(): string {
  try {
    const dir = path.join(process.cwd(), ".zap_vault", "users");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  } catch {
    return "";
  }
}

function getVaultSafeKey(email: string, userId: string): string {
  const rawKey = (email || userId || "anonymous").trim().toLowerCase();
  return rawKey
    .replace(/[\0/\\]/g, "")
    .replace(/\.+/g, "_")
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 80);
}

function getVaultFilePath(email: string, userId: string): string {
  const safeKey = getVaultSafeKey(email, userId);
  if (!safeKey) return "";
  const dir = getVaultDir();
  if (!dir) return "";
  const targetPath = path.resolve(dir, `${safeKey}.json`);
  const resolvedDir = path.resolve(dir);
  if (!targetPath.startsWith(resolvedDir + path.sep)) {
    return "";
  }
  return targetPath;
}

// GET: Ambil backup data pengguna (identitas diambil dari Google ID token)
export async function GET(req: Request) {
  try {
    const auth = await requireGoogleIdentity(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || "";
    const mismatch = assertEmailMatches(auth.email, email);
    if (mismatch) return mismatch;

    // Identitas otoritatif = email dari token terverifikasi, bukan parameter.
    const identityEmail = auth.email;
    const safeKey = getVaultSafeKey(identityEmail, "");
    const filePath = getVaultFilePath(identityEmail, "");
    let data: VaultData | null = memoryVault.get(safeKey) || null;

    if (!data && filePath && fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        data = JSON.parse(raw);
        if (data) memoryVault.set(safeKey, data);
      } catch (err) {
        console.warn("Gagal membaca file vault:", err);
      }
    }

    if (!data) {
      return NextResponse.json({ exists: false, message: "Belum ada backup untuk akun ini" });
    }

    return NextResponse.json({
      exists: true,
      data,
    });
  } catch (err) {
    console.warn("Gagal membaca backup pengguna:", err);
    return NextResponse.json({ error: "Gagal memproses permintaan backup" }, { status: 500 });
  }
}

// POST: Simpan atau merge backup data pengguna (wajib Google ID token)
export async function POST(req: Request) {
  try {
    const auth = await requireGoogleIdentity(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body: SyncRequestBody = await req.json();
    const {
      user,
      configs,
      conversations,
      workspaces,
      workspaceFiles,
      deletedConversationId,
      replaceConversations,
    } = body;

    if (!user || (!user.email && !user.id)) {
      return NextResponse.json({ error: "Data pengguna tidak valid" }, { status: 400 });
    }

    // Email pada body harus sama dengan email token terverifikasi.
    const mismatch = assertEmailMatches(auth.email, user.email || "");
    if (mismatch) return mismatch;
    user.email = auth.email;

    const safeKey = getVaultSafeKey(user.email, user.id);
    const filePath = getVaultFilePath(user.email, user.id);
    let existingData: VaultData = memoryVault.get(safeKey) || {};

    if ((!existingData || Object.keys(existingData).length === 0) && filePath && fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        existingData = JSON.parse(raw);
      } catch (parseErr) {
        console.warn("Gagal membaca data existing, akan ditimpa:", parseErr);
      }
    }

    // Bersihkan sesi percakapan yang dihapus jika ada
    let existingConvs: ConversationItem[] = Array.isArray(existingData.conversations)
      ? existingData.conversations
      : [];
    if (deletedConversationId) {
      existingConvs = existingConvs.filter((c) => c.id !== deletedConversationId);
    }

    const incomingConvs: ConversationItem[] = Array.isArray(conversations)
      ? conversations.filter((c) => c.id !== deletedConversationId)
      : [];

    let mergedConversations: ConversationItem[];

    if (replaceConversations || deletedConversationId) {
      // Jika instruksi replaceConversations atau setelah delete:
      // Gunakan incomingConvs secara persis tanpa membangkitkan kembali obrolan yang dihapus
      mergedConversations = incomingConvs
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 50);
    } else {
      const convMap = new Map<string, ConversationItem>();
      for (const c of existingConvs) {
        if (c && c.id) convMap.set(c.id, c);
      }
      for (const c of incomingConvs) {
        if (c && c.id) {
          const prev = convMap.get(c.id);
          // Selalu pertahankan percakapan dengan jumlah pesan terbanyak untuk mencegah race condition
          const prevCount = Array.isArray(prev?.messages) ? prev.messages.length : 0;
          const incomingCount = Array.isArray(c.messages) ? c.messages.length : 0;
          if (!prev) {
            convMap.set(c.id, c);
          } else if (incomingCount > prevCount) {
            convMap.set(c.id, c);
          } else if (incomingCount === prevCount && (c.updatedAt || 0) >= (prev.updatedAt || 0)) {
            convMap.set(c.id, c);
          }
        }
      }
      mergedConversations = Array.from(convMap.values())
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 50);
    }

    // Merge configs (API keys & model preferences)
    const existingConfigs: Record<string, string> = existingData.configs || {};
    const mergedConfigs: Record<string, string> = { ...existingConfigs };

    if (configs && typeof configs === "object") {
      for (const [k, v] of Object.entries(configs)) {
        if (v !== undefined && v !== null && v !== "") {
          mergedConfigs[k] = v;
        }
      }
    }

    // Merge workspaces & workspace files (Tanpa workspace bawaan "default")
    const mergedWorkspaces = (
      workspaces && Array.isArray(workspaces)
        ? workspaces
        : existingData.workspaces || []
    ).filter((w: unknown) => {
      const item = w as Record<string, unknown> | null;
      return item && item.id !== "default" && item.name !== "Default workspace";
    });

    const mergedFiles = (
      workspaceFiles && Array.isArray(workspaceFiles)
        ? workspaceFiles
        : existingData.workspaceFiles || []
    ).filter((f: unknown) => {
      const file = f as Record<string, unknown> | null;
      return file && file.workspaceId !== "default";
    });

    const isGuest = user.isGuest === true || (user.provider === "zap" && (user.email?.includes("@student.zap") || user.name?.toLowerCase().includes("tamu")));

    const payloadToSave: VaultData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || existingData.user?.name || "Pengguna ChatZAP",
        avatar: user.avatar || existingData.user?.avatar,
        role: isGuest ? (user.role || existingData.user?.role || "Tamu") : undefined,
        jenjang: isGuest ? (user.jenjang || existingData.user?.jenjang || "Tamu") : undefined,
        provider: user.provider || "google",
        tier: user.tier || "standard",
      },
      configs: mergedConfigs,
      conversations: mergedConversations,
      workspaces: mergedWorkspaces,
      workspaceFiles: mergedFiles,
      updatedAt: Date.now(),
    };

    memoryVault.set(safeKey, payloadToSave);

    if (filePath) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(payloadToSave, null, 2), "utf-8");
      } catch (fsErr) {
        console.warn("Serverless environment: disk write skipped, saved to memory vault:", fsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data akun berhasil dicadangkan secara otomatis",
      updatedAt: payloadToSave.updatedAt,
      stats: {
        conversations: mergedConversations.length,
        hasNvidiaKey: Boolean(mergedConfigs.nvidiaApiKey),
        hasGeminiKey: Boolean(mergedConfigs.geminiApiKey),
      },
    });
  } catch (err) {
    console.error("Gagal menyimpan backup akun:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan pencadangan akun ke server" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus percakapan tertentu secara permanen dari cloud vault (wajib token)
export async function DELETE(req: Request) {
  try {
    const auth = await requireGoogleIdentity(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || "";
    const convId = searchParams.get("convId") || "";

    if (!convId) {
      return NextResponse.json(
        { error: "convId diperlukan untuk penghapusan" },
        { status: 400 }
      );
    }

    const mismatch = assertEmailMatches(auth.email, email);
    if (mismatch) return mismatch;

    const identityEmail = auth.email;
    const safeKey = getVaultSafeKey(identityEmail, "");
    const memData = memoryVault.get(safeKey);
    if (memData && Array.isArray(memData.conversations)) {
      memData.conversations = memData.conversations.filter((c) => c.id !== convId);
      memData.updatedAt = Date.now();
      memoryVault.set(safeKey, memData);
    }

    const filePath = getVaultFilePath(identityEmail, "");
    if (filePath && fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const data: VaultData = JSON.parse(raw);
        if (Array.isArray(data.conversations)) {
          data.conversations = data.conversations.filter((c) => c.id !== convId);
          data.updatedAt = Date.now();
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
        }
      } catch (fileErr) {
        console.warn("Gagal memperbarui file vault saat delete:", fileErr);
      }
    }

    // Bersihkan juga jika percakapan ini pernah dibagikan publik
    try {
      const sharesDir = path.join(process.cwd(), ".zap_vault", "shares");
      if (fs.existsSync(sharesDir)) {
        const shareFiles = fs.readdirSync(sharesDir);
        for (const sf of shareFiles) {
          if (!sf.endsWith(".json")) continue;
          try {
            const sPath = path.join(sharesDir, sf);
            const sRaw = fs.readFileSync(sPath, "utf-8");
            const sData = JSON.parse(sRaw);
            if (sData.conversationId === convId) {
              fs.unlinkSync(sPath);
            }
          } catch {}
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Percakapan ${convId} berhasil dihapus permanen`,
    });
  } catch (err) {
    console.error("Gagal menghapus percakapan dari vault:", err);
    return NextResponse.json(
      { error: "Gagal memproses penghapusan percakapan dari server" },
      { status: 500 }
    );
  }
}
