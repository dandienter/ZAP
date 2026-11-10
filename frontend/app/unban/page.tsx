"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ZapLogo from "@/components/ZapLogo";
import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  Mail,
  KeyRound,
  Sparkles,
} from "lucide-react";

function UnbanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [tokenInput, setTokenInput] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [unbannedEmail, setUnbannedEmail] = useState<string>("");

  const verifyToken = async (tokenToVerify: string) => {
    const cleanToken = tokenToVerify.trim();
    if (!cleanToken) return;

    setStatus("verifying");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/security?token=${encodeURIComponent(cleanToken)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Akun Anda berhasil dipulihkan secara penuh oleh Administrator.");
        setUnbannedEmail(data.email || "");

        // Bersihkan status sanksi di peramban lokal
        if (typeof window !== "undefined") {
          localStorage.removeItem("zap_account_suspended");
          localStorage.removeItem("zap_jailbreak_strikes");
        }
      } else {
        setStatus("error");
        setMessage(data.message || data.error || "Token pemulihan tidak valid atau sudah kedaluwarsa.");
      }
    } catch {
      setStatus("error");
      setMessage("Terjadi kesalahan jaringan saat memverifikasi token pemulihan. Pastikan koneksi internet aktif.");
    }
  };

  useEffect(() => {
    const urlToken =
      searchParams.get("token") || searchParams.get("unban_token") || searchParams.get("code") || "";
    if (urlToken) {
      setTokenInput(urlToken);
      verifyToken(urlToken);
    } else {
      setStatus("idle");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500/30 selection:text-white">
      {/* Background radial gradient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      {/* Header bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <ZapLogo className="w-8 h-8 transition-transform group-hover:scale-105" />
          <span className="font-bold text-base tracking-tight text-white">ChatZAP</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
            Account Recovery
          </span>
        </Link>
        <Link
          href="/chat"
          className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
        >
          <span>Masuk ke Chat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-[#14151a]/90 backdrop-blur-xl border border-white/10 p-7 shadow-2xl shadow-black/60 space-y-6">
          {/* VERIFYING STATE */}
          {status === "verifying" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <RotateCw className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">Memverifikasi Tautan Pemulihan...</h3>
                <p className="text-xs text-slate-400">
                  Menghubungkan ke server verifikasi keamanan ChatZAP. Mohon tunggu sejenak.
                </p>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {status === "success" && (
            <div className="text-center py-4 space-y-5 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Akun Berhasil Dipulihkan!</h2>
                <p className="text-xs text-emerald-300/90 leading-relaxed">
                  Status penangguhan akun Anda telah resmi dicabut oleh Administrator resmi (Wakhid Pangestu).
                </p>
              </div>

              {/* Status card */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-left text-xs space-y-2">
                {unbannedEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email Akun:</span>
                    <span className="font-mono font-medium text-white">{unbannedEmail}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Akses:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Aktif Normal (0 Strike)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Zero Answer Policy:</span>
                  <span className="font-mono text-[10px] text-slate-300">Terproteksi CAS SymPy</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/chat")}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-white/10 cursor-pointer"
              >
                <span>Mulai Belajar di ChatZAP Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ERROR STATE */}
          {status === "error" && (
            <div className="space-y-5 animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/20">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-white">Tautan Pemulihan Tidak Valid</h3>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  {message || "Token ini mungkin sudah kedaluwarsa atau telah digunakan sebelumnya."}
                </p>
              </div>

              {/* Input fallback */}
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-3">
                <label className="block text-[11px] font-medium text-slate-300">
                  Punya kode token pemulihan lain dari Admin?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: ZAP-..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/15 text-white placeholder:text-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-white"
                  />
                  <button
                    type="button"
                    onClick={() => verifyToken(tokenInput)}
                    disabled={!tokenInput.trim()}
                    className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-medium text-white transition cursor-pointer whitespace-nowrap"
                  >
                    Verifikasi
                  </button>
                </div>
              </div>

              <div className="pt-2 text-center space-y-2">
                <p className="text-[11px] text-slate-400">
                  Butuh bantuan permohonan baru? Silakan email langsung:
                </p>
                <a
                  href="mailto:wakhidpangestu1@gmail.com"
                  className="inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-white font-mono underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>wakhidpangestu1@gmail.com</span>
                </a>
              </div>
            </div>
          )}

          {/* IDLE STATE: Buka langsung tanpa token di URL */}
          {status === "idle" && (
            <div className="space-y-5 animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">
                <KeyRound className="w-7 h-7" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-white">Pemulihan Akun ChatZAP</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Masukkan token pemulihan yang Anda terima dari balasan email Administrator untuk membuka blokir akun Anda.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Masukkan Kode Token (ZAP-...)"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-white"
                />

                <button
                  type="button"
                  onClick={() => verifyToken(tokenInput)}
                  disabled={!tokenInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-40 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-800" />
                  <span>Pulihkan Akun Sekarang</span>
                </button>
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                Permohonan pemulihan akun dapat diajukan ke:{" "}
                <a href="mailto:wakhidpangestu1@gmail.com" className="font-mono text-slate-300 underline">
                  wakhidpangestu1@gmail.com
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
        &copy; 2026 ChatZAP — Zero Answer Policy Socratic AI. Dilindungi Invarian CAS SymPy.
      </footer>
    </div>
  );
}

export default function UnbanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Memuat sistem pemulihan...
        </div>
      }
    >
      <UnbanContent />
    </Suspense>
  );
}
