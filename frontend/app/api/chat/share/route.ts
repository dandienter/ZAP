import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

interface ShareMessage {
  id: string;
  sender: "user" | "assistant";
  steps?: string[];
  rawText?: string;
  diagnosis?: unknown;
  replyText?: string;
  modelName?: string;
  timestamp: string;
  smartboardItem?: unknown;
  feedback?: "up" | "down" | null;
  attachedFiles?: unknown[];
}

interface SharedConversationPayload {
  shareId: string;
  conversationId?: string;
  title: string;
  authorName?: string;
  authorEmail?: string;
  sharedAt: number;
  updatedAt: number;
  messages: ShareMessage[];
  targetVar?: string;
  active3DModel?: string;
}

function getSharesDir(): string {
  const dir = path.join(process.cwd(), ".zap_vault", "shares");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getShareFilePath(shareId: string): string {
  const cleanId = shareId.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return path.join(getSharesDir(), `${cleanId}.json`);
}

// GET /api/chat/share?id=<shareId>
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { exists: false, error: "ID tautan percakapan diperlukan" },
        { status: 400 }
      );
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    const filePath = getShareFilePath(cleanId);

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data: SharedConversationPayload = JSON.parse(raw);
      return NextResponse.json({ exists: true, data });
    }

    // Fallback: Cek jika ID adalah conversationId dari vault pengguna
    const usersDir = path.join(process.cwd(), ".zap_vault", "users");
    if (fs.existsSync(usersDir)) {
      const userFiles = fs.readdirSync(usersDir);
      for (const file of userFiles) {
        if (!file.endsWith(".json")) continue;
        try {
          const userRaw = fs.readFileSync(path.join(usersDir, file), "utf-8");
          const userData = JSON.parse(userRaw);
          if (Array.isArray(userData.conversations)) {
            const found = userData.conversations.find((c: any) => c.id === id);
            if (found && Array.isArray(found.messages) && found.messages.length > 0) {
              const syntheticShare: SharedConversationPayload = {
                shareId: cleanId,
                conversationId: found.id,
                title: found.title || "Percakapan ZAP",
                authorName: userData.user?.name || "Pengguna ZAP",
                sharedAt: found.createdAt || Date.now(),
                updatedAt: found.updatedAt || Date.now(),
                messages: found.messages,
                targetVar: found.targetVar || "x",
              };
              // Simpan langsung agar berikutnya instan
              fs.writeFileSync(filePath, JSON.stringify(syntheticShare, null, 2), "utf-8");
              return NextResponse.json({ exists: true, data: syntheticShare });
            }
          }
        } catch {}
      }
    }

    return NextResponse.json(
      { exists: false, error: "Percakapan yang dibagikan tidak ditemukan" },
      { status: 404 }
    );
  } catch (err) {
    console.warn("Gagal memuat percakapan yang dibagikan:", err);
    return NextResponse.json(
      { exists: false, error: "Terjadi kesalahan pada server saat memuat tautan" },
      { status: 500 }
    );
  }
}

// POST /api/chat/share
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      conversationId,
      title,
      messages,
      authorName,
      authorEmail,
      includeAuthor = true,
      targetVar,
      active3DModel,
      shareId: requestedShareId,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Percakapan tidak memiliki pesan untuk dibagikan" },
        { status: 400 }
      );
    }

    // Gunakan shareId yang diminta jika ada dan valid UUID, atau buat baru
    let shareId = requestedShareId;
    if (!shareId || typeof shareId !== "string" || !/^[a-z0-9-]{8,}$/i.test(shareId)) {
      shareId = crypto.randomUUID();
    }
    shareId = shareId.toLowerCase();

    const cleanTitle = (title || "Percakapan ZAP").toString().trim();
    const finalAuthor = includeAuthor ? (authorName || "Pengguna ZAP").toString().trim() : "Anonim";

    // Bersihkan pesan dari data privat yang tidak relevan
    const sanitizedMessages: ShareMessage[] = messages.map((m: any) => ({
      id: m.id || crypto.randomUUID(),
      sender: m.sender === "user" ? "user" : "assistant",
      steps: Array.isArray(m.steps) ? m.steps : undefined,
      rawText: typeof m.rawText === "string" ? m.rawText : undefined,
      diagnosis: m.diagnosis || undefined,
      replyText: typeof m.replyText === "string" ? m.replyText : undefined,
      modelName: typeof m.modelName === "string" ? m.modelName : undefined,
      timestamp: m.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      smartboardItem: m.smartboardItem || undefined,
      feedback: m.feedback || null,
      attachedFiles: Array.isArray(m.attachedFiles) ? m.attachedFiles : undefined,
    }));

    const payload: SharedConversationPayload = {
      shareId,
      conversationId: conversationId || undefined,
      title: cleanTitle,
      authorName: finalAuthor,
      authorEmail: includeAuthor ? authorEmail : undefined,
      sharedAt: Date.now(),
      updatedAt: Date.now(),
      messages: sanitizedMessages,
      targetVar: targetVar || "x",
      active3DModel: active3DModel || undefined,
    };

    const filePath = getShareFilePath(shareId);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      shareId,
      sharePath: `/a/chat/s/${shareId}`,
      altSharePath: `/chat/s/${shareId}`,
      title: cleanTitle,
    });
  } catch (err) {
    console.warn("Gagal membuat tautan percakapan:", err);
    return NextResponse.json(
      { error: "Gagal membagikan percakapan ke server" },
      { status: 500 }
    );
  }
}
