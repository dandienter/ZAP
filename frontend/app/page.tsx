"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  Lock,
  Box,
  Cpu,
  GraduationCap,
  Users,
  CheckCircle2,
  Code2,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  Database,
  EyeOff,
  Server,
  Tv,
} from "lucide-react";

// Minimalist Z Logo
function ZLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="24" height="24" rx="6" fill="url(#z-hero-grad)" />
      <path
        d="M6.5 7.5H17.5L8.5 16.5H17.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="z-hero-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LandingPage() {
  const [activeAudienceTab, setActiveAudienceTab] = useState<"siswa" | "mahasiswa" | "pendidik">("siswa");

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-blue-600/12 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[1800px] left-0 w-[500px] h-[500px] bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* 1. TOP NAVBAR */}
      <nav className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-white/[0.07] bg-[#07090e]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition group">
            <ZLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-wider text-white">ZAP</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono">
                chatzap.xyz
              </span>
            </div>
          </Link>
        </div>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
          <a href="#visi" className="hover:text-white transition">Visi Zero-Answer</a>
          <a href="#fitur" className="hover:text-white transition">Fitur 3D & CAS</a>
          <a href="#jenjang" className="hover:text-white transition">SD hingga S3</a>
          <Link href="/connector" className="hover:text-white transition text-blue-300 font-semibold">Plugin Connector Hub</Link>
          <a href="#privasi" className="hover:text-white transition">Keamanan SHA-256</a>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl border border-white/[0.1] hover:bg-white/[0.05] transition"
          >
            Login Google
          </Link>
          <Link
            href="/chat"
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Buka Studio ZAP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-20 pb-20 px-6 sm:px-12 max-w-6xl mx-auto text-center space-y-8 relative z-10">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-mono shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Logicodix 2026 Hackathon • Zero Answer Policy Certified</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Bukan AI Pemberi Jawaban. <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Mesin Pengasah Nalar Matematika.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          ZAP menghentikan budaya <em>copy-paste</em> contekan AI. Siswa dituntun menemukan logikanya sendiri melalui dialog Sokrates, verifikasi aljabar deterministik <strong>SymPy CAS</strong>, dan visualisasi spasial <strong>Kanvas 3D interaktif</strong>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link
            href="/chat"
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mulai Sesi Belajar Bebas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-[#121622] hover:bg-[#1a2030] border border-white/[0.1] text-slate-200 hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition"
          >
            <Zap className="w-4 h-4 text-blue-400" />
            <span>Login Google (Auto Gemini)</span>
          </Link>
        </div>

        {/* Live Interactive Simulation Preview Card */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-[#0f121a]/90 border border-white/[0.1] p-4 sm:p-6 shadow-2xl backdrop-blur-xl text-left grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Chat & Reasoning Flow */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>STUDIO ZAP LIVE INTERFACE</span>
                </span>
                <span className="text-blue-400">Zero Answer Enforced</span>
              </div>

              {/* Student Step */}
              <div className="p-3 rounded-xl bg-[#171b26] border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-mono text-slate-400">LANGKAH CORETAN SISWA:</span>
                <div className="text-xs font-mono text-slate-200">
                  #1 (x + 3)^2 - 4 <br />
                  #2 x^2 + 9 - 4
                </div>
              </div>

              {/* ZAP Diagnostic Socratic Bubble */}
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-300 flex items-center gap-1.5">
                    <ZLogo className="w-4 h-4" />
                    <span>ZAP Socratic Diagnostic</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    Galat di Baris #2
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Perhatikan ekspansi kuadrat suku dua $(x+3)^2$ pada barismu. Apakah $(a+b)^2$ sama dengan $a^2 + b^2$?
                </p>
                <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06] text-[11px] font-mono text-slate-300">
                  <span className="text-amber-400">Uji Angka Nyata:</span> Jika $x = 1$, ruas kiri bernilai $(1+3)^2 - 4 = 12$, namun ruas kananmu bernilai $1^2 + 9 - 4 = 6$. Di manakah suku silang $2ab$ berada?
                </div>
              </div>
            </div>

            {/* Right: 3D Virtual Whiteboard Preview */}
            <div className="lg:col-span-5 rounded-2xl bg-[#090b10] border border-white/[0.08] p-4 text-center space-y-3 flex flex-col justify-center items-center min-h-[260px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-purple-600/30 border border-blue-400/30 flex items-center justify-center shadow-lg">
                <Box className="w-8 h-8 text-blue-400 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-white">Kanvas 3D Interaktif Kanan</h4>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Memodelkan pergeseran parabola $y = (x+3)^2 - 4$ vs grafik keliru $y = x^2 + 5$ sebagai papan tulis visual ruang.
                </p>
              </div>
              <Link
                href="/chat"
                className="text-[11px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium pt-1"
              >
                <span>Buka Kanvas 3D Sekarang</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. UNIVERSAL ACADEMIC SCOPE (SD HINGGA S3) */}
      <section id="jenjang" className="py-20 px-6 sm:px-12 border-t border-white/[0.07] bg-[#090c13]/50">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">
              Universal Academic Curriculum
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              Satu Mesin untuk Semua Jenjang Pendidikan
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              ZAP menyesuaikan kedalaman penalaran kognitif dari konsep aritmetika dasar hingga kalkulus tensor tingkat lanjut.
            </p>
          </div>

          {/* Tab Filter */}
          <div className="flex justify-center">
            <div className="p-1 rounded-2xl bg-[#111520] border border-white/[0.08] inline-flex gap-1 text-xs">
              <button
                onClick={() => setActiveAudienceTab("siswa")}
                className={`px-4 py-2 rounded-xl transition font-medium ${
                  activeAudienceTab === "siswa"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Murid SD & SMP
              </button>
              <button
                onClick={() => setActiveAudienceTab("mahasiswa")}
                className={`px-4 py-2 rounded-xl transition font-medium ${
                  activeAudienceTab === "mahasiswa"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Siswa SMA & Mahasiswa S1–S3
              </button>
              <button
                onClick={() => setActiveAudienceTab("pendidik")}
                className={`px-4 py-2 rounded-xl transition font-medium ${
                  activeAudienceTab === "pendidik"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Guru & Dosen
              </button>
            </div>
          </div>

          {/* Dynamic Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeAudienceTab === "siswa" && (
              <>
                <div className="p-5 rounded-2xl bg-[#0f131c] border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">1</div>
                  <h4 className="text-sm font-semibold text-white">Konsep CPA (Konkret-Gambar-Abstrak)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Membantu siswa memahami pecahan, penjumlahan aljabar suku sejenis, dan model visual balok sebelum masuk ke simbol abstrak.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0f131c] border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">2</div>
                  <h4 className="text-sm font-semibold text-white">Aljabar Linear Suku Tunggal</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Memastikan prinsip kesetaraan neraca ruas kiri dan kanan ($ax + b = c$) dipahami tanpa lompatan langkah mistis.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0f131c] border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">3</div>
                  <h4 className="text-sm font-semibold text-white">Bebas Rasa Takut Salah</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    AI ZAP tidak pernah memarahi siswa. Setiap kesalahan disambut sebagai bahan refleksi logika yang membangun rasa percaya diri.
                  </p>
                </div>
              </>
            )}

            {activeAudienceTab === "mahasiswa" && (
              <>
                <div className="p-5 rounded-2xl bg-[#0f131c] border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">1</div>
                  <h4 className="text-sm font-semibold text-white">Irisan Kerucut & Geometri 3D</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Siswa SMA dapat mengiris kerucut untuk melihat bagaimana parabola, elips, dan hiperbola terbentuk secara spasial.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0f131c] border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">2</div>
                  <h4 className="text-sm font-semibold text-white">Kalkulus Multivariabel S1–S2</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Menganalisis integral lipat dua, volume benda putar, dan bidang singgung kurva ruang berdimensi tiga secara interaktif.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0f131c] border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">3</div>
                  <h4 className="text-sm font-semibold text-white">Penalaran Formal Mahasiswa S3</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Verifikasi kekakuan bukti formal (proof rigor), pelacakan syarat singularitas, dan pencegahan kehilangan domain akar (*root loss*).
                  </p>
                </div>
              </>
            )}

            {activeAudienceTab === "pendidik" && (
              <>
                <div className="p-5 rounded-2xl bg-[#0f131c] border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">1</div>
                  <h4 className="text-sm font-semibold text-white">Solusi Anti-Kecurangan Kelas</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Guru tidak perlu khawatir siswa mencontek jawaban instan. ZAP memaksa siswa berpikir dan menuliskan jalan pikirannya sendiri.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0f131c] border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">2</div>
                  <h4 className="text-sm font-semibold text-white">Mode Proyektor Papan Tulis</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Dosen dapat memproyeksikan visualisasi matematika 3D ZAP langsung ke layar proyektor ruang kuliah untuk demonstrasi visual.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#0f131c] border border-white/[0.06] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">3</div>
                  <h4 className="text-sm font-semibold text-white">Diagnostik Presisi per Siswa</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Mengetahui secara tepat letak kesalahan konsepsi siswa: apakah pada tanda minus, hukum distributif, atau faktorisasi.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES SHOWCASE */}
      <section id="fitur" className="py-20 px-6 sm:px-12 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">
            Core Engine Features
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white">
            Arsitektur Dua Pilar: CAS Deterministik & AI Sokratik
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1: Zero-Answer Socratic CAS */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1119] border border-white/[0.08] space-y-4 hover:border-blue-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Pilar 1: Zero-Answer Policy Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ZAP tidak menggunakan LLM generatif untuk menentukan kebenaran matematika. SymPy Computer Algebra System (CAS) bertindak sebagai hakim tunggal kebenaran rumus. LLM hanya menerjemahkan temuan logika menjadi bimbingan empati tanpa pernah membocorkan hasil akhir.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sensor otomatis hasil akhir numerik ($x = \dots$)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pelacakan titik patah baris kesalahan secara presisi</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Uji kontra-contoh aritmetika instan</span>
              </li>
            </ul>
          </div>

          {/* Feature 2: 3D Spatial Canvas */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1119] border border-white/[0.08] space-y-4 hover:border-purple-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Pilar 2: Kanvas 3D & Papan Tulis Spasial</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Matematika sering terasa rumit karena hanya diajarkan di atas kertas 2D yang datar. Kanvas 3D ZAP di sisi kanan bertindak sebagai papan tulis visual interaktif untuk membedah geometri ruang, irisan kerucut, dan ekspansi polinomial.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Irisan Kerucut & Pemotongan Bidang Miring Elips</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Visualisasi Pergeseran Paraboloid Kuadrat</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Mode Proyektor Fullscreen untuk Ruang Kelas</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. UNIVERSAL MODEL CONNECTOR HUB */}
      <section id="konektor" className="py-20 px-6 sm:px-12 border-t border-white/[0.07] bg-[#080b12]">
        <div className="max-w-5xl mx-auto space-y-8 text-center">
          <div className="space-y-3">
            <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">
              Extensible Plugin Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              Universal Model Connector Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Auto Gemini aktif secara default, namun kamu bebas menghubungkan model AI favoritmu dengan API key kustom.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
            <div className="p-4 rounded-2xl bg-[#0f131c] border border-blue-500/30 text-center space-y-2">
              <Zap className="w-6 h-6 text-blue-400 mx-auto" />
              <div className="text-xs font-semibold text-white">Google Gemini</div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">Auto Cloud</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f131c] border border-white/[0.06] text-center space-y-2">
              <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
              <div className="text-xs font-semibold text-white">Claude 3.7</div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Anthropic API</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f131c] border border-white/[0.06] text-center space-y-2">
              <Globe className="w-6 h-6 text-emerald-400 mx-auto" />
              <div className="text-xs font-semibold text-white">GPT-4o Omni</div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">OpenAI API</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f131c] border border-white/[0.06] text-center space-y-2">
              <Cpu className="w-6 h-6 text-cyan-400 mx-auto" />
              <div className="text-xs font-semibold text-white">DeepSeek V4</div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">BazaarLink Free</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f131c] border border-white/[0.06] text-center space-y-2">
              <Code2 className="w-6 h-6 text-orange-400 mx-auto" />
              <div className="text-xs font-semibold text-white">Codestral 22B</div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Mistral AI</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f131c] border border-white/[0.06] text-center space-y-2">
              <Server className="w-6 h-6 text-purple-400 mx-auto" />
              <div className="text-xs font-semibold text-white">Custom API</div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">Ollama/Proxy</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DATA FLYWHEEL & SECURITY (APAKAH CHAT BISA DIBACA?) */}
      <section id="privasi" className="py-20 px-6 sm:px-12 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
            Privacy & Autonomous Training Loop
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white">
            Apakah Chat Siswa di /chat Bisa Diintip?
          </h2>
          <p className="text-sm font-semibold text-emerald-400">
            Jawabannya: TIDAK BISA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Privacy Box */}
          <div className="p-6 rounded-3xl bg-[#0d1017] border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>Proteksi Kriptografi SHA-256</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Setiap sesi obrolan di `/chat` diamankan dengan verifikasi integritas <strong>SHA-256</strong> dan enkripsi sisi klien (*client-side encrypted storage*). Data percakapan tidak dapat disadap atau dimanipulasi di tengah jalan.
            </p>
          </div>

          {/* Self-Training Loop Box */}
          <div className="p-6 rounded-3xl bg-[#0d1017] border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Database className="w-5 h-5 text-blue-400" />
              <span>Self-Training Flywheel Terkelompok</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              ZAP mengekstrak pola kesalahan aljabar abstrak secara anonim (tanpa identitas siswa). Data ini dikelompokkan otomatis oleh sistem ke kluster miskonsepsi untuk melatih model lokal ZAP agar semakin cerdas memahami kesulitan belajar siswa.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="py-24 px-6 sm:px-12 text-center border-t border-white/[0.07] bg-gradient-to-b from-[#07090e] to-[#0d121f]">
        <div className="max-w-3xl mx-auto space-y-6">
          <ZLogo className="w-12 h-12 mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Siap Mengasah Nalar Matematika?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Hentikan ketergantungan pada contekan AI. Buka ZAP sekarang dan biarkan logika berpikirmu bekerja dengan bimbingan terbaik.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/chat"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition"
            >
              <span>Masuk ke Studio ZAP</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#141824] hover:bg-[#1e2333] border border-white/[0.1] text-slate-200 text-sm font-medium flex items-center justify-center transition"
            >
              <span>Login Google (Auto Gemini)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-8 px-6 sm:px-12 border-t border-white/[0.06] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ZLogo className="w-5 h-5" />
          <span className="font-bold text-slate-300">ZAP</span>
          <span>• Zero Answer Policy • chatzap.xyz</span>
        </div>
        <div>
          <span>Logicodix 2026 Hackathon • Hak Cipta Dilindungi</span>
        </div>
      </footer>
    </div>
  );
}
