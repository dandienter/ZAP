"use client";

import React, { useState } from "react";
import Link from "next/link";
import ZapLogo from "@/components/ZapLogo";
import {
  GeminiLogo,
  OpenAILogo,
  ClaudeLogo,
  DeepSeekLogo,
  NvidiaLogo,
  SymPyLogo,
} from "@/components/CompanyLogos";
import { ArrowRight } from "lucide-react";
import {
  ZeroAnswerEmblem,
  SymPyCasEmblem,
  SmartboardSpatialEmblem,
  ScratchpadPenEmblem,
  SocraticDialogueEmblem,
  LocalEnclaveEmblem,
  SovereignAuditEmblem,
} from "@/components/PlatformIcons";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"siswa" | "mahasiswa" | "pendidik">("siswa");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030305] text-slate-900 dark:text-zinc-100 font-sans selection:bg-slate-200 dark:selection:bg-zinc-800 selection:text-slate-900 dark:selection:text-white relative overflow-x-hidden transition-colors duration-200">
      {/* 1. MINIMALIST TOP NAVBAR */}
      <nav className="h-16 px-3 sm:px-12 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] bg-white/85 dark:bg-[#030305]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 transition group py-1 min-h-[32px]">
            <ZapLogo className="w-5 h-5 text-slate-900 dark:text-white group-hover:scale-105 transition-transform shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">ChatZAP</span>
              <span className="hidden xs:inline-block text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/[0.08]">
                v2.4
              </span>
            </div>
          </Link>
        </div>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-600 dark:text-zinc-400 font-medium">
          <a href="#arsitektur" className="hover:text-slate-900 dark:hover:text-white py-1.5 px-2.5 min-h-[32px] inline-flex items-center rounded-lg transition">Arsitektur</a>
          <a href="#metrik" className="hover:text-slate-900 dark:hover:text-white py-1.5 px-2.5 min-h-[32px] inline-flex items-center rounded-lg transition">Metrik CAS</a>
          <a href="#fitur" className="hover:text-slate-900 dark:hover:text-white py-1.5 px-2.5 min-h-[32px] inline-flex items-center rounded-lg transition">Pilar ZAP</a>
          <a href="#jenjang" className="hover:text-slate-900 dark:hover:text-white py-1.5 px-2.5 min-h-[32px] inline-flex items-center rounded-lg transition">Jenjang</a>
          <Link href="/connector" className="hover:text-slate-900 dark:hover:text-white py-1.5 px-2.5 min-h-[32px] inline-flex items-center rounded-lg transition text-slate-700 dark:text-zinc-300">
            Connector Hub
          </Link>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/login"
            className="text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white px-2.5 sm:px-3.5 py-1.5 min-h-[32px] inline-flex items-center rounded-lg transition whitespace-nowrap"
          >
            Masuk
          </Link>
          <Link
            href="/chat"
            className="text-xs font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 px-3 sm:px-4 py-1.5 min-h-[32px] rounded-xl transition inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span>Buka Studio</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </nav>

      <main>
        {/* 2. HERO SECTION */}
        <section className="pt-20 sm:pt-24 pb-20 px-4 sm:px-12 max-w-5xl mx-auto text-center space-y-7 relative z-10">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.08]">
            Bukan AI pemberi kunci. <br />
            Mesin pengasah nalar sejati.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed text-pretty">
            ZAP menghentikan ketergantungan contek instan. Setiap baris aljabar siswa diverifikasi secara deterministik oleh SymPy CAS, lalu dibimbing menemukan logikanya sendiri melalui dialog Sokrates.
          </p>

          {/* Hero CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/chat"
              className="w-full sm:w-auto px-6 py-2.5 min-h-[40px] rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <span>Mulai Sesi Pembuktian</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="#arsitektur"
              className="w-full sm:w-auto px-6 py-2.5 min-h-[40px] rounded-xl bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <span>Pelajari Zero-Answer</span>
            </a>
          </div>

          {/* 3. PRODUCT PREVIEW FLOATING UI MOCKUP (Centaur Inspired) */}
          <div className="pt-10 max-w-3xl mx-auto">
            <div className="rounded-2xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.08] p-4 sm:p-6 shadow-xl dark:shadow-2xl text-left space-y-4">
              {/* Top Mockup Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/[0.06] text-xs font-mono text-slate-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  <span className="text-slate-800 dark:text-zinc-300 font-medium">ZAP Socratic Scratchpad</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.1]">
                  Zero-Answer Policy Enforced
                </span>
              </div>

              {/* Split Content: Scratchpad Steps & Verification Result */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Left Column: Derivation Steps */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-2">
                  <div className="text-xs text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    Coretan Baris Siswa:
                  </div>
                  <div className="space-y-1.5 text-slate-700 dark:text-zinc-300">
                    <div className="flex items-center justify-between gap-2">
                      <span>#1 (x + 3)² - 4 = 0</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-sans font-medium">✓ Basis</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-amber-700 dark:text-amber-300">
                      <span>#2 x² + 9 - 4 = 0</span>
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-sans font-medium">⚠️ Galat Baris</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-zinc-400">
                      <span>#3 x² + 5 = 0</span>
                      <span className="text-xs text-slate-600 dark:text-zinc-400 font-sans">Tertahan</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Deterministic CAS & Socratic Counter-Example */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-2">
                  <div className="text-xs text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    Diagnostik SymPy CAS (0ms):
                  </div>
                  <div className="text-slate-700 dark:text-zinc-300 space-y-1.5 font-sans leading-relaxed text-xs">
                    <div className="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                      <span>Miskonsepsi Polinomial Kuadrat</span>
                    </div>
                    <p className="text-slate-600 dark:text-zinc-400 text-xs">
                      Jika x = 1, ruas kiri bernilai (1+3)² - 4 = 12. Namun ruas kanan baris #2 bernilai 1² + 9 - 4 = 6.
                    </p>
                    <p className="text-slate-800 dark:text-zinc-200 text-xs font-medium pt-0.5">
                      💬 &quot;Apakah (a + b)² sama dengan a² + b²? Ke mana suku silang 2ab?&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Logos Strip */}
          <div className="pt-12 text-center space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-600 dark:text-zinc-400 block">
              Diverifikasi oleh SymPy CAS • Kompatibel dengan Model Terkemuka Dunia:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 opacity-85 hover:opacity-100 transition">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300">
                <SymPyLogo className="w-4 h-4" />
                <span>SymPy CAS</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300">
                <GeminiLogo className="w-4 h-4" />
                <span>Google DeepMind</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300">
                <OpenAILogo className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                <span>OpenAI</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300">
                <ClaudeLogo className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                <span>Anthropic</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300">
                <DeepSeekLogo className="w-4 h-4" />
                <span>DeepSeek</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300">
                <NvidiaLogo className="w-4 h-4" />
                <span>NVIDIA NIM</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PLATFORM METRICS (Exact Centaur Style) */}
        <section id="metrik" className="py-20 px-4 sm:px-12 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/70 dark:bg-[#050608]">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Kebenaran aljabar deterministik, <br className="hidden sm:inline" />
                  bukan tebakan probabilitas.
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-xs leading-relaxed">
                Setiap langkah derivasi dibuktikan oleh Computer Algebra System sebelum dialog Sokrates diaktifkan.
              </p>
            </div>

            {/* Metric Numbers Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  0 ms
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Latensi CAS Simbolik</div>
                <div className="text-xs text-slate-600 dark:text-zinc-400">Evaluasi instan tanpa overhead LLM</div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  100%
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Zero-Answer Compliance</div>
                <div className="text-xs text-slate-600 dark:text-zinc-400">Sensor mutlak kunci solusi akhir</div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  22 / 22
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Keamanan Parser Lulus</div>
                <div className="text-xs text-slate-600 dark:text-zinc-400">Anti-RCE &amp; anti-DoS terverifikasi</div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  64
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Automated Test Suites</div>
                <div className="text-xs text-slate-600 dark:text-zinc-400">Audit regresi berkelanjutan</div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  1M+
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Kapasitas Token Konteks</div>
                <div className="text-xs text-slate-600 dark:text-zinc-400">Dukungan penurunan matematika panjang</div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  0 Byt
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Data Log Dijual / Iklan</div>
                <div className="text-xs text-slate-600 dark:text-zinc-400">Kepatuhan privasi UU PDP Indonesia</div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FLOW DIAGRAM: FROM SCRATCHPAD TO REASONING */}
        <section id="arsitektur" className="py-20 px-4 sm:px-12 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#030305]">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Dari goresan ke pembuktian logika
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Alur pemisahan arsitektur antara kepastian matematika SymPy dan empati pedagogis Sokrates.
              </p>
            </div>

            {/* Connected Flow Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-2.5 hover:border-slate-300 dark:hover:border-white/[0.14] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Tahap 1</span>
                  <ScratchpadPenEmblem className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">Scratchpad Siswa</div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Siswa menuliskan baris langkah aljabar di editor teks atau papan tulis.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-2.5 hover:border-slate-300 dark:hover:border-white/[0.16] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Tahap 2 • Truth Tier</span>
                  <SymPyCasEmblem className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">SymPy CAS Engine</div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Membuktikan ekuivalensi, konservasi akar, dan mendeteksi baris pertama yang patah.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-2.5 hover:border-slate-300 dark:hover:border-white/[0.14] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Tahap 3 • Shield</span>
                  <ZeroAnswerEmblem className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">Zero-Answer Guardrail</div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Menyaring solusi eksplisit dan menghitung kontra-contoh aritmetika.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-2.5 hover:border-slate-300 dark:hover:border-white/[0.16] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Tahap 4 • Voice</span>
                  <SocraticDialogueEmblem className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">Tutor Sokrates</div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Mengajukan pertanyaan reflektif untuk memantik pemahaman mandiri siswa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. THREE CORE FOUNDATIONS */}
        <section id="fitur" className="py-20 px-4 sm:px-12 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/70 dark:bg-[#050608]">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Tiga pilar di balik penalaran ChatZAP
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-xs leading-relaxed">
                Dirancang untuk mengatasi problem contek otomatis AI dalam dunia pendidikan.
              </p>
            </div>

            {/* 3 Equal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-white/[0.15] transition">
                <div className="w-9 h-9 flex items-center justify-start text-slate-700 dark:text-zinc-300">
                  <ZeroAnswerEmblem className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Zero-Answer Policy
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  ZAP tidak pernah memberikan jawaban akhir instan. Siswa dibimbing dengan pertanyaan bertahap agar proses kognitif tetap berjalan mandiri.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-white/[0.15] transition">
                <div className="w-9 h-9 flex items-center justify-start text-slate-700 dark:text-zinc-300">
                  <SymPyCasEmblem className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Deterministic SymPy CAS
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Kebenaran rumus tidak diserahkan pada LLM yang rentan halusinasi. SymPy CAS bertindak sebagai hakim tunggal pembuktian aljabar matematis.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-white/[0.15] transition">
                <div className="w-9 h-9 flex items-center justify-start text-slate-700 dark:text-zinc-300">
                  <SmartboardSpatialEmblem className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Papan Tulis Pintar 2D &amp; 3D
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Mendukung coret-coret kapur, penghapus real-time, plotting fungsi otomatis (seperti y = x² - 3), dan irisan penampang geometri 3D.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. JENJANG PENDIDIKAN (SD HINGGA S3) */}
        <section id="jenjang" className="py-20 px-4 sm:px-12 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#030305]">
          <div className="max-w-4xl mx-auto space-y-8 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Satu mesin untuk semua jenjang pendidikan
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Kedalaman pertanyaan beradaptasi dari pemahaman konkret sekolah dasar hingga bukti formal perguruan tinggi.
              </p>
            </div>

            {/* Simple Tab Switcher */}
            <div className="flex justify-center">
              <div className="p-1 rounded-xl bg-slate-200/80 dark:bg-[#0e1017] border border-slate-300 dark:border-white/[0.08] inline-flex flex-wrap justify-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("siswa")}
                  className={`px-3.5 py-1.5 min-h-[32px] rounded-lg transition font-medium cursor-pointer ${
                    activeTab === "siswa"
                      ? "bg-white dark:bg-white text-slate-900 dark:text-zinc-950 font-semibold shadow-sm"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  SD &amp; SMP
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("mahasiswa")}
                  className={`px-3.5 py-1.5 min-h-[32px] rounded-lg transition font-medium cursor-pointer ${
                    activeTab === "mahasiswa"
                      ? "bg-white dark:bg-white text-slate-900 dark:text-zinc-950 font-semibold shadow-sm"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  SMA &amp; Kuliah (S1–S3)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pendidik")}
                  className={`px-3.5 py-1.5 min-h-[32px] rounded-lg transition font-medium cursor-pointer ${
                    activeTab === "pendidik"
                      ? "bg-white dark:bg-white text-slate-900 dark:text-zinc-950 font-semibold shadow-sm"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Guru &amp; Dosen
                </button>
              </div>
            </div>

            {/* Dynamic Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              {activeTab === "siswa" && (
                <>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Konsep CPA (Konkret-Gambar)</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Membimbing pecahan dan aljabar dasar melalui balok visual sebelum masuk ke lambang abstrak.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Neraca Kesetaraan Aljabar</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Menjelaskan mengapa memindahkan suku memerlukan perlakuan yang sama pada kedua ruas.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Bebas Takut Salah</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Kesalahan disambut sebagai titik awal diskusi logis, bukan sebagai kegagalan.
                    </p>
                  </div>
                </>
              )}

              {activeTab === "mahasiswa" && (
                <>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Geometri Irisan Kerucut</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Membedah perpotongan bidang miring pada kerucut untuk memahami elips, parabola, dan hiperbola.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Kalkulus Multivariabel</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Visualisasi permukaan kuadrik 3D dan analisis turunan parsial secara interaktif.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Kekakuan Bukti Formal</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Pencegahan kehilangan domain akar dan pelacakan syarat singularitas pembagian dengan nol.
                    </p>
                  </div>
                </>
              )}

              {activeTab === "pendidik" && (
                <>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Solusi Anti-Contek Kelas</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Guru yakin siswa tidak menyalin hasil instan karena ZAP memandu proses nalar bertahap.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Mode Proyektor Papan Tulis</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Tampilan kanvas matematika dapat diproyeksikan langsung ke layar kelas untuk demonstrasi visual.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Diagnostik Miskonsepsi Presisi</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Laporan titik patah aljabar membantu guru mengetahui kelemahan konseptual spesifik setiap murid.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 8. PRIVASI & UU PDP */}
        <section className="py-20 px-4 sm:px-12 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/70 dark:bg-[#050608]">
          <div className="max-w-4xl mx-auto space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Kerahasiaan dan kedaulatan data siswa
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Kunci API disimpan secara lokal di browser Anda. Sesi bimbingan dilindungi enkripsi AES-256.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5 hover:border-slate-300 dark:hover:border-white/[0.12] transition">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                  <LocalEnclaveEmblem className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                  <span>Penyimpanan Kunci Lokal (BYOK)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Kunci API OpenAI, Claude, atau DeepSeek Anda disimpan pada peramban lokal (LocalStorage) tanpa disimpan di database publik pihak ketiga.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-1.5 hover:border-slate-300 dark:hover:border-white/[0.12] transition">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                  <SovereignAuditEmblem className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                  <span>Kepatuhan UU PDP Indonesia</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Hak penghapusan data instan (Right to Erasure) dan ekspor riwayat penalaran mandiri tersedia kapan saja.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. BOTTOM FINAL HERO CALL TO ACTION */}
        <section className="py-24 sm:py-28 px-4 sm:px-12 text-center border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#030305] relative overflow-hidden">
          {/* Subtle Perspective Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            }}
          />

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Mereka memberi contekan. <br />
              Kami membuktikan logikanya.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Hentikan kebiasaan menyalin tanpa paham. Mulai sesi bimbingan Sokrates pertama Anda sekarang.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/chat"
                className="w-full sm:w-auto px-6 py-2.5 min-h-[40px] rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <span>Buka Studio ChatZAP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/connector"
                className="w-full sm:w-auto px-6 py-2.5 min-h-[40px] rounded-xl bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-medium text-xs flex items-center justify-center transition cursor-pointer shadow-xs"
              >
                <span>Atur Model &amp; Kunci API</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 10. MINIMALIST FOOTER */}
      <footer className="py-8 px-4 sm:px-12 border-t border-slate-200 dark:border-white/[0.06] text-xs text-slate-600 dark:text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-[#030305]">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <ZapLogo className="w-4 h-4 text-slate-900 dark:text-white" />
          <span className="font-semibold text-slate-800 dark:text-zinc-300">ChatZAP</span>
          <span>• Zero Answer Policy • Logicodix 2026 Hackathon</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
          <Link href="/chat" className="hover:text-slate-900 dark:hover:text-white py-1.5 px-2.5 min-h-[28px] inline-flex items-center rounded-lg transition">Studio</Link>
          <Link href="/connector" className="hover:text-slate-900 dark:hover:text-white py-1.5 px-2.5 min-h-[28px] inline-flex items-center rounded-lg transition">Connectors</Link>
          <Link href="/login" className="hover:text-slate-900 dark:hover:text-white py-1.5 px-2.5 min-h-[28px] inline-flex items-center rounded-lg transition">Masuk</Link>
        </div>
      </footer>
    </div>
  );
}
