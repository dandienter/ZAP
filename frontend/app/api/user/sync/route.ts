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
}

function getVaultDir(): string {
  const dir = path.join(process.cwd(), ".zap_vault", "users");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getVaultFilePath(email: string, userId: string): string {
  const rawKey = (email || userId || "anonymous").trim().toLowerCase();
  const safeKey = rawKey.replace(/[^a-z0-9._-]/g, "_");
  return path.join(getVaultDir(), `${safeKey}.json`);
}

// GET: Ambil backup data pengguna berdasarkan email / userId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || "";
    const userId = searchParams.get("userId") || "";

    if (!email && !userId) {
      return NextResponse.json({ error: "Email atau userId diperlukan" }, { status: 400 });
    }

    const filePath = getVaultFilePath(email, userId);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ exists: false, message: "Belum ada backup untuk akun ini" });
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const data: VaultData = JSON.parse(raw);
    return NextResponse.json({
      exists: true,
      data,
    });
  } catch (err) {
    console.warn("Gagal membaca backup pengguna:", err);
    return NextResponse.json({ error: "Gagal memproses permintaan backup" }, { status: 500 });
  }
}

// POST: Simpan atau merge backup data pengguna
export async function POST(req: Request) {
  try {
    const body: SyncRequestBody = await req.json();
    const { user, configs, conversations, workspaces, workspaceFiles } = body;

    if (!user || (!user.email && !user.id)) {
      return NextResponse.json({ error: "Data pengguna tidak valid" }, { status: 400 });
    }

    const filePath = getVaultFilePath(user.email, user.id);
    let existingData: VaultData = {};

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        existingData = JSON.parse(raw);
      } catch (parseErr) {
        console.warn("Gagal membaca data existing, akan ditimpa:", parseErr);
      }
    }

    // Merge conversations: gabungkan berdasarkan ID, pertahankan versi terbaru
    const existingConvs: ConversationItem[] = Array.isArray(existingData.conversations)
      ? existingData.conversations
      : [];
    const incomingConvs: ConversationItem[] = Array.isArray(conversations) ? conversations : [];

    const convMap = new Map<string, ConversationItem>();
    for (const c of existingConvs) {
      if (c && c.id) convMap.set(c.id, c);
    }
    for (const c of incomingConvs) {
      if (c && c.id) {
        const prev = convMap.get(c.id);
        if (!prev || (c.updatedAt || 0) >= (prev.updatedAt || 0)) {
          convMap.set(c.id, c);
        }
      }
    }

    const mergedConversations = Array.from(convMap.values())
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 50); // Simpan hingga 50 sesi percakapan terbaru per akun

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

    // Merge workspaces & workspace files
    const mergedWorkspaces =
      workspaces && Array.isArray(workspaces) && workspaces.length > 0
        ? workspaces
        : existingData.workspaces || [];

    const mergedFiles =
      workspaceFiles && Array.isArray(workspaceFiles) && workspaceFiles.length > 0
        ? workspaceFiles
        : existingData.workspaceFiles || [];

    const payloadToSave: VaultData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || existingData.user?.name || "Pengguna ChatZAP",
        avatar: user.avatar || existingData.user?.avatar,
        role: user.role || existingData.user?.role || "siswa",
        jenjang: user.jenjang || existingData.user?.jenjang || "sma",
        provider: user.provider || "google",
        tier: user.tier || "standard",
      },
      configs: mergedConfigs,
      conversations: mergedConversations,
      workspaces: mergedWorkspaces,
      workspaceFiles: mergedFiles,
      updatedAt: Date.now(),
    };

    fs.writeFileSync(filePath, JSON.stringify(payloadToSave, null, 2), "utf-8");

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
