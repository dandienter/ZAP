import { NextResponse } from "next/server";
import { resolveGeometricIntent } from "@/data/geometry-database";

interface ActiveProblemContext {
  steps?: string[];
  faultLine?: number;
  misconceptionType?: string;
  explanation?: string;
  socraticHint?: string;
  counterExample?: {
    test_variable?: string;
    test_value?: number;
    lhs_expected?: string;
    rhs_calculated?: string;
    contradiction_statement?: string;
  };
}

interface ChatRequestBody {
  message: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  activeProblem?: ActiveProblemContext | null;
  attachedFiles?: Array<{ name: string; content?: string }>;
  workspaceMode?: "write" | "read";
  modelId?: string;
  apiKey?: string;
  mistralApiKey?: string;
  bazaarlinkApiKey?: string;
  claudeApiKey?: string;
  openaiApiKey?: string;
  nvidiaApiKey?: string;
  customBaseUrl?: string;
  customModelName?: string;
  customApiKey?: string;
  userName?: string;
}

interface UniversalCallResult {
  text?: string;
  error?: string;
  status?: number;
  modelUsed?: string;
}

type GeminiCallResult = UniversalCallResult;
type MistralCallResult = UniversalCallResult;
type BazaarLinkCallResult = UniversalCallResult;

const ZERO_ANSWER_PATTERNS = [
  /(?:jawaban(?:nya)?(?:\s*akhir(?:nya)?)?|solusi(?:nya)?|hasil\s+akhir(?:nya)?|kunci\s+jawaban(?:nya)?)\s*(?:adalah|=|:)\s*(?:[a-zA-Z]\s*=\s*)?[-+−]?\s*(?:\d+(?:\/\d+)?|\d*\.?\d+|√\d+)/gi,
  /(?:maka|jadi|kesimpulannya|sehingga|diperoleh|didapatkan),?\s+(?:nilai\s+)?[a-zA-Z]\s*=\s*[-+−]?\s*(?:\d+(?:\/\d+)?|\d*\.?\d+|√\d+)/gi,
  /(?:nilai\s+(?:dari\s+|variabel\s+)?[a-zA-Z])\s*(?:adalah|=|:)\s*[-+−]?\s*(?:\d+(?:\/\d+)?|\d*\.?\d+|√\d+)/gi,
  /(?:the\s+(?:final\s+)?answer\s+is|therefore\s+[a-zA-Z]\s*=|we\s+get\s+[a-zA-Z]\s*=)\s*[-+−]?\s*(?:\d+(?:\/\d+)?|\d*\.?\d+)/gi,
];

function sanitizeZeroAnswer(text: string): string {
  let result = text;
  for (const pattern of ZERO_ANSWER_PATTERNS) {
    result = result.replace(pattern, "Bagaimanakah menurut analisismu?");
  }
  return result;
}

/**
 * Mendeteksi bahasa acuan sesi berdasarkan 2 sampai 3 pesan awal percakapan (Anchor Language).
 * Menjamin AI konsisten menjawab dalam bahasa awal sesi (misal: Bahasa Indonesia),
 * meskipun pengguna sesekali memberi perintah/istilah dalam bahasa Inggris atau bahasa lain.
 */
function detectSessionLanguage(
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  currentMessage?: string
): "Bahasa Indonesia" | "English" {
  const userMessages: string[] = [];
  if (conversationHistory && conversationHistory.length > 0) {
    for (const turn of conversationHistory) {
      if (turn.role === "user" && turn.content?.trim()) {
        userMessages.push(turn.content.trim());
        if (userMessages.length >= 3) break;
      }
    }
  }
  if (userMessages.length === 0 && currentMessage?.trim()) {
    userMessages.push(currentMessage.trim());
  }

  const combinedText = userMessages.join(" ").toLowerCase();

  const idMatches = (
    combinedText.match(
      /\b(dan|yang|di|ke|dari|ini|itu|dengan|untuk|pada|adalah|sebagai|saya|aku|kamu|kita|bisa|buatkan|bikin|tampilkan|gambarkan|rumus|bagaimana|apa|kenapa|mengapa|hitung|tuliskan|hai|halo|pagi|siang|malam|makasih|tolong|coba|kubus|balok|tabung|lingkaran|persamaan)\b/gi
    ) || []
  ).length;

  const enMatches = (
    combinedText.match(
      /\b(the|is|are|am|was|were|and|in|on|at|to|from|for|with|of|this|that|you|me|we|my|can|could|how|what|why|where|calculate|make|show|draw|solve|hello|hi|please|cube|cuboid|cylinder|equation)\b/gi
    ) || []
  ).length;

  if (enMatches > idMatches && idMatches === 0) {
    return "English";
  }
  return "Bahasa Indonesia";
}

/**
 * Membersihkan respon model dari kebocoran tag pemikiran internal (<think>...</think>)
 * atau monolog draf perencanaan internal ("Let me structure...", "Let's draft:").
 */
function cleanModelResponse(text: string): string {
  if (!text) return "";
  let clean = text;

  // 1. Bersihkan tag <think>...</think> dan <thought>...</thought>
  clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  clean = clean.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();

  // 2. Bersihkan monolog perencanaan bahasa Inggris jika bocor dari model reasoning
  const draftSplitters = [
    /\n(?:Halo|Hai|Hello|Hi)\s+[^\n]+!/i,
    /\n\*\*Balok\*\*/i,
    /\n\*\*Kubus\*\*/i,
    /\n###?\s+1\.\s+Volume/i,
    /Let's draft:?\s*\n*/i,
  ];

  for (const splitter of draftSplitters) {
    const match = clean.match(splitter);
    if (match && match.index !== undefined && match.index > 0) {
      const prefix = clean.slice(0, match.index);
      if (
        /providing the formulas|the system instruction|let me structure|so i should|let's write it in/i.test(
          prefix
        )
      ) {
        if (splitter.source.includes("Let's draft")) {
          clean = clean.slice(match.index + match[0].length).trim();
        } else {
          clean = clean.slice(match.index).trim();
        }
        break;
      }
    }
  }

  return clean;
}

function cleanModelDisplayName(rawName?: string): string {
  if (!rawName) return "ChatZAP Cognitive Engine";
  let clean = rawName.trim();
  clean = clean
    .replace(/^BazaarLink\s*\((.*?)\)$/i, "$1")
    .replace(/deepseek\/deepseek-v4-flash-[^\s)]+/gi, "DeepSeek V4 Flash")
    .replace(/qwen\/qwen3\.7-flash[^\s)]*/gi, "Qwen 3.7 Flash")
    .replace(/nvidia\/nemotron-3\.5-bolt-[^\s)]+/gi, "Nemotron-3.5 Bolt Tutor")
    .replace(/nvidia\/nemotron-3-nano-omni-[^\s)]+/gi, "Nemotron-3 Omni Math")
    .replace(/nvidia\/nemotron-3\.5-super-vl-[^\s)]+/gi, "Nemotron-3.5 Super-VL 120B")
    .replace(/nvidia\/nemotron-3-ultra-[^\s)]+/gi, "Nemotron-3 Ultra 550B")
    .replace(/poolside\/laguna-[^\s)]+/gi, "Poolside Laguna Code")
    .replace(/deepseek-ai\/deepseek-v4\.1-flash/gi, "DeepSeek V4.1")
    .replace(/openai\/gpt-oss-[^\s)]+/gi, "GPT-OSS 20B")
    .replace(/google\/diffusiongemma-[^\s)]+/gi, "DiffusionGemma 26B")
    .replace(/:free/gi, "")
    .trim();
  return clean || "ChatZAP Cognitive Engine";
}

function buildZAPSystemPrompt(
  studentName: string,
  activeProblem?: ActiveProblemContext | null,
  modelName?: string,
  sessionLanguage: string = "Bahasa Indonesia",
  workspaceMode: "write" | "read" = "write"
): string {
  const cleanName = cleanModelDisplayName(modelName);
  let prompt = `Anda adalah ChatZAP, asisten cerdas matematika interaktif dan tutor aljabar yang ditenagai oleh model AI (${cleanName}).

KONSISTENSI IDENTITAS MODEL:
- Nama Anda adalah ChatZAP. Anda beroperasi menggunakan arsitektur model penalaran: **${cleanName}**.
- Jika siswa menanyakan identitas model Anda atau bertanya apakah Anda GPT, Nemotron, Gemini, Claude, dsb., jawablah dengan ramah dan konsisten sesuai model aktif Anda saat ini (**${cleanName}**).
- JANGAN PERNAH membantah model aktif Anda sendiri, dan JANGAN PERNAH membocorkan slug teknis internal atau nama proxy gateway (seperti BazaarLink, endpoint URL, :free, atau nomor build internal).

IDENTITAS SISWA:
- Nama siswa: ${studentName}.
- Bersikaplah ramah, suportif, antusias, dan menyemangati. Panggil nama siswa secara akrab.

KONSISTENSI BAHASA SESI PERCAKAPAN (SESSION LANGUAGE ANCHOR):
- Bahasa percakapan utama untuk sesi ini adalah: **${sessionLanguage}** (ditetapkan berdasarkan interaksi awal percakapan).
- WAJIB KONSISTEN: Anda HARUS SELALU menjawab, menjelaskan materi, memaparkan rumus, dan membimbing dalam **${sessionLanguage}**.
- Meskipun di tengah sesi siswa tiba-tiba memberikan perintah atau istilah dalam bahasa lain (misalnya bahasa Inggris seperti "make a 3D cube", "draw cylinder", "solve for x", "formula", dll.), Anda TETAP WAJIB MENJAWAB DALAM **${sessionLanguage}** sesuai bahasa awal sesi!
- JANGAN PERNAH berganti bahasa secara tiba-tiba di tengah sesi kecuali siswa secara eksplisit meminta beralih bahasa (contoh: "tolong jawab dalam bahasa Inggris").

ATURAN RESPON BERSIH & LANGSUNG (ANTI-LEAK):
- Langsung berikan jawaban dan penjelasan kepada siswa secara bersih, ramah, dan terstruktur.
- JANGAN PERNAH menampilkan catatan perencanaan internal, monolog pemikiran, atau rancangan draf (seperti "providing the formulas is definitely appropriate", "Let me structure the response", "Let's draft:", "Structure: ...", dsb.).

PANDUAN MODE KERJA (WAJIB DIIKUTI DENGAN SANGAT DISIPLIN):

MODE 1: VISUALISASI GEOMETRI 3D, GRAFIK 2D & SMARTBOARD (PENGECUALIAN PENUH DARI ZERO-ANSWER)
- Jika siswa meminta membuatkan, menampilkan, atau memvisualisasikan objek geometri ruang 3D atau grafik 2D (contoh: "buatkan 3D cube 10cm", "buatkan kubus", "gambarkan tabung r=7 t=12", "tampilkan bola", "gambarkan grafik parabola y = x^2 - 3"):
  * SELALU SAMBUT DENGAN SANGAT ANTUSIAS DAN GEMBIRA!
  * JANGAN PERNAH MENOLAK dengan dalih "kebijakan zero answer policy", "tidak bisa membuatkan objek jadi", atau "hanya bisa membimbing". Visualisasi 3D di Papan Tulis Pintar adalah FITUR RESMI & UNGGULAN platform ChatZAP, BUKAN kecurangan ujian!
  * Konfirmasikan dengan jelas bahwa objek geometri 3D telah AKTIF dan ditampilkan di Papan Tulis Pintar (Smartboard) di panel sebelah kanan layar.
  * Uraikan sifat-sifat matematis objek tersebut secara lengkap dan rapi menggunakan KaTeX:
    - Kubus ($s = 10\\text{ cm}$): $s = 10\\text{ cm}$, Luas Permukaan $L = 6s^2 = 600\\text{ cm}^2$, Volume $V = s^3 = 1000\\text{ cm}^3$, Diagonal Ruang $d = s\\sqrt{3} \\approx 17{,}32\\text{ cm}$.
    - Balok ($p \\times l \\times t$): Volume $V = p \\cdot l \\cdot t$, Luas Permukaan $L = 2(pl + pt + lt)$.
    - Tabung ($r, t$): Volume $V = \\pi r^2 t$, Luas Selimut $L_s = 2\\pi r t$.
  * Ajak siswa mencoba fitur interaktif kanvas 3D di sebelah kanan: memutar 360°, mengaktifkan wireframe (rangka kawat), atau menambahkan bidang irisan penampang.

MODE 2: SOAL LATIHAN & PENURUNAN PERSAMAAN ALJABAR (ZERO-ANSWER POLICY HANYA DI SINI)
- Kebijakan Zero Answer Policy HANYA BERLAKU saat siswa memberikan soal pekerjaan rumah aljabar (contoh: "selesaikan persamaan 2x + 6 = 14", "apa nilai x?").
- Di mode ini, jangan langsung membocorkan nilai akhir $x$. Bimbing siswa menggunakan pertanyaan Sokrates terarah dan kontra-contoh aritmetika jika ada langkah logika yang keliru.

MODE 3: SALAM, CHIT-CHAT & APRESIASI SANTAI
- Jika siswa hanya menyapa ("halo", "hai", "pagi") atau memberikan pujian/apresiasi ("wah keren yaa", "kamu canggih banget"):
  * Jawablah dengan hangat dan penuh keramahan.
  * Ajak siswa berdiskusi atau menanyakan konsep matematika yang ingin dieksplorasi.
  * JANGAN mengklaim model 3D baru telah dibuat jika siswa tidak memintanya.

FORMAT PENULISAN:
- Gunakan Markdown yang rapi dan KaTeX ($...$ untuk formula sebaris, $$...$$ untuk formula blok terpisah).`;

  if (activeProblem && activeProblem.steps && activeProblem.steps.length > 0) {
    prompt += `\n\nKONTEKS CORETAN SISWA SAAT INI:
- Langkah coretan siswa: ${activeProblem.steps.map((s, i) => `#${i + 1}: ${s}`).join(" -> ")}
${activeProblem.faultLine ? `- Titik patah kesalahan logika terdeteksi di baris #${activeProblem.faultLine}` : ""}
${activeProblem.misconceptionType ? `- Tipe miskonsepsi: ${activeProblem.misconceptionType}` : ""}
${activeProblem.explanation ? `- Penjelasan galat: ${activeProblem.explanation}` : ""}
${activeProblem.counterExample?.contradiction_statement ? `- Kontra-contoh aritmetika: ${activeProblem.counterExample.contradiction_statement}` : ""}
Jadikan konteks coretan di atas sebagai rujukan utama jika siswa bertanya tentang perbaikan langkahnya.`;
  }

  if (workspaceMode === "read") {
    prompt += `\n\nMODE WORKSPACE: READ-ONLY (Hanya lakukan bimbingan Sokratik dan verifikasi matematis tanpa menulis atau memodifikasi berkas workspace).`;
  } else {
    prompt += `\n\nMODE WORKSPACE: WRITE (Anda berwenang mendraf berkas rumus, membuat skrip aljabar, dan memodifikasi catatan di workspace).`;
  }

  return prompt;
}

export async function POST(req: Request) {
  try {
    let body: ChatRequestBody;
    try {
      body = await req.json();
    } catch (jsonErr) {
      console.warn("Failed to parse request JSON in /api/chat:", jsonErr);
      return NextResponse.json(
        { error: "Format data JSON tidak valid" },
        { status: 400 }
      );
    }

    const {
      message: rawMessage,
      attachedFiles,
      conversationHistory,
      activeProblem,
      apiKey,
      mistralApiKey,
      bazaarlinkApiKey,
      claudeApiKey,
      openaiApiKey,
      nvidiaApiKey,
      customBaseUrl,
      customModelName,
      customApiKey,
      modelId,
      userName,
    } = body;

    if (!rawMessage || typeof rawMessage !== "string") {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    let message = rawMessage;
    if (attachedFiles && Array.isArray(attachedFiles) && attachedFiles.length > 0) {
      const fileContext = attachedFiles
        .filter((f) => f && f.name)
        .map((f) => `--- BERKAS TERLAMPIR: ${f.name} ---\n${(f.content || "").slice(0, 4000)}`)
        .join("\n\n");
      if (fileContext) {
        message = `${fileContext}\n\n--- PERINTAH PENGGUNA ---\n${rawMessage}`;
      }
    }

    // Deteksi Bahasa Acuan Sesi Percakapan (Anchor Language) dari 2 sampai 3 pesan awal
    const sessionLanguage = detectSessionLanguage(conversationHistory, message);

    // Prioritas Khusus: Jika pengguna meminta visualisasi/pemodelan geometri 2D atau 3D
    // Layani secara deterministik via ZAP Universal Geometry & Spatial Engine (KaTeX rapi, konfirmasi smartboard tepat dimensi)
    const resolvedGeom = resolveGeometricIntent(rawMessage, conversationHistory);
    if (resolvedGeom) {
      const engineName = resolvedGeom.dimension === "3D" ? "ChatZAP Spatial 3D Engine" : "ChatZAP Geometry Engine";
      return NextResponse.json({
        reply: sanitizeZeroAnswer(resolvedGeom.reply),
        model: engineName,
        source: resolvedGeom.dimension === "3D" ? "spatial-3d-engine" : "geometry-2d-engine",
        smartboardItem: resolvedGeom.smartboardItem,
      });
    }

    // 0. Panggil NVIDIA NIM API jika Auto-Agent atau model NVIDIA dipilih
    if (
      !modelId ||
      modelId === "auto-agent" ||
      modelId?.startsWith("nvidia") ||
      modelId === "deepseek-v4.1-flash" ||
      modelId === "poolside-laguna" ||
      modelId === "gpt-oss-20b" ||
      modelId === "gemma-4-31b-it"
    ) {
      const DEFAULT_NVIDIA_API_KEY =
        "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";
      const targetBase = "https://integrate.api.nvidia.com/v1";
      let targetModel = "nvidia/nemotron-3.5-bolt-e4b";
      let targetFriendlyName = "Auto-Agent (Nemotron-3.5 Bolt Tutor)";

      if (!modelId || modelId === "auto-agent") {
        // Nemotron-3.5 Bolt Tutor adalah tutor matematika percakapan resmi ChatZAP:
        // Sangat responsif (< 2 detik), konsisten bahasa, KaTeX rapi, dan bebas dari kebocoran draf CoT
        targetModel = "nvidia/nemotron-3.5-bolt-e4b";
        targetFriendlyName = "Auto-Agent (Nemotron-3.5 Bolt Tutor)";
      } else if (modelId === "nvidia-bolt" || modelId === "nvidia-nemotron-bolt") {
        targetModel = "nvidia/nemotron-3.5-bolt-e4b";
        targetFriendlyName = "Nemotron-3.5 Bolt Tutor";
      } else if (modelId === "nvidia-math-reasoning" || modelId === "nvidia-nemotron-reasoning") {
        targetModel = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
        targetFriendlyName = "Nemotron-3 Omni Math";
      } else if (modelId === "nvidia-spatial-vl" || modelId === "nvidia-geometry-3d") {
        targetModel = "nvidia/nemotron-3.5-super-vl-120b-a12b";
        targetFriendlyName = "Nemotron-3.5 Super-VL 120B 3D";
      } else if (modelId === "nvidia-ultra-550b" || modelId === "nvidia-deep-proof") {
        targetModel = "nvidia/nemotron-3-ultra-550b-a55b";
        targetFriendlyName = "Nemotron-3 Ultra 550B";
      } else if (modelId === "poolside-laguna" || modelId === "nvidia-code") {
        targetModel = "poolside/laguna-xs-2.1";
        targetFriendlyName = "Poolside Laguna Code";
      } else if (modelId === "nvidia-diffusiongemma") {
        targetModel = "google/diffusiongemma-26b-a4b-it";
        targetFriendlyName = "DiffusionGemma 26B";
      } else if (modelId === "nvidia-deepseek-v4" || modelId === "deepseek-v4.1-flash") {
        targetModel = "deepseek-ai/deepseek-v4.1-flash";
        targetFriendlyName = "DeepSeek V4.1";
      } else if (modelId === "nvidia-gpt-oss" || modelId === "gpt-oss-20b") {
        targetModel = "openai/gpt-oss-20b";
        targetFriendlyName = "GPT-OSS 20B";
      }

      // Pastikan hanya menggunakan kunci valid berformat 'nvapi-', fallback ke sistem jika kosong/salah
      let effectiveKey = "";
      if (nvidiaApiKey && typeof nvidiaApiKey === "string" && nvidiaApiKey.trim().startsWith("nvapi-")) {
        effectiveKey = nvidiaApiKey.trim();
      } else if (process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim().startsWith("nvapi-")) {
        effectiveKey = process.env.NVIDIA_API_KEY.trim();
      } else {
        effectiveKey = DEFAULT_NVIDIA_API_KEY;
      }

      try {
        let nvidiaRes = await callCustomOpenAIAPI(
          message,
          targetBase,
          targetModel,
          effectiveKey,
          conversationHistory,
          activeProblem,
          userName,
          22000,
          sessionLanguage,
          targetFriendlyName
        );

        // Jika kunci pengguna menghasilkan 401 atau gagal, otomatis coba dengan kunci sistem terverifikasi
        if ((!nvidiaRes.text || nvidiaRes.status === 401) && effectiveKey !== DEFAULT_NVIDIA_API_KEY) {
          console.warn("Kunci kustom NVIDIA tidak valid atau 401, mencoba dengan kunci sistem terverifikasi...");
          effectiveKey = DEFAULT_NVIDIA_API_KEY;
          nvidiaRes = await callCustomOpenAIAPI(
            message,
            targetBase,
            targetModel,
            effectiveKey,
            conversationHistory,
            activeProblem,
            userName,
            22000,
            sessionLanguage,
            targetFriendlyName
          );
        }

        // Jika model besar mengalami timeout atau error, coba fallback cepat ke nemotron-3.5-bolt-e4b
        if (!nvidiaRes.text && targetModel !== "nvidia/nemotron-3.5-bolt-e4b") {
          console.warn(`Model ${targetModel} tidak merespon, mencoba fallback cepat ke nemotron-3.5-bolt-e4b...`);
          nvidiaRes = await callCustomOpenAIAPI(
            message,
            targetBase,
            "nvidia/nemotron-3.5-bolt-e4b",
            effectiveKey,
            conversationHistory,
            activeProblem,
            userName,
            12000,
            sessionLanguage,
            "Nemotron-3.5 Bolt (Fast Fallback)"
          );
          if (nvidiaRes.text) {
            targetFriendlyName = "Nemotron-3.5 Bolt (Fast Fallback)";
          }
        }

        if (nvidiaRes.text) {
          return NextResponse.json({
            reply: sanitizeZeroAnswer(nvidiaRes.text),
            model: `${targetFriendlyName} (NVIDIA NIM)`,
            source: "nvidia-nim",
          });
        }
        if (nvidiaRes.error) {
          const socraticFallback = generateSocraticFallbackResponse(message, activeProblem);
          return NextResponse.json({
            reply: `⚠️ **Catatan NVIDIA NIM API:**\n${nvidiaRes.error}\n\n*Periksa kembali NVIDIA API Key kamu di menu Connector.*\n\n---\n\n${socraticFallback}`,
            model: "Local Socratic (NVIDIA Warning)",
            source: "fallback-with-warning",
          });
        }
      } catch (err) {
        console.warn("NVIDIA NIM call failed:", err);
      }
    }

    // 1. Panggil Custom Model API (Ollama / vLLM / LMStudio / Proxy)
    if (modelId === "custom-api") {
      const targetBase = customBaseUrl?.trim() || "http://localhost:11434/v1";
      const targetModel = customModelName?.trim() || "llama3.3";
      try {
        const customRes = await callCustomOpenAIAPI(
          message,
          targetBase,
          targetModel,
          customApiKey || apiKey,
          conversationHistory,
          activeProblem,
          userName,
          12000,
          sessionLanguage
        );

        if (customRes.text) {
          return NextResponse.json({
            reply: sanitizeZeroAnswer(customRes.text),
            model: customRes.modelUsed || "Custom Model API",
            source: "custom-api",
          });
        }
        if (customRes.error) {
          const socraticFallback = generateSocraticFallbackResponse(message, activeProblem);
          return NextResponse.json({
            reply: `⚠️ **Gagal terhubung ke Custom Model (${targetBase}):**\n${customRes.error}\n\n*Sementara ini asisten lokal ZAP menjawab pertanyaanmu:*\n\n---\n\n${socraticFallback}`,
            model: "Local Socratic (Custom API Warning)",
            source: "fallback-with-warning",
          });
        }
      } catch (err) {
        console.warn("Custom API call failed:", err);
      }
    }

    // 2. Panggil Anthropic Claude API jika dipilih
    if (modelId?.startsWith("claude")) {
      const effectiveClaudeKey =
        claudeApiKey?.trim() ||
        apiKey?.trim() ||
        process.env.ANTHROPIC_API_KEY?.trim() ||
        "";

      if (effectiveClaudeKey) {
        try {
          const claudeRes = await callClaudeAPI(
            message,
            effectiveClaudeKey,
            conversationHistory,
            activeProblem,
            modelId,
            userName,
            sessionLanguage
          );
          if (claudeRes.text) {
            return NextResponse.json({
              reply: sanitizeZeroAnswer(claudeRes.text),
              model: `${claudeRes.modelUsed || "Claude"} (Anthropic API)`,
              source: "claude-api",
            });
          }
          if (claudeRes.error) {
            const socraticFallback = generateSocraticFallbackResponse(message, activeProblem);
            return NextResponse.json({
              reply: `⚠️ **Catatan Anthropic Claude API (Status ${claudeRes.status || 400}):**\n${claudeRes.error}\n\n*Periksa kembali API Key kamu di menu model.*  \n*Sementara ini asisten lokal ZAP menjawab di bawah:*\n\n---\n\n${socraticFallback}`,
              model: "Local Socratic (Claude Warning)",
              source: "fallback-with-warning",
            });
          }
        } catch (err) {
          console.warn("Claude API call failed:", err);
        }
      } else {
        const socraticFallback = generateSocraticFallbackResponse(message, activeProblem);
        return NextResponse.json({
          reply: `ℹ️ **Kunci Anthropic Claude Belum Diatur:**\nMasukkan Anthropic API Key kamu pada menu pemilih model (klik tombol model di bawah), atau dapatkan di [console.anthropic.com](https://console.anthropic.com).\n\n*Sementara ini asisten Sokratik ZAP menjawab:*\n\n---\n\n${socraticFallback}`,
          model: "Claude (Local Preview)",
          source: "local-preview-no-key",
        });
      }
    }

    // 3. Panggil OpenAI ChatGPT API jika dipilih
    if (modelId?.startsWith("gpt") || modelId?.startsWith("o1") || modelId?.startsWith("o3")) {
      // Prioritaskan API Key OpenAI resmi jika ada
      let realOpenaiKey = "";
      if (openaiApiKey?.trim() && !openaiApiKey.trim().startsWith("sk-proj-chatgpt-account-")) {
        realOpenaiKey = openaiApiKey.trim();
      } else if (apiKey?.trim() && apiKey.trim().startsWith("sk-") && !apiKey.trim().startsWith("sk-proj-chatgpt-account-")) {
        realOpenaiKey = apiKey.trim();
      } else if (process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_API_KEY.trim().startsWith("sk-")) {
        realOpenaiKey = process.env.OPENAI_API_KEY.trim();
      }

      // 3a. Panggil langsung API resmi OpenAI jika kunci resmi tersedia
      if (realOpenaiKey) {
        try {
          const openaiRes = await callOpenAIAPI(
            message,
            realOpenaiKey,
            conversationHistory,
            activeProblem,
            modelId,
            userName,
            sessionLanguage
          );
          if (openaiRes.text) {
            return NextResponse.json({
              reply: sanitizeZeroAnswer(openaiRes.text),
              model: `${openaiRes.modelUsed || "GPT-4o"} (OpenAI API)`,
              source: "openai-api",
            });
          }
          if (openaiRes.error) {
            const socraticFallback = generateSocraticFallbackResponse(message, activeProblem);
            return NextResponse.json({
              reply: `⚠️ **Catatan OpenAI API (Status ${openaiRes.status || 400}):**\n${openaiRes.error}\n\n*Periksa kembali OpenAI API Key kamu di menu model.*  \n*Sementara ini asisten lokal ZAP menjawab di bawah:*\n\n---\n\n${socraticFallback}`,
              model: "Local Socratic (OpenAI Warning)",
              source: "fallback-with-warning",
            });
          }
        } catch (err) {
          console.warn("OpenAI API call failed:", err);
        }
      }

      // 3b. Jika akun ChatGPT terhubung via SSO/sesi (tanpa direct billing key),
      // layani lewat gateway dengan persona GPT-4o yang konsisten tanpa membocorkan backend proxy
      const effectiveOpenaiKey = openaiApiKey?.trim() || apiKey?.trim() || "";
      if (effectiveOpenaiKey.startsWith("sk-proj-chatgpt-account-")) {
        const bazaarKey =
          bazaarlinkApiKey?.trim() ||
          process.env.BAZAARLINK_API_KEY ||
          "";
        try {
          const persona = modelId === "gpt-4o-mini" ? "GPT-4o Mini" : "GPT-4o Omni";
          const bazaarRes = await callBazaarLinkAPI(
            message,
            bazaarKey,
            conversationHistory,
            activeProblem,
            "bazaarlink-deepseek",
            userName,
            persona,
            sessionLanguage
          );
          if (bazaarRes.text) {
            return NextResponse.json({
              reply: sanitizeZeroAnswer(bazaarRes.text),
              model: `${persona} (Akun ChatGPT Terhubung)`,
              source: "chatgpt-account-gateway",
            });
          }
        } catch (err) {
          console.warn("ChatGPT account gateway failed:", err);
        }
      }

      // 3c. Jika kunci belum diatur sama sekali
      const socraticFallback = generateSocraticFallbackResponse(message, activeProblem);
      return NextResponse.json({
        reply: `ℹ️ **Kunci OpenAI ChatGPT Belum Diatur:**\nMasukkan OpenAI API Key kamu pada menu pemilih model (klik tombol model di bawah), atau dapatkan di [platform.openai.com](https://platform.openai.com).\n\n*Sementara ini asisten Sokratik ZAP menjawab:*\n\n---\n\n${socraticFallback}`,
        model: "ChatGPT (Local Preview)",
        source: "local-preview-no-key",
      });
    }

    const isBazaarLink = modelId?.startsWith("bazaarlink") || modelId?.startsWith("deepseek");

    // 1. Panggil BazaarLink AI Gateway (DeepSeek, Qwen, Auto Free Router) jika dipilih
    if (isBazaarLink) {
      const effectiveBazaarLinkKey =
        bazaarlinkApiKey?.trim() ||
        (isBazaarLink ? apiKey?.trim() : "") ||
        process.env.BAZAARLINK_API_KEY?.trim() ||
        "";

      try {
        const blResult = await callBazaarLinkAPI(
          message,
          effectiveBazaarLinkKey,
          conversationHistory,
          activeProblem,
          modelId,
          userName
        );

        if (blResult.text) {
          const guardedReply = sanitizeZeroAnswer(blResult.text);
          return NextResponse.json({
            reply: guardedReply,
            model: `${blResult.modelUsed || "BazaarLink AI Gateway"}`,
            source: "bazaarlink-api",
          });
        }

        if (blResult.error) {
          console.warn("BazaarLink API returned error:", blResult);
          const socraticFallback = generateSocraticFallbackResponse(message, activeProblem);
          return NextResponse.json({
            reply: `⚠️ **Catatan Koneksi BazaarLink API (Status ${blResult.status || 400}):**\n${blResult.error}\n\n*Jika saldo kredit $0, pilih model tier gratis (:free) seperti BazaarLink Auto, DeepSeek V4, atau Qwen 3.7.*  \n*Sementara ini, asisten lokal kami menjawab pertanyaanmu di bawah:*\n\n---\n\n${socraticFallback}`,
            model: "Local Socratic (BazaarLink Warning)",
            source: "fallback-with-warning",
          });
        }
      } catch (blError) {
        console.warn("BazaarLink API call failed with exception:", blError);
      }
    }

    const isMistral = modelId?.startsWith("codestral") || modelId?.startsWith("mistral");

    // 2. Panggil Mistral AI (Codestral 22B / Mistral Large) jika dipilih
    if (isMistral) {
      const effectiveMistralKey =
        mistralApiKey?.trim() ||
        (isMistral ? apiKey?.trim() : "") ||
        process.env.MISTRAL_API_KEY?.trim() ||
        "";

      if (effectiveMistralKey) {
        try {
          const mistralResult = await callMistralAPI(
            message,
            effectiveMistralKey,
            conversationHistory,
            activeProblem,
            modelId,
            userName,
            sessionLanguage
          );

          if (mistralResult.text) {
            const guardedReply = sanitizeZeroAnswer(mistralResult.text);
            return NextResponse.json({
              reply: guardedReply,
              model: `${mistralResult.modelUsed || "Codestral 22B"} (Mistral Cloud API)`,
              source: "mistral-api",
            });
          }

          if (mistralResult.error) {
            console.warn("Mistral API returned error:", mistralResult);
            const socraticFallback = generateSocraticFallbackResponse(message, activeProblem);
            return NextResponse.json({
              reply: `⚠️ **Catatan Koneksi Mistral AI API (Status ${mistralResult.status || 400}):**\n${mistralResult.error}\n\n*Periksa kembali API Key kamu di menu model (kanan atas) atau buat kunci baru di [Mistral Console](https://console.mistral.ai).*  \n*Sementara ini, asisten lokal kami menjawab pertanyaanmu di bawah:*\n\n---\n\n${socraticFallback}`,
              model: "Local Socratic (Mistral API Warning)",
              source: "fallback-with-warning",
            });
          }
        } catch (mistralError) {
          console.warn("Mistral API call failed with exception:", mistralError);
        }
      } else {
        // Model Mistral dipilih tapi API Key belum diisi
        const socraticFallback = generateSocraticFallbackResponse(message, activeProblem);
        const modelLabel = modelId?.includes("large") ? "Mistral Large" : "Codestral 22B";
        return NextResponse.json({
          reply: `ℹ️ **Kunci Mistral AI (${modelLabel}) Belum Diatur:**\nKamu memilih model **${modelLabel}**, tetapi API Key belum dimasukkan.\n\nSilakan masukkan Mistral API Key pada menu pemilih model di samping tombol kirim (atau tambahkan di file \`frontend/.env.local\` sebagai \`MISTRAL_API_KEY\`). Kamu bisa mendapatkannya secara gratis di [console.mistral.ai](https://console.mistral.ai).\n\n*Sementara ini, asisten Sokratik lokal ZAP menjawab pertanyaanmu:*\n\n---\n\n${socraticFallback}`,
          model: `${modelLabel} (Local Preview)`,
          source: "local-preview-no-key",
        });
      }
    }

    const effectiveApiKey =
      apiKey?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      "";

    // 2. Panggil Google Gemini API Asli (Prioritas Utama jika API Key tersedia)
    if (effectiveApiKey && modelId !== "sympy-cfl") {
      try {
        const geminiResult = await callGeminiAPI(
          message,
          effectiveApiKey,
          conversationHistory,
          activeProblem,
          modelId,
          userName,
          sessionLanguage
        );
        
        if (geminiResult.text) {
          const guardedReply = sanitizeZeroAnswer(geminiResult.text);
          return NextResponse.json({
            reply: guardedReply,
            model: `${geminiResult.modelUsed || "Gemini 2.0 Flash"} (Google Cloud API)`,
            source: "gemini-api",
          });
        }

        // Jika API Key diberikan tetapi Google API mengembalikan error eksplisit (misal: 400 Invalid Key / 403 / 429)
        if (geminiResult.error) {
          console.warn("Gemini API returned error:", geminiResult);
          const socraticFallback = generateSocraticFallbackResponse(message, activeProblem);
          
          return NextResponse.json({
            reply: `⚠️ **Catatan Koneksi Google Gemini API (Status ${geminiResult.status || 400}):**\n${geminiResult.error}\n\n*Periksa kembali API Key kamu di menu model (kanan atas) atau buat kunci baru di [Google AI Studio](https://aistudio.google.com).*  \n*Sementara ini, asisten lokal kami menjawab pertanyaanmu di bawah:*\n\n---\n\n${socraticFallback}`,
            model: "Local Socratic (API Warning)",
            source: "fallback-with-warning",
          });
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed with exception:", geminiError);
      }
    }

    // 2. Jika pengguna memilih mesin SymPy lokal, langsung gunakan respons instan (0 ms latency)
    if (modelId === "sympy-cfl") {
      const socraticReply = generateSocraticFallbackResponse(message, activeProblem);
      return NextResponse.json({
        reply: socraticReply,
        model: "SymPy CFL Engine (Local Deterministic 0ms)",
        source: "local-sympy",
      });
    }

    // 2b. Model platform bawaan server (opsional, diatur lewat env):
    // Bila tidak ada kunci Gemini dan server dikonfigurasi dengan endpoint
    // kompatibel OpenAI (mis. DeepSeek lewat NVIDIA NIM), layani chat dari sana.
    const platformBase = process.env.ZAP_PLATFORM_LLM_BASE_URL?.trim();
    const platformModel = process.env.ZAP_PLATFORM_LLM_MODEL?.trim();
    const platformKey = process.env.ZAP_PLATFORM_LLM_API_KEY?.trim();
    if (platformBase && platformModel && platformKey) {
      try {
        const platformRes = await callCustomOpenAIAPI(
          message,
          platformBase,
          platformModel,
          platformKey,
          conversationHistory,
          activeProblem,
          userName,
          90000,
          sessionLanguage
        );
        if (platformRes.text) {
          return NextResponse.json({
            reply: sanitizeZeroAnswer(platformRes.text),
            model: platformRes.modelUsed || platformModel,
            source: "platform-llm",
          });
        }
        console.warn("Platform LLM returned error:", platformRes.error);
      } catch (platformErr) {
        console.warn("Platform LLM call failed:", platformErr);
      }
    }

    // 3. Fallback Offline: Gunakan Built-in Socratic Cognitive Agent
    const socraticReply = generateSocraticFallbackResponse(message, activeProblem);

    return NextResponse.json({
      reply: socraticReply,
      model: "ZAP Socratic Engine (Local Offline)",
      source: "built-in-socratic",
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada layanan obrolan" },
      { status: 500 }
    );
  }
}

// Cache nama model resmi yang terbukti sukses dan aktif di akun API Key ini
let cachedWorkingModel: string | null = null;

/**
 * Panggilan ultra-cepat ke Google Gemini REST API (v1beta).
 * Mendukung memori percakapan (multi-turn conversationHistory),
 * deteksi otomatis model resmi via ListModels,
 * serta failover dengan batas timeout ketat (< 5 detik) agar bebas dari error 404.
 */
async function callGeminiAPI(
  userMessage: string,
  apiKey: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  activeProblem?: ActiveProblemContext | null,
  modelId?: string,
  userName?: string,
  sessionLanguage: string = "Bahasa Indonesia"
): Promise<GeminiCallResult> {
  const studentName = userName?.trim() || "Siswa";
  const systemInstructionText = buildZAPSystemPrompt(
    studentName,
    activeProblem,
    "Google Gemini 2.0 Flash",
    sessionLanguage
  );

  // 1. Konstruksi Riwayat Percakapan (Memory) Sesuai Spesifikasi Google Gemini API
  const contents: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];

  if (conversationHistory && conversationHistory.length > 0) {
    // Ambil hingga 20 turn terakhir untuk keseimbangan konteks & kecepatan
    const recentHistory = conversationHistory.slice(-20);
    for (const turn of recentHistory) {
      const geminiRole: "user" | "model" = turn.role === "assistant" ? "model" : "user";
      const text = turn.content?.trim();
      if (!text) continue;

      if (contents.length > 0 && contents[contents.length - 1].role === geminiRole) {
        // Gabungkan pesan berurutan dengan role sama
        contents[contents.length - 1].parts[0].text += "\n" + text;
      } else {
        contents.push({ role: geminiRole, parts: [{ text }] });
      }
    }
  }

  // Tambahkan userMessage terakhir
  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts[0].text += "\n" + userMessage;
  } else {
    contents.push({ role: "user", parts: [{ text: userMessage }] });
  }

  // Gemini API mewajibkan pesan pertama selalu ber-role 'user'
  while (contents.length > 0 && contents[0].role !== "user") {
    contents.shift();
  }

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstructionText }],
    },
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800, // Cukup leluasa untuk penjelasan cerdas & mendalam
    },
  };

  // Helper pemanggil model tunggal dengan batas timeout 5s
  const invokeModel = async (
    modelName: string
  ): Promise<{ success: boolean; text?: string; error?: string; status?: number }> => {
    const clean = modelName.replace(/^models\//, "");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${clean}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          cachedWorkingModel = clean;
          return { success: true, text: candidate };
        }
      }

      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
      return { success: false, error: errMsg, status: res.status };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        status: 500,
      };
    }
  };

  // 2. Jalur Cepat: Coba langsung model yang diminta atau model yang sudah terbukti sukses
  const fastCandidate =
    modelId === "gemini-1.5-pro"
      ? "gemini-1.5-pro"
      : modelId === "gemini-1.5-flash"
      ? "gemini-1.5-flash"
      : cachedWorkingModel || (modelId === "gemini-2.0-flash" ? "gemini-2.0-flash" : "gemini-1.5-flash");

  const fastAttempt = await invokeModel(fastCandidate);
  if (fastAttempt.success && fastAttempt.text) {
    return { text: fastAttempt.text, modelUsed: fastCandidate };
  }

  // Jika error adalah API key invalid (400 / 403), langsung laporkan tanpa buang waktu
  if (fastAttempt.status === 400 || fastAttempt.status === 403) {
    return { error: fastAttempt.error, status: fastAttempt.status, modelUsed: fastCandidate };
  }

  // 3. Jalur Adaptif: Jika 404 (nama model tidak cocok di akun ini), tanya langsung ke Google AI Studio daftar model resminya
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: "GET",
        headers: { "x-goog-api-key": apiKey },
        signal: AbortSignal.timeout(4000),
      }
    );

    if (listRes.ok) {
      const listData = await listRes.json();
      const modelsList: Array<{ name: string; supportedGenerationMethods?: string[] }> =
        listData?.models || [];

      // Filter hanya model yang mendukung generateContent
      const supported = modelsList.filter((m) =>
        m.supportedGenerationMethods?.includes("generateContent")
      );

      // Urutkan prioritas model teks murni: 2.0-flash -> 1.5-flash -> 1.5-pro
      const scored = supported.map((m) => {
        let score = 0;
        const n = m.name.toLowerCase();
        if (n.includes("2.0-flash")) score += 50;
        else if (n.includes("1.5-flash")) score += 40;
        else if (n.includes("1.5-pro")) score += 20;
        return { name: m.name, score };
      });
      scored.sort((a, b) => b.score - a.score);

      for (const item of scored) {
        const attempt = await invokeModel(item.name);
        if (attempt.success && attempt.text) {
          return { text: attempt.text, modelUsed: item.name.replace(/^models\//, "") };
        }
      }
    }
  } catch (listErr) {
    console.warn("Dynamic model discovery failed:", listErr);
  }

  // Fallback terakhir: coba gemini-1.5-flash
  const finalAttempt = await invokeModel("gemini-1.5-flash");
  if (finalAttempt.success && finalAttempt.text) {
    return { text: finalAttempt.text, modelUsed: "gemini-1.5-flash" };
  }

  return {
    error: fastAttempt.error || finalAttempt.error || "Tidak dapat menghasilkan respon dari model Gemini",
    status: fastAttempt.status || 500,
  };
}

/**
 * Panggilan ke Mistral AI Chat Completion REST API (Codestral 22B / Mistral Large).
 * Mendukung multi-turn chat memory, failover endpoint codestral.mistral.ai,
 * serta integrasi penjagaan Zero-Answer Policy.
 */
async function callMistralAPI(
  userMessage: string,
  apiKey: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  activeProblem?: ActiveProblemContext | null,
  modelId?: string,
  userName?: string,
  sessionLanguage: string = "Bahasa Indonesia"
): Promise<MistralCallResult> {
  const studentName = userName?.trim() || "Siswa";
  const targetModel =
    modelId === "mistral-large-latest" || modelId === "mistral-large"
      ? "mistral-large-latest"
      : "codestral-latest";

  const systemInstructionText = buildZAPSystemPrompt(
    studentName,
    activeProblem,
    targetModel.includes("codestral") ? "Mistral Codestral 22B" : "Mistral Large",
    sessionLanguage
  );

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemInstructionText },
  ];

  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-20);
    for (const turn of recentHistory) {
      const text = turn.content?.trim();
      if (!text) continue;
      messages.push({
        role: turn.role === "assistant" ? "assistant" : "user",
        content: text,
      });
    }
  }

  messages.push({
    role: "user",
    content: userMessage,
  });

  const payload = {
    model: targetModel,
    messages: messages,
    temperature: 0.7,
    max_tokens: 800,
  };

  const endpoints = [
    "https://api.mistral.ai/v1/chat/completions",
  ];
  if (targetModel.includes("codestral")) {
    endpoints.push("https://codestral.mistral.ai/v1/chat/completions");
  }

  let lastError = "";
  let lastStatus = 500;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(7000),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data?.choices?.[0]?.message?.content;
        if (candidate) {
          return {
            text: candidate,
            modelUsed: targetModel.includes("codestral") ? "Codestral 22B" : "Mistral Large",
          };
        }
      }

      const errJson = await res.json().catch(() => null);
      lastStatus = res.status;
      lastError = errJson?.message || errJson?.error?.message || `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403) {
        return { error: lastError, status: lastStatus, modelUsed: targetModel };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      lastStatus = 500;
    }
  }

  return {
    error: lastError || "Tidak dapat menghasilkan respon dari Mistral AI API",
    status: lastStatus,
    modelUsed: targetModel,
  };
}

/**
 * Panggilan ke BazaarLink AI Gateway (OpenAI-compatible).
 * Mendukung Auto Router gratis, DeepSeek V4 Flash, dan Qwen 3.7.
 */
async function callBazaarLinkAPI(
  userMessage: string,
  apiKey: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  activeProblem?: ActiveProblemContext | null,
  modelId?: string,
  userName?: string,
  overridePersona?: string,
  sessionLanguage: string = "Bahasa Indonesia"
): Promise<BazaarLinkCallResult> {
  const studentName = userName?.trim() || "Siswa";

  let targetModel = "auto:free";
  let defaultPersona = "ChatZAP Smart Router";
  if (modelId === "bazaarlink-deepseek") {
    targetModel = "deepseek/deepseek-v4-flash-0731free:free";
    defaultPersona = "DeepSeek V4 Flash";
  } else if (modelId === "bazaarlink-qwen") {
    targetModel = "qwen/qwen3.7-flash:free";
    defaultPersona = "Qwen 3.7 Flash";
  } else if (modelId === "bazaarlink-auto") {
    targetModel = "auto:free";
    defaultPersona = "ChatZAP Smart Router";
  }

  const effectivePersona = overridePersona || defaultPersona;

  const systemInstructionText = buildZAPSystemPrompt(
    studentName,
    activeProblem,
    effectivePersona,
    sessionLanguage
  );

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemInstructionText },
  ];

  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-20);
    for (const turn of recentHistory) {
      const text = turn.content?.trim();
      if (!text) continue;
      messages.push({
        role: turn.role === "assistant" ? "assistant" : "user",
        content: text,
      });
    }
  }

  messages.push({
    role: "user",
    content: userMessage,
  });

  const payload = {
    model: targetModel,
    messages: messages,
    temperature: 0.7,
    max_tokens: 800,
  };

  try {
    const res = await fetch("https://api.bazaarlink.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      const choice = data?.choices?.[0];
      const text = choice?.message?.content;
      const modelReturned = data?.model || targetModel;
      if (text) {
        let label = "BazaarLink Smart Router";
        if (modelReturned.includes("deepseek")) {
          label = "DeepSeek V4 (BazaarLink Free)";
        } else if (modelReturned.includes("qwen")) {
          label = "Qwen 3.7 Flash (BazaarLink Free)";
        }
        return {
          text,
          modelUsed: label,
        };
      }
    }

    const errJson = await res.json().catch(() => null);
    const errMsg = errJson?.error?.message || errJson?.message || `HTTP ${res.status}`;
    return {
      error: errMsg,
      status: res.status,
      modelUsed: targetModel,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      status: 500,
      modelUsed: targetModel,
    };
  }
}

/**
 * Panggilan ke Anthropic Messages API (Claude 3.7 / 3.5 Sonnet).
 */
async function callClaudeAPI(
  userMessage: string,
  apiKey: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  activeProblem?: ActiveProblemContext | null,
  modelId?: string,
  userName?: string,
  sessionLanguage: string = "Bahasa Indonesia"
): Promise<UniversalCallResult> {
  const studentName = userName?.trim() || "Siswa";
  const targetModel =
    modelId === "claude-3-7-sonnet"
      ? "claude-3-7-sonnet-20250219"
      : "claude-3-5-sonnet-20241022";

  const persona = targetModel.includes("3-7") ? "Claude 3.7 Sonnet" : "Claude 3.5 Sonnet";
  const systemInstructionText = buildZAPSystemPrompt(
    studentName,
    activeProblem,
    persona,
    sessionLanguage
  );

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  if (conversationHistory && conversationHistory.length > 0) {
    for (const turn of conversationHistory.slice(-20)) {
      if (turn.content?.trim()) {
        messages.push({ role: turn.role, content: turn.content.trim() });
      }
    }
  }
  messages.push({ role: "user", content: userMessage });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey.trim(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: targetModel,
        system: systemInstructionText,
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.content?.[0]?.text;
      if (text) {
        return { text, modelUsed: targetModel.includes("3-7") ? "Claude 3.7 Sonnet" : "Claude 3.5 Sonnet" };
      }
    }

    const errJson = await res.json().catch(() => null);
    return {
      error: errJson?.error?.message || `HTTP ${res.status}`,
      status: res.status,
      modelUsed: targetModel,
    };
  } catch (err) {
    return { error: String(err), status: 500, modelUsed: targetModel };
  }
}

/**
 * Panggilan ke OpenAI API (GPT-4o / GPT-4o-mini).
 */
async function callOpenAIAPI(
  userMessage: string,
  apiKey: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  activeProblem?: ActiveProblemContext | null,
  modelId?: string,
  userName?: string,
  sessionLanguage: string = "Bahasa Indonesia"
): Promise<UniversalCallResult> {
  const studentName = userName?.trim() || "Siswa";
  const targetModel = modelId === "gpt-4o-mini" ? "gpt-4o-mini" : "gpt-4o";

  const persona = targetModel === "gpt-4o-mini" ? "GPT-4o Mini" : "GPT-4o Omni";
  const systemInstructionText = buildZAPSystemPrompt(
    studentName,
    activeProblem,
    persona,
    sessionLanguage
  );

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemInstructionText },
  ];
  if (conversationHistory && conversationHistory.length > 0) {
    for (const turn of conversationHistory.slice(-20)) {
      if (turn.content?.trim()) {
        messages.push({ role: turn.role, content: turn.content.trim() });
      }
    }
  }
  messages.push({ role: "user", content: userMessage });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        return { text, modelUsed: targetModel.toUpperCase() };
      }
    }

    const errJson = await res.json().catch(() => null);
    return {
      error: errJson?.error?.message || `HTTP ${res.status}`,
      status: res.status,
      modelUsed: targetModel,
    };
  } catch (err) {
    return { error: String(err), status: 500, modelUsed: targetModel };
  }
}

/**
 * Panggilan ke Custom Model API (OpenAI-Compatible endpoint: Ollama, vLLM, LMStudio, Proxy).
 */
async function callCustomOpenAIAPI(
  userMessage: string,
  baseUrl: string,
  modelName: string,
  apiKey?: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  activeProblem?: ActiveProblemContext | null,
  userName?: string,
  timeoutMs: number = 12000,
  sessionLanguage: string = "Bahasa Indonesia",
  displayName?: string
): Promise<UniversalCallResult> {
  const studentName = userName?.trim() || "Siswa";
  const cleanBase = (baseUrl || "http://localhost:11434/v1").replace(/\/+$/, "");
  const targetUrl = cleanBase.endsWith("/chat/completions") ? cleanBase : `${cleanBase}/chat/completions`;
  const targetModel = modelName?.trim() || "default";

  const systemInstructionText = buildZAPSystemPrompt(
    studentName,
    activeProblem,
    displayName || targetModel,
    sessionLanguage
  );

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemInstructionText },
  ];
  if (conversationHistory && conversationHistory.length > 0) {
    for (const turn of conversationHistory.slice(-20)) {
      if (turn.content?.trim()) {
        messages.push({ role: turn.role, content: turn.content.trim() });
      }
    }
  }
  messages.push({ role: "user", content: userMessage });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey?.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages,
        temperature: 0.6,
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.ok) {
      const data = await res.json();
      const choice = data?.choices?.[0];
      const msg = choice?.message;
      let text = msg?.content;
      if (!text && msg?.reasoning_content) {
        text = cleanModelResponse(msg.reasoning_content);
      } else if (text) {
        text = cleanModelResponse(text);
      }
      if (text && !text.endsWith("Let's draft:") && text.trim().length > 0) {
        return { text, modelUsed: targetModel };
      }
      return {
        error: "Respons model kosong",
        status: 200,
        modelUsed: targetModel,
      };
    }

    const errJson = await res.json().catch(() => null);
    return {
      error: errJson?.error?.message || errJson?.message || `HTTP ${res.status}`,
      status: res.status,
      modelUsed: targetModel,
    };
  } catch (err) {
    return { error: String(err), status: 500, modelUsed: targetModel };
  }
}



/**
 * Built-in Socratic Cognitive Agent
 * Memberikan respons cerdas dan kontekstual secara lokal tanpa dependensi eksternal
 */
function generateSocraticFallbackResponse(
  message: string,
  activeProblem?: ActiveProblemContext | null
): string {
  const lower = message.toLowerCase().trim();

  // 0. PERMINTAAN VISUALISASI / RUMUS GEOMETRI (BALOK, KUBUS, TABUNG)
  if (lower.includes("balok")) {
    return `Halo! Berikut adalah rumus-rumus penting untuk bangun ruang **Balok** (prisma segiempat):

Misalkan ukuran rusuk balok adalah:
- Panjang = $p$
- Lebar = $l$
- Tinggi = $t$

---

### 1. Volume Balok ($V$)
Menghitung seberapa banyak ruang isi di dalam balok:
$$ V = p \\times l \\times t $$

### 2. Luas Permukaan Balok ($L$)
Jumlah total luas dari ke-6 bidang sisi persegi panjangnya:
$$ L = 2(pl + pt + lt) $$

### 3. Panjang Diagonal Ruang ($d$)
Garis lurus terjauh yang menghubungkan dua sudut berlawanan melintasi ruang balok:
$$ d = \\sqrt{p^2 + l^2 + t^2} $$

### 4. Keliling Rangka / Total Panjang Rusuk ($K$)
Panjang total kawat yang dibutuhkan untuk membentuk kerangka balok:
$$ K = 4(p + l + t) $$

---
Apakah kamu ingin memvisualisasikan model Balok 3D di Papan Tulis Pintar, atau ada soal latihan balok yang ingin kamu selesaikan bersama?`;
  }

  const isGeometryRequest =
    /\b(kubus|cube|balok|tabung|cylinder|silinder|kerucut|cone|bola|sphere|prisma|limas|parabola|pelana)\b/i.test(lower) &&
    /\b(buatkan|buat|bikin|tampilkan|gambarkan|gambar|visualisasikan|render|3d|ukuran|sisi|rusuk|panjang|jari-jari|rumus)\b/i.test(lower);

  if (isGeometryRequest) {
    if (lower.includes("kubus") || lower.includes("cube")) {
      const numMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:cm|m|mm)?/);
      const s = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : 10;
      const vol = Math.pow(s, 3);
      const lp = 6 * Math.pow(s, 2);
      const dr = (s * Math.sqrt(3)).toFixed(2);
      return `Halo! Berikut adalah sifat matematis dan rumus geometri ruang untuk **Kubus** (panjang sisi $s = ${s}\\text{ cm}$):

- **Panjang Sisi ($s$):** $${s}\\text{ cm}$
- **Luas Permukaan ($L$):** $6 \\times s^2 = 6 \\times (${s})^2 = ${lp}\\text{ cm}^2$
- **Volume ($V$):** $s^3 = (${s})^3 = ${vol}\\text{ cm}^3$
- **Diagonal Ruang ($d_r$):** $s\\sqrt{3} \\approx ${dr}\\text{ cm}$

Silakan berinteraksi dengan kanvas 3D di samping atau ketik *"buatkan 3d cube"* jika ingin melihat visualisasi ruangnya!`;
    }
    if (lower.includes("tabung") || lower.includes("cylinder") || lower.includes("silinder")) {
      return `Tentu! Model **Tabung Silinder 3D** memiliki rumus volume $V = \\pi r^2 t$ dan luas selimut $L_s = 2\\pi r t$. Ketik *"buatkan tabung r=7 t=12"* untuk melihat simulasi 3D di Papan Tulis Pintar!`;
    }
  }

  // 1. DEFINISI & KONSEP ALJABAR
  const isAskingAlgebraDefinition =
    lower.includes("apa itu aljabar") ||
    lower.includes("aljabar itu apa") ||
    lower.includes("arti aljabar") ||
    lower.includes("maksud aljabar") ||
    lower.includes("kenapa belajar aljabar") ||
    lower === "aljabar";

  if (isAskingAlgebraDefinition) {
    return `**Aljabar** adalah cabang matematika yang menggunakan simbol atau huruf (seperti $x$, $y$, $a$, $b$) untuk mewakili angka atau kuantitas yang belum diketahui (*variabel*).

**Mengapa Aljabar Sangat Penting?**
1. **Menemukan Nilai yang Belum Diketahui:** Aljabar membantu kita menyelesaikan teka-teki kuantitatif secara sistematis, misalnya: $2x + 4 = 10 \\implies x = 3$.
2. **Merumuskan Pola & Hukum Umum:** Alih-alih menghitung satu per satu, kita bisa merumuskan hubungan umum seperti ekspansi kuadrat $(a + b)^2 = a^2 + 2ab + b^2$.
3. **Fondasi Sains & Teknologi:** Dunia kecerdasan buatan, pemrograman, grafika komputer, hingga rumus fisika modern semuanya dirancang menggunakan bahasa aljabar.

Apakah ada topik aljabar tertentu yang ingin kamu pelajari (seperti faktorisasi, kuadrat sempurna, atau pindah ruas)? Atau kamu ingin menguji langkah coretan rumus yang sedang kamu hitung?`;
  }

  // 2. SAPAAN & INTERAKSI AWAL
  const isGreeting =
    /^(hai|halo|pagi|siang|malam|sore|assalamu|permisi|tes|ping|woi|hei|hi|hello)/.test(lower) ||
    lower === "hai" ||
    lower === "halo";

  const isAskPermission =
    lower.includes("mau nanya") ||
    lower.includes("bisa nanya") ||
    lower.includes("nanya dong") ||
    lower.includes("mau tanya") ||
    lower.includes("boleh tanya") ||
    lower === "tanya";

  if (isGreeting || isAskPermission) {
    if (activeProblem && activeProblem.steps && activeProblem.steps.length > 0) {
      const firstStep = activeProblem.steps[0];
      return `Halo! Tentu saja, mau nanya tentang apa? Apakah terkait penurunan aljabar $${firstStep}$ yang sedang kita bahas, atau ada konsep lain yang membingungkanmu? Tanyakan saja!`;
    }
    return `Halo! Aku ZAP, asisten diagnostik aljabar kamu. Ada konsep matematika atau langkah penurunan rumus yang ingin kamu tanyakan atau uji bersama? Kamu bisa bertanya bebas atau langsung memasukkan baris aljabar coretanmu!`;
  }

  // 3. PERTANYAAN TENTANG KESALAHAN ("Kenapa salah?", "Kenapa baris 2?")
  const isAskingWhyWrong =
    lower.includes("kenapa salah") ||
    lower.includes("salahnya di mana") ||
    lower.includes("kenapa baris") ||
    lower.includes("kok salah") ||
    lower.includes("kenapa ga sama") ||
    lower.includes("kenapa beda") ||
    lower.includes("mengapa salah") ||
    lower.includes("dimana salahnya");

  if (isAskingWhyWrong) {
    if (activeProblem?.misconceptionType === "DISTRIBUTIVE_EXPANSION_ILLUSION" || activeProblem?.faultLine === 2) {
      return `Di baris ke-2, kamu mengekspansi $(x + 3)^2$ menjadi $x^2 + 9$. 

Kesalahan umum di sini adalah mengira tanda kuadrat dapat langsung didistribusikan ke masing-masing suku (seperti $(a+b)^2 = a^2 + b^2$). Padahal arti kuadrat adalah mengalikan suku tersebut dengan dirinya sendiri:
$$ (x + 3)^2 = (x + 3)(x + 3) $$

Jika dikalikan suku-demi-suku secara distributif (skema pelangi):
1. $x \\cdot x = x^2$
2. $x \\cdot 3 = 3x$
3. $3 \\cdot x = 3x$
4. $3 \\cdot 3 = 9$

Ada dua suku tengah $3x + 3x = 6x$. Suku $6x$ inilah yang hilang di baris ke-2!`;
    }

    if (activeProblem?.misconceptionType === "ROOT_LOSS") {
      return `Kesalahan terjadi saat menarik akar kuadrat pada kedua ruas. Ingat bahwa persamaan kuadrat seperti $x^2 = 4$ memiliki **dua** kemungkinan nilai akar, yaitu $x = 2$ dan $x = -2$ (karena $(-2)^2$ juga sama dengan 4). Jika kamu hanya mengambil nilai positif, kamu kehilangan separuh dari himpunan penyelesaiannya!`;
    }

    if (activeProblem?.explanation) {
      return `Mari kita perhatikan baris ke-${activeProblem.faultLine || 2}:
${activeProblem.explanation}

${activeProblem.counterExample?.contradiction_statement ? `Bukti nyata: ${activeProblem.counterExample.contradiction_statement}` : ""}

Coba telaah kembali aturan operasi yang menghubungkan baris tersebut dengan baris sebelumnya.`;
    }

    return `Untuk memeriksa letak kesalahan, sistem kami membandingkan ekuivalensi aljabar baris demi baris menggunakan SymPy CAS. Masukkan baris coretan aljabarmu dan sistem akan menandai titik patah logikanya!`;
  }

  // 4. PERTANYAAN TENTANG KONSEP KUADRAT SUKU DUA / SUKU TENGAH
  const isAskingBinomial =
    lower.includes("6x") ||
    lower.includes("2ab") ||
    lower.includes("suku tengah") ||
    lower.includes("perkalian silang") ||
    lower.includes("kuadrat suku dua") ||
    lower.includes("(a+b)^2") ||
    lower.includes("(x+3)^2");

  if (isAskingBinomial) {
    return `Suku $2ab$ (atau $6x$ pada kasus $(x+3)^2$) muncul karena sifat distributif perkalian aljabar:
$$ (a + b)^2 = (a + b)(a + b) = a^2 + ab + ba + b^2 = a^2 + 2ab + b^2 $$

**Secara Visual (Model Luas Geometri):**
Bayangkan sebuah persegi dengan panjang sisi $(x + 3)$.
Luas total persegi tersebut tersusun dari 4 bidang:
1. Satu bidang persegi berukuran $x \\times x = x^2$
2. Dua bidang persegi panjang berukuran $x \\times 3 = 3x$ (total $6x$)
3. Satu bidang persegi kecil berukuran $3 \\times 3 = 9$

Total luas adalah $x^2 + 6x + 9$. Tanpa suku $6x$, luasnya tidak akan pernah lengkap!`;
  }

  // 5. PERTANYAAN TENTANG CARA MENYELESAIKAN / PETUNJUK ("Gimana caranya?", "Bantu benerin")
  const isAskingHowToSolve =
    lower.includes("gimana cara") ||
    lower.includes("bagaimana cara") ||
    lower.includes("terus gimana") ||
    lower.includes("bantu benerin") ||
    lower.includes("petunjuk") ||
    lower.includes("caranya gimana") ||
    lower.includes("solusinya apa");

  if (isAskingHowToSolve) {
    if (activeProblem?.steps && activeProblem.steps.length > 0) {
      return `Sesuai prinsip Sokrates ZAP, aku tidak memberikan jawaban akhir secara instan, melainkan memandumu menemukannya sendiri:

1. Ambil ekspresi awalmu: $${activeProblem.steps[0]}$$.
2. Urai kuadrat binomialnya menjadi bentuk perkalian dua suku.
3. Gunakan perkalian distributif secara teliti tanpa melewatkan suku perkalian silang.
4. Sederhanakan konstanta di bagian paling akhir.

Coba tuliskan perbaikan baris berikutnya di kolom chat dan kirimkan, aku akan langsung menguji keabsahannya untukmu!`;
    }

    return `Tuliskan baris-baris aljabar yang sedang kamu kerjakan (gunakan Enter untuk membuat baris baru). ZAP akan memverifikasi setiap langkah secara deterministik dan memberitahumu jika ada aturan aljabar yang terlanggar!`;
  }

  // 6. PERTANYAAN TENTANG KONTRADIKSI / KONTRA-CONTOH ("Kenapa x=2?")
  const isAskingCounterExample =
    lower.includes("x = 2") ||
    lower.includes("x=2") ||
    lower.includes("kontradiksi") ||
    lower.includes("kontra contoh") ||
    lower.includes("angka 21") ||
    lower.includes("angka 25");

  if (isAskingCounterExample) {
    return `Pengujian dengan angka nyata (seperti $x = 2$) adalah cara paling mudah untuk membuktikan apakah dua rumus matematika benar-benar ekuivalen:

Jika dua rumus memang sama identik, maka saat dimasukkan angka berapa pun, hasilnya HARUS selalu sama.
Ketika $x = 2$ dimasukkan:
- Rumus awal: $(2 + 3)^2 - 4 = 5^2 - 4 = 25 - 4 = 21$.
- Rumus tanpa suku tengah ($x^2 + 5$): $2^2 + 5 = 4 + 5 = 9$.

Karena $21 \\neq 9$, ini membuktikan secara mutlak bahwa langkah penurunan tersebut tidak ekuivalen!`;
  }

  // 7. PERTANYAAN UMUM TENTANG ZAP ATAU CARA PAKAI
  const isAskingAboutSystem =
    lower.includes("apa itu zap") ||
    lower.includes("apa itu zero answer policy") ||
    lower.includes("siapa kamu") ||
    lower.includes("bisa apa") ||
    lower.includes("cara pakai") ||
    lower.includes("aturan");

  if (isAskingAboutSystem) {
    return `**ZAP (Zero Answer Policy)** adalah platform pembelajaran matematika 3D interaktif dan tutor Sokratik berbasis *Strict Separation of Concerns* (SymPy CAS + Three.js 3D Canvas + Socratic AI Tutor).

**Filosofi Kami:** *"Don't give them answers. Project the wonder to discover."*
- Kami tidak memberikan kunci jawaban langsung agar siswa tidak ketergantungan pada contekan instan.
- Kami memproyeksikan persamaan matematika ke kanvas 3D interaktif secara real-time dan memverifikasi kebenaran logika langkah demi langkah.
- Kamu bisa menguji aljabar dengan mengetik rumus atau memilih topik matematika dari kanvas 3D!`;
  }

  // 8. RESPONS UMUM BERPIKIR SOKRATIK
  return `Pertanyaan yang bagus mengenai "${message}".

Sebagai tutor kognitif aljabar, mari kita telusuri bersama:
- Jika ini pertanyaan konsep matematika, bagian mana yang paling ingin kamu pahami lebih dalam?
- Jika ini soal perhitungan dari latihan sekolahmu, kamu bisa langsung mengetikkan baris penurunan rumusmu agar aku bisa memverifikasi validitas logikanya baris demi baris!`;
}
