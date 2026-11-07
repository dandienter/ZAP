"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleAuthButton, { type ZAPUser } from "@/components/GoogleAuthButton";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  Lock,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";

// Minimalist Z Logo
function ZLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="24" height="24" rx="6" fill="url(#z-login-grad)" />
      <path
        d="M6.5 7.5H17.5L8.5 16.5H17.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="z-login-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<ZAPUser | null>(null);

  const handleUserChange = (u: ZAPUser | null) => {
    setUser(u);
    if (u) {
      // Auto redirect ke studio chat setelah login berhasil
      setTimeout(() => {
        router.push("/chat");
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Navigation */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-white/[0.06] relative z-10">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition group">
          <ZLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
          <span className="font-bold text-base tracking-wider text-white">ZAP</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono">
            chatzap.xyz
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-[#0f121a]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-2">
              <ZLogo className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Masuk ke ZAP
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Platform penalaran matematika Sokratik tanpa pembocoran jawaban akhir untuk siswa, guru, dan dosen.
            </p>
          </div>

          {/* Auto-Provisioning Notification Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/40 border border-blue-500/20 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-blue-300 font-semibold text-[11px]">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Auto Gemini Connection (Tanpa Ribet API Key)</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-normal">
              Saat kamu login via Google, backend ZAP otomatis mengaktifkan integrasi <strong>Google Gemini AI</strong> dari server pool. Kamu tidak perlu menyalin atau membuat API key manual.
            </p>
          </div>

          {/* Google Login Action */}
          <div className="space-y-3 pt-1">
            <div className="flex justify-center">
              <GoogleAuthButton onUserChange={handleUserChange} />
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/[0.06]"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-mono tracking-widest text-slate-500">
                Atau
              </span>
              <div className="flex-grow border-t border-white/[0.06]"></div>
            </div>

            {/* Guest / Direct Student Access */}
            <Link
              href="/chat"
              className="w-full py-2.5 px-4 rounded-xl bg-[#171b26] hover:bg-[#202534] border border-white/[0.08] text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Lanjut Mode Tamu / Siswa Bebas</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Invariants / Security Highlights */}
          <div className="pt-4 border-t border-white/[0.06] space-y-2 text-[11px] text-slate-400">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Zero-Answer Policy:</strong> AI membantu logika nalar, manusia yang menghitung.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Papan Tulis 3D:</strong> Kanvas spasial interaktif untuk aljabar dan irisan kerucut.</span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span><strong>Privasi Terenkripsi:</strong> Chat dilindungi verifikasi integritas SHA-256.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 px-6 text-center flex items-center justify-center text-[10px] text-slate-500 border-t border-white/[0.06] relative z-10">
        <span>© 2026 ZAP (Zero Answer Policy) • Logicodix 2026 Hackathon • chatzap.xyz</span>
      </footer>
    </div>
  );
}
