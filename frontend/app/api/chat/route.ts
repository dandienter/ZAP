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

    const { message, activeProblem, apiKey, modelId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    // 1. Tanggapi sapaan singkat secara instan (0 ms latency) tanpa menunggu round-trip cloud
    const lower = message.toLowerCase().trim();
    const isQuickGreeting =
      /^(hai|halo|pagi|siang|malam|sore|assalamu|permisi|tes|ping|woi|hei|hi|hello)\b/i.test(lower) &&
      lower.split(/\s+/).length <= 3;

    if (isQuickGreeting) {
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

    // 2. Coba panggil Google Gemini API jika API Key tersedia
    if (effectiveApiKey) {
      try {
        const geminiResult = await callGeminiAPI(message, effectiveApiKey, activeProblem, modelId);
        
        if (geminiResult.text) {
          return NextResponse.json({
            reply: geminiResult.text,
            model: `${geminiResult.modelUsed || "Gemini 1.5 Flash"} (Cloud API)`,
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

    // 2. Gunakan Built-in Socratic Cognitive Agent (Zero-Latency, Offline-Ready)
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

// In-memory cache model tercepat untuk zero-latency direct routing
let cachedWorkingModel = "gemini-1.5-flash";

/**
 * Panggilan ultra-cepat ke Google Gemini REST API (v1beta).
 * Jalur Cepat (Zero-Hop): Memanggil gemini-1.5-flash secara langsung tanpa round-trip ListModels.
 * Jalur Adaptif (Slow Fallback): Hanya dipanggil jika model default tidak tersedia.
 */
async function callGeminiAPI(
  userMessage: string,
  apiKey: string,
  activeProblem?: ActiveProblemContext | null,
  modelId?: string
): Promise<GeminiCallResult> {
  let systemInstructionText = `Anda adalah LogicoMath, asisten diagnostik kognitif dan tutor aljabar Sokrates untuk siswa SMA di Indonesia.
PRINSIP UTAMA (RUBRIK LOGICODIX 2026):
1. ZERO-ANSWER POLICY: JANGAN PERNAH memberikan jawaban akhir atau mengerjakan PR siswa secara langsung.
2. METODE SOKRATES: Bimbing siswa dengan pertanyaan reflektif, analogi intuitif (misal: model luas geometri untuk kuadrat suku dua), dan uji angka nyata (kontra-contoh).
3. BAHASA: Gunakan bahasa Indonesia yang ramah, hangat, menyemangati, dan mudah dipahami anak sekolah.
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

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstructionText }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500, // Ringkas dan responsif untuk memaksimalkan kecepatan
    },
  };

  // ========================================================
  // JALUR CEPAT (ZERO-HOP): Panggil langsung model tercepat
  // ========================================================
  const fastUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cachedWorkingModel}:generateContent?key=${apiKey}`;

  try {
    const fastRes = await fetch(fastUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (fastRes.ok) {
      const data = await fastRes.json();
      const candidateText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      if (candidateText) {
        return { text: candidateText, modelUsed: cachedWorkingModel };
      }
    } else {
      const errJson = await fastRes.json().catch(() => null);
      const errMsg = errJson?.error?.message || `HTTP ${fastRes.status}`;

      // Jika error autentikasi kunci API (400 Invalid key / 403), tidak perlu coba model lain
      const isAuthError =
        fastRes.status === 403 ||
        errMsg.toLowerCase().includes("api_key_invalid") ||
        errMsg.toLowerCase().includes("api key not valid");

      if (isAuthError) {
        return { error: errMsg, status: fastRes.status, modelUsed: cachedWorkingModel };
      }
    }
  } catch (fastErr) {
    console.warn("Direct fast call failed, falling back to dynamic search:", fastErr);
  }

  // ========================================================
  // JALUR ADAPTIF (Hanya dieksekusi jika model default gagal)
  // ========================================================
  let dynamicModels: string[] = [];
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: "GET",
        headers: {
          "x-goog-api-key": apiKey,
        },
      }
    );

    if (!listRes.ok) {
      const errJson = await listRes.json().catch(() => null);
      const errMsg = errJson?.error?.message || `HTTP ${listRes.status}`;
      return {
        error: errMsg,
        status: listRes.status,
      };
    }

    const listData = await listRes.json();
    const modelsList: Array<{ name: string; supportedGenerationMethods?: string[] }> =
      listData?.models || [];

    // Filter HANYA model teks interaktif (tolak audio, tts, embedding, imagen, video)
    const textModels = modelsList.filter((m) => {
      const name = m.name.toLowerCase();
      const isExcluded =
        name.includes("tts") ||
        name.includes("audio") ||
        name.includes("embedding") ||
        name.includes("imagen") ||
        name.includes("image") ||
        name.includes("realtime") ||
        name.includes("robotics");

      const isGenContent = m.supportedGenerationMethods?.includes("generateContent");
      return !isExcluded && isGenContent;
    });

    // Urutkan prioritas model teks murni:
    // 1. gemini-1.5-flash (paling stabil & teruji untuk percakapan teks)
    // 2. gemini-2.0-flash
    // 3. gemini-1.5-pro / 2.0-pro
    // 4. gemini-1.5-flash-8b
    const scored = textModels.map((m) => {
      let score = 0;
      const n = m.name.toLowerCase();
      if (n.includes("1.5-flash")) score += 100;
      else if (n.includes("2.0-flash")) score += 95;
      else if (n.includes("1.5-pro")) score += 80;
      else if (n.includes("2.0-pro")) score += 75;
      else if (n.includes("flash-8b")) score += 70;
      else if (n.includes("gemini")) score += 50;
      return { name: m.name, score };
    });

    scored.sort((a, b) => b.score - a.score);
    dynamicModels = scored.map((s) => s.name.replace(/^models\//, ""));
  } catch (listErr) {
    console.warn("Could not list models dynamically, falling back to static list:", listErr);
  }

  // Jika dynamic list kosong, gunakan static candidate fallback
  const modelsToTry = dynamicModels.length > 0
    ? dynamicModels
    : [
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro",
      ];

  let lastError = "";
  let lastStatus = 0;

  for (const model of modelsToTry) {
    const cleanModel = model.replace(/^models\//, "");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (candidateText) {
          cachedWorkingModel = cleanModel; // Simpan model yang sukses ke cache
          return { text: candidateText, modelUsed: cleanModel };
        }
      } else {
        lastStatus = response.status;
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error?.message || `HTTP ${response.status}`;
        lastError = errMsg;

        // Hanya hentikan percobaan jika API Key ditolak secara mutlak (kunci invalid)
        const isAuthError =
          response.status === 403 ||
          errMsg.toLowerCase().includes("api_key_invalid") ||
          errMsg.toLowerCase().includes("api key not valid");

        if (isAuthError) {
          return { error: errMsg, status: response.status, modelUsed: cleanModel };
        }
        // Jika error terkait modalitas/model tertentu, lanjutkan mencoba model teks berikutnya di daftar
      }
    } catch (netErr) {
      lastError = netErr instanceof Error ? netErr.message : String(netErr);
    }
  }

  return {
    error: lastError || "Tidak dapat menghasilkan respon dari model Gemini",
    status: lastStatus || 500,
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
