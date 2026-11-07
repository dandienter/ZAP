import { NextResponse } from "next/server";

interface VerifyRequestBody {
  apiKey: string;
}

export async function POST(req: Request) {
  try {
    let body: VerifyRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { valid: false, error: "Payload JSON tidak valid" },
        { status: 400 }
      );
    }

    const apiKey = body.apiKey?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: "Google API Key tidak boleh kosong" },
        { status: 400 }
      );
    }

    // 1. Verifikasi langsung ke Google Generative Language API
    const startTime = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    const latency = Date.now() - startTime;

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errorMsg =
        errJson?.error?.message ||
        `Google API merespons dengan HTTP ${res.status} (${res.statusText})`;

      return NextResponse.json(
        {
          valid: false,
          error: errorMsg,
          statusCode: res.status,
          latencyMs: latency,
        },
        { status: 200 }
      );
    }

    const data = await res.json();
    const allModels: Array<{ name: string; displayName?: string; supportedGenerationMethods?: string[] }> =
      data?.models || [];

    // Filter model teks yang relevan
    const contentModels = allModels
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""));

    const has20Flash = contentModels.some((m) => m.includes("2.0-flash"));
    const has15Pro = contentModels.some((m) => m.includes("1.5-pro"));

    return NextResponse.json({
      valid: true,
      message: "Kredensial Google AI Studio berhasil diverifikasi!",
      latencyMs: latency,
      totalModels: contentModels.length,
      sampleModels: contentModels.slice(0, 5),
      tier: has15Pro || has20Flash ? "Google Gemini Pro / Flash (Tier Aktif)" : "Google Gemini Standard",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        valid: false,
        error: `Gagal menghubungi server Google: ${errorMsg}`,
      },
      { status: 200 }
    );
  }
}
