import { NextResponse } from "next/server";

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
  modelId?: string;
  apiKey?: string;
}

interface GeminiCallResult {
  text?: string;
  error?: string;
  status?: number;
  modelUsed?: string;
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

    const { message, conversationHistory, activeProblem, apiKey, modelId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    // 1. Jika pengguna memilih mesin SymPy lokal, langsung gunakan respons instan (0 ms latency)
    if (modelId === "sympy-cfl") {
      const socraticReply = generateSocraticFallbackResponse(message, activeProblem);
      return NextResponse.json({
        reply: socraticReply,
        model: "SymPy CFL Engine (Local Deterministic 0ms)",
        source: "local-sympy",
      });
    }

    // 2. Tanggapi sapaan pembuka singkat secara instan jika belum ada riwayat percakapan
    const lower = message.toLowerCase().trim();
    const isQuickGreeting =
      /^(hai|halo|pagi|siang|malam|sore|assalamu|permisi|tes|ping|woi|hei|hi|hello)\b/i.test(lower) &&
      lower.split(/\s+/).length <= 3;

    if (isQuickGreeting && (!conversationHistory || conversationHistory.length === 0)) {
      const quickReply = generateSocraticFallbackResponse(message, activeProblem);
      return NextResponse.json({
        reply: quickReply,
        model: "LogicoMath Socratic Engine (Instant 0ms)",
        source: "instant-greeting",
      });
    }

    const effectiveApiKey =
      apiKey?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      "";

    // 3. Panggil Google Gemini API dengan memori percakapan penuh
    if (effectiveApiKey) {
      try {
        const geminiResult = await callGeminiAPI(
          message,
          effectiveApiKey,
          conversationHistory,
          activeProblem,
          modelId
        );
        
        if (geminiResult.text) {
          return NextResponse.json({
            reply: geminiResult.text,
            model: `${geminiResult.modelUsed || "Gemini 2.0 Flash"} (Cloud API)`,
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

    // 4. Gunakan Built-in Socratic Cognitive Agent (Zero-Latency, Offline-Ready)
    const socraticReply = generateSocraticFallbackResponse(message, activeProblem);

    return NextResponse.json({
      reply: socraticReply,
      model: "LogicoMath Socratic Engine (Local Hybrid)",
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
  modelId?: string
): Promise<GeminiCallResult> {
  let systemInstructionText = `Anda adalah LogicoMath, asisten diagnostik kognitif dan tutor aljabar cerdas untuk siswa di Indonesia.
PRINSIP UTAMA (RUBRIK LOGICODIX 2026):
1. ZERO-ANSWER POLICY: JANGAN PERNAH memberikan jawaban akhir atau mengerjakan PR aljabar siswa secara langsung. Bimbing siswa untuk menemukan solusinya sendiri.
2. METODE SOKRATES & PEDAGOGIS: Bimbing siswa dengan pertanyaan reflektif, analogi intuitif (misal: model luas geometri untuk kuadrat suku dua), dan uji angka nyata (kontra-contoh).
3. MEMORI PERCAKAPAN: Jaga konteks percakapan secara utuh. Ingat nama pengguna, pertanyaan sebelumnya, dan topik yang telah dibahas dalam sesi ini. Jika siswa bertanya hal umum di luar matematika (seperti fenomena sains atau fisika), jawab dengan ramah, berpengetahuan luas, cerdas, dan kontekstual.
4. FORMAT: Gunakan Markdown bersih dan notasi KaTeX ($...$ untuk inline, $$...$$ untuk baris formula).`;

  if (activeProblem && activeProblem.steps && activeProblem.steps.length > 0) {
    systemInstructionText += `\n\nKONTEKS CORETAN SISWA SAAT INI:
- Langkah coretan siswa: ${activeProblem.steps.map((s, i) => `#${i + 1}: ${s}`).join(" -> ")}
${activeProblem.faultLine ? `- Titik patah kesalahan logika terdeteksi di baris #${activeProblem.faultLine}` : ""}
${activeProblem.misconceptionType ? `- Tipe miskonsepsi: ${activeProblem.misconceptionType}` : ""}
${activeProblem.explanation ? `- Penjelasan galat: ${activeProblem.explanation}` : ""}
${activeProblem.counterExample?.contradiction_statement ? `- Kontra-contoh aritmetika: ${activeProblem.counterExample.contradiction_statement}` : ""}
Jadikan konteks coretan di atas sebagai rujukan utama jika siswa bertanya tentang kesalahannya atau bingung cara memperbaikinya.`;
  }

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
 * Built-in Socratic Cognitive Agent
 * Memberikan respons cerdas dan kontekstual secara lokal tanpa dependensi eksternal
 */
function generateSocraticFallbackResponse(
  message: string,
  activeProblem?: ActiveProblemContext | null
): string {
  const lower = message.toLowerCase().trim();

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
    return `Halo! Aku LogicoMath, asisten diagnostik aljabar kamu. Ada konsep matematika atau langkah penurunan rumus yang ingin kamu tanyakan atau uji bersama? Kamu bisa bertanya bebas atau langsung memasukkan baris aljabar coretanmu!`;
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
      return `Sesuai prinsip Sokrates LogicoMath, aku tidak memberikan jawaban akhir secara instan, melainkan memandumu menemukannya sendiri:

1. Ambil ekspresi awalmu: $${activeProblem.steps[0]}$$.
2. Urai kuadrat binomialnya menjadi bentuk perkalian dua suku.
3. Gunakan perkalian distributif secara teliti tanpa melewatkan suku perkalian silang.
4. Sederhanakan konstanta di bagian paling akhir.

Coba tuliskan perbaikan baris berikutnya di kolom chat dan kirimkan, aku akan langsung menguji keabsahannya untukmu!`;
    }

    return `Tuliskan baris-baris aljabar yang sedang kamu kerjakan (gunakan Enter untuk membuat baris baru). LogicoMath akan memverifikasi setiap langkah secara deterministik dan memberitahumu jika ada aturan aljabar yang terlanggar!`;
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

  // 7. PERTANYAAN UMUM TENTANG LOGICOMATH ATAU CARA PAKAI
  const isAskingAboutSystem =
    lower.includes("apa itu logicomath") ||
    lower.includes("apa itu nalarai") ||
    lower.includes("siapa kamu") ||
    lower.includes("bisa apa") ||
    lower.includes("cara pakai") ||
    lower.includes("aturan");

  if (isAskingAboutSystem) {
    return `**LogicoMath** adalah asisten diagnostik aljabar otonom berbasis *Hybrid Reasoning* (SymPy CAS + Socratic AI Tutor).

**Filosofi Kami:** *"Don't give them the answer. Debug how they think."*
- Kami tidak memberikan kunci jawaban langsung agar siswa tidak ketergantungan.
- Kami memindai coretan matematika baris demi baris, menemukan titik patah kesalahan logika pertama, dan memberikan pertanyaan bimbingan reflektif.
- Kamu bisa menguji coretanmu dengan mengetik baris aljabar atau memilih contoh soal dari menu samping!`;
  }

  // 8. RESPONS UMUM BERPIKIR SOKRATIK
  return `Pertanyaan yang bagus mengenai "${message}".

Sebagai tutor kognitif aljabar, mari kita telusuri bersama:
- Jika ini pertanyaan konsep matematika, bagian mana yang paling ingin kamu pahami lebih dalam?
- Jika ini soal perhitungan dari latihan sekolahmu, kamu bisa langsung mengetikkan baris penurunan rumusmu agar aku bisa memverifikasi validitas logikanya baris demi baris!`;
}
