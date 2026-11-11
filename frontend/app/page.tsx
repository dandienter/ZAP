"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  GraduationCap,
  KeyRound,
  Layers,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";

import { ZapLogo } from "@/components/ZapLogo";
import {
  ClaudeLogo,
  DeepSeekLogo,
  GeminiLogo,
  MistralLogo,
  NvidiaLogo,
  OllamaLogo,
  OpenAILogo,
  SymPyLogo,
} from "@/components/CompanyLogos";
import {
  LocalEnclaveEmblem,
  ScratchpadPenEmblem,
  SmartboardSpatialEmblem,
  SocraticDialogueEmblem,
  SovereignAuditEmblem,
  SymPyCasEmblem,
  ZeroAnswerEmblem,
} from "@/components/PlatformIcons";

import ActionButton from "@/components/landing/ActionButton";
import HeroWorkspacePreview, {
  ContainerScroll,
} from "@/components/landing/HeroWorkspacePreview";
import LiveCasExplorer from "@/components/landing/LiveCasExplorer";
import LiveInteractiveShowcase from "@/components/landing/LiveInteractiveShowcase";

/* ============================================================================
 * SCROLL REVEAL WRAPPER (Matching ai.databyte.co.id IntersectionObserver Fade)
 * ========================================================================== */
function FadeInOnScroll({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ============================================================================
 * MOUSE-TRACKING RADIAL SPOTLIGHT CARD (Bottom Dark CTA Card)
 * ========================================================================== */
function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500 z-0"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${pos.x}px ${pos.y}px, rgba(212, 165, 116, 0.25), rgba(255, 255, 255, 0.05) 40%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, rgba(255, 255, 255, 0.12), transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ============================================================================
 * DATA: MEGA MENU, CAROUSEL CARDS, MARQUEE ECOSYSTEM, & FAQ
 * ========================================================================== */
interface CarouselPlanCard {
  id: string;
  category: "engine" | "curriculum";
  badge: string;
  discountBadge?: string;
  popularBadge?: string;
  name: string;
  descId: string;
  descEn: string;
  metricMain: string;
  metricUnitId: string;
  metricUnitEn: string;
  metricSub?: string;
  quotaRows: { labelId: string; labelEn: string; value: string }[];
  featuresId: string[];
  featuresEn: string[];
  ctaTextId: string;
  ctaTextEn: string;
  ctaHref: string;
  isFeatured?: boolean;
  iconType: "cas" | "smartboard" | "guardrail" | "school" | "university";
}

const CAROUSEL_PLANS: CarouselPlanCard[] = [
  {
    id: "socratic-studio",
    category: "engine",
    badge: "CORE ENGINE",
    name: "ZAP Socratic Studio",
    descId: "Ruang kerja interaktif untuk latihan derivasi aljabar & bimbingan Sokrates",
    descEn: "Interactive workspace for algebraic derivation & Socratic guidance",
    metricMain: "< 1 ms",
    metricUnitId: "/ langkah",
    metricUnitEn: "/ step",
    quotaRows: [
      { labelId: "Latensi Pre-Parse:", labelEn: "Pre-Parse Latency:", value: "< 1 ms whitelist" },
      { labelId: "Batas Eksponen:", labelEn: "Exponent Bound:", value: "Deg ≤ 100" },
      { labelId: "Arbiter Aljabar:", labelEn: "Algebraic Arbiter:", value: "SymPy CAS" },
    ],
    featuresId: [
      "Scratchpad Derivasi Multi-Baris Interaktif",
      "Deteksi Akar Hilang & Ekivalensi Aljabar",
      "Counter-Example Otomatis Saat Langkah Keliru",
      "22 / 22 Uji Keamanan Parser Terverifikasi",
    ],
    featuresEn: [
      "Interactive Multi-Line Derivation Scratchpad",
      "Lost-Root & Algebraic Equivalence Detection",
      "Automatic Counter-Example on Invalid Steps",
      "22 / 22 Verified Parser Security Tests",
    ],
    ctaTextId: "Buka Studio",
    ctaTextEn: "Open Studio",
    ctaHref: "/chat",
    iconType: "cas",
  },
  {
    id: "cfl-guardrail-pro",
    category: "engine",
    badge: "CORE ENGINE",
    popularBadge: "PALING POPULER",
    discountBadge: "ZERO LEAK",
    name: "CFL Engine + Guardrail",
    descId: "Kombinasi verifikasi simbolik deterministik & filter anti-bocoran jawaban akhir",
    descEn: "Deterministic symbolic verification paired with final-answer sanitization",
    metricMain: "64 Test",
    metricUnitId: "/ suite lulus",
    metricUnitEn: "/ suites passed",
    quotaRows: [
      { labelId: "Sanitasi Jawaban:", labelEn: "Answer Sanitizer:", value: "Regex + Token Guard" },
      { labelId: "Payload Berbahaya:", labelEn: "Malicious Payloads:", value: "5 ditolak < 1 ms" },
      { labelId: "Konektor BYOK:", labelEn: "BYOK Connector:", value: "6 Provider + Lokal" },
    ],
    featuresId: [
      "RobustZeroAnswerGuardrail.sanitize() Aktif",
      "Tidak Pernah Membocorkan Kunci Jawaban Akhir",
      "Dukungan Gemini, Claude, OpenAI, & DeepSeek",
      "Penyimpanan API Key Enklave Lokal Browser",
    ],
    featuresEn: [
      "RobustZeroAnswerGuardrail.sanitize() Active",
      "Never Leaks Final Exercise Solutions",
      "Supports Gemini, Claude, OpenAI, & DeepSeek",
      "Browser Local Enclave API Key Storage",
    ],
    ctaTextId: "Coba Sekarang",
    ctaTextEn: "Try Now",
    ctaHref: "/chat",
    isFeatured: true,
    iconType: "guardrail",
  },
  {
    id: "smartboard-spatial-3d",
    category: "engine",
    badge: "SPATIAL ENGINE",
    discountBadge: "2D & 3D LIVE",
    name: "Smartboard Geometri 3D",
    descId: "Kanvas geometri interaktif untuk bangun ruang, jaring-jaring, & kalkulus vektor",
    descEn: "Interactive geometry canvas for 3D solids, nets, & vector calculus",
    metricMain: "60 FPS",
    metricUnitId: "/ kanvas WebGL",
    metricUnitEn: "/ WebGL canvas",
    quotaRows: [
      { labelId: "Bangun Ruang 3D:", labelEn: "3D Solids:", value: "Kubus, Limas, Bola+" },
      { labelId: "Plot Fungsi:", labelEn: "Function Plots:", value: "2D & 3D Parametrik" },
      { labelId: "Sinkronisasi CAS:", labelEn: "CAS Sync:", value: "Real-Time Rumus" },
    ],
    featuresId: [
      "Rotasi Orbit 360° & Irisan Bidang (Cross-Section)",
      "Eksplorasi Volume, Luas Permukaan, & Vektor",
      "Visualisasi Titik Stasioner & Garis Singgung",
      "Terhubung Langsung ke Dialog Tutor Sokrates",
    ],
    featuresEn: [
      "360° Orbit Rotation & Plane Cross-Sections",
      "Volume, Surface Area, & Vector Exploration",
      "Stationary Point & Tangent Line Visualization",
      "Directly Linked to Socratic Tutor Dialogue",
    ],
    ctaTextId: "Buka Smartboard",
    ctaTextEn: "Open Smartboard",
    ctaHref: "/chat?mode=smartboard",
    iconType: "smartboard",
  },
  {
    id: "kurikulum-dasar-menengah",
    category: "curriculum",
    badge: "KURIKULUM TK–SMA",
    name: "Fondasi & Olimpiade Sekolah",
    descId: "Kurikulum bertahap dari pengenalan bilangan TK/SD hingga kalkulus SMA/SMK",
    descEn: "Structured progression from early numeracy to high school calculus",
    metricMain: "TK – SMA",
    metricUnitId: "/ 4 jenjang",
    metricUnitEn: "/ 4 tiers",
    metricSub: "SD · SMP · SMA · SMK",
    quotaRows: [
      { labelId: "TK & SD:", labelEn: "Preschool & Primary:", value: "Pecahan & Pola Visual" },
      { labelId: "SMP / MTs:", labelEn: "Junior High:", value: "SPLDV & Pythagoras" },
      { labelId: "SMA / Olimpiade:", labelEn: "Senior High:", value: "Limit, Turunan, Integral" },
    ],
    featuresId: [
      "Bahasa Sokrates Adaptif Sesuai Usia Siswa",
      "Deteksi Miskonsepsi Aljabar Dasar (Misal (a+b)²)",
      "Visualisasi Garis Bilangan & Bangun Datar",
      "Siap untuk Persiapan SNBT & OSN Matematika",
    ],
    featuresEn: [
      "Age-Adaptive Socratic Scaffolding Language",
      "Core Algebraic Misconception Detection",
      "Number Line & 2D Plane Geometry Visuals",
      "Built for National Exam & Olympiad Prep",
    ],
    ctaTextId: "Mulai Belajar",
    ctaTextEn: "Start Learning",
    ctaHref: "/chat",
    iconType: "school",
  },
  {
    id: "kurikulum-perguruan-tinggi",
    category: "curriculum",
    badge: "UNIVERSITAS D3–S3",
    popularBadge: "RISET & KAMPUS",
    name: "Sains, Teknik, & Pascasarjana",
    descId: "Pendamping pembuktian formal untuk mahasiswa sarjana hingga riset doktoral",
    descEn: "Formal proof companion for undergraduate STEM to doctoral research",
    metricMain: "S1 – S3",
    metricUnitId: "/ riset formal",
    metricUnitEn: "/ formal research",
    metricSub: "Aljabar Linear · PDB · Analisis Real",
    quotaRows: [
      { labelId: "S1 / D4 STEM:", labelEn: "Undergraduate:", value: "Nilai Eigen & Matriks" },
      { labelId: "S2 Magister:", labelEn: "Master's Level:", value: "Optimisasi & Tensor" },
      { labelId: "S3 Doktoral:", labelEn: "Doctoral Level:", value: "Verifikasi Lemma Simbolik" },
    ],
    featuresId: [
      "Audit Langkah Pembuktian & Konservasi Akar",
      "Dukungan Notasi LaTeX Aman (_is_safe_latex)",
      "Integrasi Ollama Lokal untuk Riset Offline",
      "Ekspor Riwayat Derivasi Terverifikasi",
    ],
    featuresEn: [
      "Proof Step Auditing & Root Conservation",
      "Safe LaTeX Notation Support (_is_safe_latex)",
      "Local Ollama Integration for Offline Research",
      "Export Verified Derivation Transcripts",
    ],
    ctaTextId: "Buka Workspace Kampus",
    ctaTextEn: "Open Campus Workspace",
    ctaHref: "/chat",
    isFeatured: true,
    iconType: "university",
  },
  {
    id: "byok-connector-hub",
    category: "engine",
    badge: "PRIVASI & BYOK",
    name: "Konektor Multi-LLM & Ollama",
    descId: "Gunakan API key pribadi atau model lokal di mesin Anda tanpa biaya langganan",
    descEn: "Bring your own API key or run local models on your machine with zero markup",
    metricMain: "Rp 0",
    metricUnitId: "/ platform fee",
    metricUnitEn: "/ platform fee",
    metricSub: "100% Client-Side Key Vault",
    quotaRows: [
      { labelId: "Cloud Providers:", labelEn: "Cloud Providers:", value: "Gemini, OpenAI, Claude" },
      { labelId: "Open Weights:", labelEn: "Open Weights:", value: "DeepSeek, Mistral, NVIDIA" },
      { labelId: "Eksekusi Offline:", labelEn: "Offline Execution:", value: "Ollama 127.0.0.1:11434" },
    ],
    featuresId: [
      "API Key Tersimpan di localStorage Browser Anda",
      "Kepatuhan Penuh Privasi Data (UU PDP No. 27/2022)",
      "Fallback Socratic Lokal Otomatis Tanpa Internet",
      "Pengaturan Model 1-Klik di Halaman Konektor",
    ],
    featuresEn: [
      "API Keys Stored Strictly in Browser localStorage",
      "Aligned with Indonesian Data Privacy (UU PDP)",
      "Automatic Offline Local Socratic Fallback",
      "1-Click Model Setup in Connector Hub",
    ],
    ctaTextId: "Atur Konektor AI",
    ctaTextEn: "Configure AI Connector",
    ctaHref: "/connector",
    iconType: "guardrail",
  },
];

const MARQUEE_ROW_1 = [
  { name: "SymPy CAS", sub: "Symbolic Kernel", icon: <SymPyLogo className="w-5 h-5 text-[#3B5526]" /> },
  { name: "Google Gemini", sub: "Gemini 2.5 Flash", icon: <GeminiLogo className="w-5 h-5" /> },
  { name: "Claude", sub: "Anthropic Sonnet", icon: <ClaudeLogo className="w-5 h-5 text-[#D97757]" /> },
  { name: "OpenAI", sub: "GPT-4o & o3-mini", icon: <OpenAILogo className="w-5 h-5 text-zinc-900" /> },
  { name: "DeepSeek", sub: "R1 & V3 Reasoning", icon: <DeepSeekLogo className="w-5 h-5 text-blue-600" /> },
  { name: "Mistral AI", sub: "Codestral & Large", icon: <MistralLogo className="w-5 h-5 text-orange-500" /> },
  { name: "Ollama Local", sub: "Offline Inference", icon: <OllamaLogo className="w-5 h-5 text-zinc-900" /> },
  { name: "NVIDIA NIM", sub: "TensorRT Acceleration", icon: <NvidiaLogo className="w-5 h-5 text-[#76B900]" /> },
];

const MARQUEE_ROW_2 = [
  { name: "Zero-Answer Guard", sub: "Anti-Spoiler Filter", icon: <ZeroAnswerEmblem className="w-5 h-5 text-[#8f5e32]" /> },
  { name: "CFL Verifier", sub: "< 1 ms Pre-Parse", icon: <SymPyCasEmblem className="w-5 h-5 text-emerald-600" /> },
  { name: "Smartboard 3D", sub: "Spatial Geometry", icon: <SmartboardSpatialEmblem className="w-5 h-5 text-[#09090b]" /> },
  { name: "Scratchpad CAS", sub: "Step-by-Step Audit", icon: <ScratchpadPenEmblem className="w-5 h-5 text-[#8f5e32]" /> },
  { name: "Socratic Engine", sub: "Guided Discovery", icon: <SocraticDialogueEmblem className="w-5 h-5 text-[#09090b]" /> },
  { name: "Local Enclave", sub: "BYOK Vault", icon: <LocalEnclaveEmblem className="w-5 h-5 text-[#8f5e32]" /> },
  { name: "UU PDP Ready", sub: "Zero Server Key Log", icon: <SovereignAuditEmblem className="w-5 h-5 text-emerald-700" /> },
  { name: "LaTeX Whitelist", sub: "Anti-RCE & Anti-DoS", icon: <Code2 className="w-5 h-5 text-[#09090b]" /> },
];

const FAQ_ITEMS = [
  {
    qId: "Apa bedanya ChatZAP dengan ChatGPT atau AI penjawab soal biasa?",
    qEn: "How is ChatZAP different from standard ChatGPT or homework-solver AIs?",
    aId: "AI generatif biasa langsung memberikan jawaban akhir dan sering mengalami halusinasi perhitungan. ChatZAP memisahkan kebenaran matematika (diverifikasi secara deterministik oleh SymPy Computer Algebra System di backend) dari percakapan tutor. Selain itu, semua respons wajib melewati RobustZeroAnswerGuardrail sehingga jawaban akhir tidak pernah bocor—siswa dibimbing menemukan solusinya sendiri.",
    aEn: "Standard generative AIs immediately hand over final answers and frequently hallucinate arithmetic. ChatZAP strictly separates mathematical truth (verified deterministically by the backend SymPy Computer Algebra System) from conversational tutoring. Every response passes through RobustZeroAnswerGuardrail so final solutions never leak—guiding students to discover the proof themselves.",
  },
  {
    qId: "Bagaimana cara kerja verifikasi simbolik CFL Engine & SymPy CAS?",
    qEn: "How does the CFL Engine & SymPy CAS symbolic verification work?",
    aId: "Saat Anda menuliskan langkah aljabar di Scratchpad (misalnya dari 2x + 6 = 14 ke 2x = 8), backend memeriksa keamanan input dengan whitelist (< 1 ms, batas derajat eksponen ≤ 100), lalu menguji ekivalensi simbolik P(x) - Q(x) = 0 serta konservasi himpunan akar. Jika ada akar yang hilang (seperti membagi x² = 2x dengan x) atau tanda yang keliru, sistem menghasilkan counter-example konkret.",
    aEn: "When you enter an algebraic step in the Scratchpad (e.g., from 2x + 6 = 14 to 2x = 8), the backend validates input safety via a whitelist (< 1 ms, exponent degree bound ≤ 100), then tests symbolic equivalence P(x) - Q(x) = 0 and root conservation. If a root is lost (such as dividing x² = 2x by x) or a sign flips, the engine generates a concrete counter-example.",
  },
  {
    qId: "Model AI apa saja yang bisa dihubungkan ke ChatZAP?",
    qEn: "Which AI models can I connect to ChatZAP?",
    aId: "Melalui halaman Konektor BYOK (/connector), Anda dapat menghubungkan Google Gemini, OpenAI (GPT-4o), Anthropic Claude, DeepSeek, Mistral, NVIDIA NIM, maupun model lokal gratis melalui Ollama (http://127.0.0.1:11434). Bahkan tanpa API key sekalipun, mesin Socratic fallback lokal tetap bekerja penuh.",
    aEn: "Through the BYOK Connector Hub (/connector), you can connect Google Gemini, OpenAI (GPT-4o), Anthropic Claude, DeepSeek, Mistral, NVIDIA NIM, or free local models via Ollama (http://127.0.0.1:11434). Even without an external API key, the built-in deterministic Socratic fallback engine remains fully functional.",
  },
  {
    qId: "Apakah API Key saya aman dan sesuai dengan privasi data?",
    qEn: "Are my API keys secure and privacy-compliant?",
    aId: "Ya. Kunci API BYOK disimpan di penyimpanan lokal browser Anda (localStorage enclave) dan tidak pernah disimpan permanen di database server publik. Pendekatan zero-persistence ini dirancang selaras dengan prinsip pelindungan data pribadi (UU PDP No. 27 Tahun 2022).",
    aEn: "Yes. Your BYOK API keys reside in your browser's local storage enclave and are never persisted in a public server database. This zero-persistence architecture aligns with Indonesian Personal Data Protection principles (UU PDP No. 27/2022).",
  },
  {
    qId: "Jenjang pendidikan apa saja yang didukung oleh ChatZAP?",
    qEn: "Which education levels are supported by ChatZAP?",
    aId: "ChatZAP mendukung spektrum lengkap dari TK/PAUD & SD (aritmatika visual, pecahan), SMP (aljabar linear, SPLDV, teorema Pythagoras), SMA/SMK (limit, turunan, integral, matriks, trigonometri), hingga Perguruan Tinggi D3–S3 (aljabar linear lanjut, persamaan diferensial, dan verifikasi langkah pembuktian).",
    aEn: "ChatZAP supports the full educational spectrum from Preschool & Primary (visual arithmetic, fractions), Junior High (linear algebra, systems of equations, Pythagoras), Senior High (limits, derivatives, integrals, matrices), up to University & Doctoral tiers (advanced linear algebra, differential equations, and symbolic proof auditing).",
  },
  {
    qId: "Kapan fitur Waiting List (Olimpiade & LMS Kampus) dirilis?",
    qEn: "When will the Waiting List modules (Olympiad & Campus LMS) launch?",
    aId: "Modul Bank Soal Olimpiade & SNBT, Analitik Kelas Guru/Dosen, serta Integrasi LTI Canvas/Moodle sedang dalam tahap uji coba terbatas. Anda dapat mendaftarkan email di halaman ini untuk mendapatkan akses prioritas begitu modul dibuka.",
    aEn: "The Olympiad & National Exam Arena, Classroom Misconception Analytics for Educators, and Canvas/Moodle LTI Integration are currently in private beta. You can join the waiting list right on this page for priority access.",
  },
];

/* ============================================================================
 * MAIN LANDING PAGE COMPONENT
 * ========================================================================== */
export default function LandingPage() {
  const [lang, setLang] = useState<"id" | "en">("id");
  const [scrolled, setScrolled] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Carousel state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [planCategory, setPlanCategory] = useState<"all" | "engine" | "curriculum">("all");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Waitlist Modal state
  const [waitlistProduct, setWaitlistProduct] = useState<string | null>(null);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  // Restore saved language preference
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("chatzap_lang");
      if (saved === "id" || saved === "en") {
        setLang(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleLanguage = (nextLang: "id" | "en") => {
    setLang(nextLang);
    try {
      window.localStorage.setItem("chatzap_lang", nextLang);
    } catch {
      // ignore storage errors
    }
  };

  // Scroll listener for floating pill header morph
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Filtered carousel items
  const filteredPlans = CAROUSEL_PLANS.filter((item) => {
    if (planCategory === "all") return true;
    return item.category === planCategory;
  });

  const scrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({
      left: dir === "left" ? -380 : 380,
      behavior: "smooth",
    });
  };

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft } = carouselRef.current;
    const idx = Math.round(scrollLeft / 364);
    setActiveSlideIndex(Math.min(Math.max(idx, 0), filteredPlans.length - 1));
  };

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    href: string
  ) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setMegaMenuOpen(false);
    setMobileMenuOpen(false);
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openWaitlist = (productName: string) => {
    setWaitlistProduct(productName);
    setWaitlistSubmitted(false);
    setMegaMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#09090b] font-sans selection:bg-[#d4a574]/30 selection:text-black overflow-x-clip">
      {/* ====================================================================
       * 1. FLOATING PILL SCROLL-MORPHING HEADER (ai.databyte.co.id style)
       * ==================================================================== */}
      <header className="sticky top-0 z-50 w-full transition-all duration-500 ease-out">
        <div
          className={`mx-auto transition-all duration-500 ease-out ${
            scrolled
              ? "max-w-5xl mt-3 px-4 py-2.5 bg-white/85 backdrop-blur-xl border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full"
              : "max-w-6xl px-6 py-4 bg-[#faf9f6]/80 backdrop-blur-md border-b border-black/5"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold text-base tracking-tight shrink-0 pl-1 group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#09090b] text-white flex items-center justify-center shadow-sm group-hover:bg-[#c4956a] transition-colors">
                <ZapLogo className="w-4 h-4" />
              </div>
              <span>
                ChatZAP <span className="font-normal text-zinc-400">Engine</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm text-zinc-600">
              {/* Mega Menu Trigger */}
              <div
                className="relative"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setMegaMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-200 font-medium ${
                    megaMenuOpen
                      ? "bg-zinc-900/5 text-black"
                      : "hover:text-black hover:bg-zinc-900/[0.03]"
                  }`}
                >
                  <span>{lang === "id" ? "Layanan & Modul" : "Modules & Suite"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-300 ${
                      megaMenuOpen ? "rotate-180 text-black" : ""
                    }`}
                  />
                </button>

                {/* 2-Column Framer Motion Mega Menu Dropdown */}
                <AnimatePresence>
                  {megaMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[660px] z-50"
                    >
                      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 shadow-[0_24px_60px_-15px_rgba(9,9,11,0.12)] p-5 grid grid-cols-12 gap-5">
                        {/* Left Column: Live Modules */}
                        <div className="col-span-7 space-y-3">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                              {lang === "id" ? "Ruang Kerja & Mesin CAS" : "Workspace & CAS Engine"}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                              LIVE READY
                            </span>
                          </div>

                          <div className="space-y-1">
                            <Link
                              href="/chat"
                              onClick={() => setMegaMenuOpen(false)}
                              className="group flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-[#faf9f6] border border-transparent hover:border-zinc-200/70 transition-all"
                            >
                              <div className="w-10 h-10 rounded-xl bg-[#faf9f6] border border-zinc-200/80 flex items-center justify-center shrink-0 text-[#8f5e32] group-hover:bg-[#09090b] group-hover:text-[#d4a574] group-hover:border-[#09090b] transition-colors shadow-sm">
                                <Sparkles className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-[#09090b]">
                                    ZAP Socratic Studio
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-zinc-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[#09090b] transition-all" />
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-1">
                                  {lang === "id"
                                    ? "Scratchpad derivasi aljabar & dialog Sokrates tanpa bocoran jawaban"
                                    : "Algebraic derivation scratchpad & zero-spoiler Socratic dialogue"}
                                </p>
                              </div>
                            </Link>

                            <Link
                              href="/chat?mode=smartboard"
                              onClick={() => setMegaMenuOpen(false)}
                              className="group flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-[#faf9f6] border border-transparent hover:border-zinc-200/70 transition-all"
                            >
                              <div className="w-10 h-10 rounded-xl bg-[#faf9f6] border border-zinc-200/80 flex items-center justify-center shrink-0 text-[#09090b] group-hover:bg-[#09090b] group-hover:text-[#d4a574] group-hover:border-[#09090b] transition-colors shadow-sm">
                                <Boxes className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-[#09090b]">
                                    {lang === "id" ? "Smartboard Geometri 2D & 3D" : "2D & 3D Spatial Smartboard"}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-zinc-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[#09090b] transition-all" />
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-1">
                                  {lang === "id"
                                    ? "Visualisasi bangun ruang, irisan bidang, & grafik fungsi interaktif"
                                    : "Interactive 3D solids, plane cross-sections, & function plots"}
                                </p>
                              </div>
                            </Link>

                            <a
                              href="#explorer"
                              onClick={(e) => scrollToSection(e, "#explorer")}
                              className="group flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-[#faf9f6] border border-transparent hover:border-zinc-200/70 transition-all"
                            >
                              <div className="w-10 h-10 rounded-xl bg-[#faf9f6] border border-zinc-200/80 flex items-center justify-center shrink-0 text-emerald-700 group-hover:bg-[#09090b] group-hover:text-[#d4a574] group-hover:border-[#09090b] transition-colors shadow-sm">
                                <Cpu className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-[#09090b]">
                                    SymPy CAS Diagnostic Sandbox
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-zinc-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[#09090b] transition-all" />
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-1">
                                  {lang === "id"
                                    ? "Uji langsung ekivalensi aljabar & konservasi akar di halaman ini"
                                    : "Test symbolic equivalence & root conservation live on this page"}
                                </p>
                              </div>
                            </a>

                            <Link
                              href="/connector"
                              onClick={() => setMegaMenuOpen(false)}
                              className="group flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-[#faf9f6] border border-transparent hover:border-zinc-200/70 transition-all"
                            >
                              <div className="w-10 h-10 rounded-xl bg-[#faf9f6] border border-zinc-200/80 flex items-center justify-center shrink-0 text-[#8f5e32] group-hover:bg-[#09090b] group-hover:text-[#d4a574] group-hover:border-[#09090b] transition-colors shadow-sm">
                                <KeyRound className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-[#09090b]">
                                    BYOK Multi-LLM &amp; Ollama Hub
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-zinc-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[#09090b] transition-all" />
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-1">
                                  {lang === "id"
                                    ? "Hubungkan Gemini, OpenAI, Claude, DeepSeek, atau Ollama lokal"
                                    : "Connect Gemini, OpenAI, Claude, DeepSeek, or local Ollama"}
                                </p>
                              </div>
                            </Link>
                          </div>
                        </div>

                        {/* Right Column: Coming Soon / Ecosystem */}
                        <div className="col-span-5 bg-[#faf9f6] rounded-2xl p-4 border border-zinc-200/80 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                                {lang === "id" ? "Ekosistem Segera Hadir" : "Upcoming Ecosystem"}
                              </span>
                              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#faf4ed] text-[#8f5e32] border border-[#d4a574]/40">
                                Waitlist
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {[
                                {
                                  name: lang === "id" ? "Arena Olimpiade & SNBT" : "Olympiad & SNBT Arena",
                                  desc: lang === "id" ? "Simulasi soal HOTS terverifikasi CAS" : "CAS-verified HOTS problem sets",
                                  icon: GraduationCap,
                                },
                                {
                                  name: lang === "id" ? "Analitik Kelas Guru & Dosen" : "Educator Class Analytics",
                                  desc: lang === "id" ? "Peta miskonsepsi aljabar satu kelas" : "Class-wide misconception heatmaps",
                                  icon: Users,
                                },
                                {
                                  name: lang === "id" ? "Integrasi LMS Canvas & Moodle" : "Canvas & Moodle LTI Plugin",
                                  desc: lang === "id" ? "Plugin tugas anti-contek otomatis" : "Zero-spoiler assignment LTI plugin",
                                  icon: Layers,
                                },
                              ].map((wItem) => {
                                const WIcon = wItem.icon;
                                return (
                                  <button
                                    key={wItem.name}
                                    type="button"
                                    onClick={() => openWaitlist(wItem.name)}
                                    className="w-full text-left group flex items-center gap-2.5 p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-600 group-hover:text-[#8f5e32] transition-colors shrink-0 shadow-sm">
                                      <WIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-semibold text-[#09090b] truncate">
                                        {wItem.name}
                                      </div>
                                      <div className="text-[10px] text-zinc-500 truncate">
                                        {wItem.desc}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-zinc-200/80 flex items-center justify-between">
                            <div>
                              <div className="text-[11px] font-semibold text-[#09090b]">
                                {lang === "id" ? "Siap mencoba sekarang?" : "Ready to start?"}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                {lang === "id" ? "Tanpa kartu kredit · Langsung aktif" : "No credit card · Instant access"}
                              </div>
                            </div>
                            <Link
                              href="/chat"
                              onClick={() => setMegaMenuOpen(false)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#8f5e32] hover:text-[#09090b] transition-colors"
                            >
                              <span>Studio</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a
                href="#explorer"
                onClick={(e) => scrollToSection(e, "#explorer")}
                className="px-3.5 py-1.5 rounded-full hover:text-black hover:bg-zinc-900/[0.03] transition-colors"
              >
                {lang === "id" ? "Uji CAS" : "CAS Explorer"}
              </a>
              <a
                href="#showcase"
                onClick={(e) => scrollToSection(e, "#showcase")}
                className="px-3.5 py-1.5 rounded-full hover:text-black hover:bg-zinc-900/[0.03] transition-colors"
              >
                {lang === "id" ? "Simulasi Live" : "Live Demo"}
              </a>
              <a
                href="#jenjang"
                onClick={(e) => scrollToSection(e, "#jenjang")}
                className="px-3.5 py-1.5 rounded-full hover:text-black hover:bg-zinc-900/[0.03] transition-colors"
              >
                {lang === "id" ? "Modul & Jenjang" : "Modules & Tiers"}
              </a>
              <Link
                href="/connector"
                className="px-3.5 py-1.5 rounded-full hover:text-black hover:bg-zinc-900/[0.03] transition-colors"
              >
                {lang === "id" ? "Konektor BYOK" : "BYOK Connector"}
              </Link>
              <a
                href="#faq"
                onClick={(e) => scrollToSection(e, "#faq")}
                className="px-3.5 py-1.5 rounded-full hover:text-black hover:bg-zinc-900/[0.03] transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* Right Actions: Language Pill Toggle + Dashboard CTA */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Language Switcher Pill (Exact ai.databyte.co.id style) */}
              <div className="inline-flex items-center bg-zinc-200/75 p-0.5 rounded-full text-xs font-medium border border-zinc-300/50">
                <button
                  type="button"
                  onClick={() => toggleLanguage("en")}
                  className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
                    lang === "en"
                      ? "bg-[#09090b] text-white font-semibold shadow-sm"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => toggleLanguage("id")}
                  className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
                    lang === "id"
                      ? "bg-[#09090b] text-white font-semibold shadow-sm"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  ID
                </button>
              </div>

              {/* Primary Header CTA */}
              <div className="hidden sm:block">
                <ActionButton
                  href="/chat"
                  variant="black"
                  size="sm"
                  icon={<Zap className="w-3.5 h-3.5 text-[#d4a574] fill-[#d4a574]" />}
                >
                  {lang === "id" ? "Buka Studio" : "Open Studio"}
                </ActionButton>
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle Menu"
                className="md:hidden w-9 h-9 rounded-full bg-zinc-900/5 hover:bg-zinc-900/10 flex items-center justify-center text-zinc-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mx-4 mt-2 rounded-3xl bg-white/95 backdrop-blur-xl border border-zinc-200 shadow-xl p-5 space-y-4"
            >
              <div className="grid grid-cols-1 gap-1.5 text-sm font-medium text-zinc-700">
                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#faf4ed] border border-[#d4a574]/35 text-[#09090b] font-semibold"
                >
                  <span>ZAP Socratic Studio</span>
                  <ArrowRight className="w-4 h-4 text-[#8f5e32]" />
                </Link>
                <Link
                  href="/chat?mode=smartboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#faf9f6]"
                >
                  <span>{lang === "id" ? "Smartboard Geometri 3D" : "3D Geometry Smartboard"}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                </Link>
                <a
                  href="#explorer"
                  onClick={(e) => scrollToSection(e, "#explorer")}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-[#faf9f6]"
                >
                  {lang === "id" ? "Uji Simbolik SymPy CAS" : "SymPy CAS Explorer"}
                </a>
                <a
                  href="#showcase"
                  onClick={(e) => scrollToSection(e, "#showcase")}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-[#faf9f6]"
                >
                  {lang === "id" ? "Simulasi Terminal & Studio" : "Live Terminal & Studio"}
                </a>
                <a
                  href="#jenjang"
                  onClick={(e) => scrollToSection(e, "#jenjang")}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-[#faf9f6]"
                >
                  {lang === "id" ? "Modul & Kurikulum TK–S3" : "Modules & Curriculum"}
                </a>
                <Link
                  href="/connector"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-[#faf9f6]"
                >
                  {lang === "id" ? "Konektor BYOK & Ollama" : "BYOK & Ollama Connector"}
                </Link>
                <a
                  href="#faq"
                  onClick={(e) => scrollToSection(e, "#faq")}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-[#faf9f6]"
                >
                  FAQ
                </a>
              </div>
              <div className="pt-2 border-t border-zinc-100 flex justify-center">
                <ActionButton href="/chat" variant="black" size="md" className="w-full justify-between">
                  {lang === "id" ? "Buka ZAP Studio Sekarang" : "Open ZAP Studio Now"}
                </ActionButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* ====================================================================
         * 2. HERO SECTION WITH 3D PERSPECTIVE SCROLL CONTAINER
         * ==================================================================== */}
        <section className="relative pt-4 pb-12 px-6 overflow-hidden">
          {/* Ambient radial glows matching warm editorial palette */}
          <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-gradient-to-tr from-[#d4a574]/15 via-[#c4956a]/10 to-transparent blur-3xl -z-10 rounded-full" />

          <ContainerScroll
            titleComponent={
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/80 text-xs font-mono font-semibold text-[#8f5e32] mb-5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {lang === "id"
                      ? "SymPy CAS Kernel · Zero-Answer Guardrail · 2D & 3D Smartboard"
                      : "SymPy CAS Kernel · Zero-Answer Guardrail · 2D & 3D Smartboard"}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#09090b] mb-6 leading-[1.12]">
                  {lang === "id" ? (
                    <>
                      Platform Penalaran Matematika &amp; CAS.{" "}
                      <span className="font-serif font-normal text-[#c4956a] block sm:inline">
                        Zero Answer Leaks!
                      </span>
                    </>
                  ) : (
                    <>
                      All-in-One Symbolic Math &amp; Socratic AI.{" "}
                      <span className="font-serif font-normal text-[#c4956a] block sm:inline">
                        Zero Answer Leaks!
                      </span>
                    </>
                  )}
                </h1>
                <p className="text-base sm:text-lg text-zinc-500 mb-9 max-w-2xl mx-auto leading-relaxed">
                  {lang === "id"
                    ? "Verifikasi setiap langkah aljabar dengan SymPy Computer Algebra System (< 1 ms pre-parse), eksplorasi geometri 3D interaktif, dan bimbingan Sokrates dari jenjang TK hingga S3 dalam satu ruang kerja."
                    : "Verify every algebraic derivation step with our deterministic SymPy Computer Algebra System (< 1 ms pre-parse), explore 3D spatial geometry, and experience Socratic tutoring from primary school to doctoral research."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
                  <ActionButton href="/chat" variant="black" size="lg">
                    {lang === "id" ? "Buka ZAP Studio" : "Open ZAP Studio"}
                  </ActionButton>
                  <ActionButton
                    href="#jenjang"
                    onClick={(e) => scrollToSection(e, "#jenjang")}
                    variant="outline"
                    size="lg"
                  >
                    {lang === "id" ? "Eksplorasi Ekosistem" : "Explore Ecosystem"}
                  </ActionButton>
                </div>
              </div>
            }
          >
            <HeroWorkspacePreview
              lang={lang}
              onOpenWaitingList={(product) => openWaitlist(product.title)}
            />
          </ContainerScroll>

          {/* 3-Column Feature Strip below the Hero 3D frame */}
          <FadeInOnScroll className="max-w-5xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/80 border border-zinc-200/80 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#faf4ed] border border-[#d4a574]/35 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-[#8f5e32]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#09090b]">
                  {lang === "id" ? "Verifikasi Simbolik < 1 ms" : "< 1 ms Pre-Parse Verification"}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {lang === "id"
                    ? "Whitelist aljabar & LaTeX memeriksa batas eksponen (≤ 100) sebelum dievaluasi oleh kernel SymPy CAS."
                    : "Strict algebraic & LaTeX whitelist validates exponent bounds (≤ 100) prior to SymPy CAS evaluation."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/80 border border-zinc-200/80 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#faf4ed] border border-[#d4a574]/35 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-[#8f5e32]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#09090b]">
                  {lang === "id" ? "Zero-Answer Guardrail Aktif" : "Zero-Answer Guardrail Active"}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {lang === "id"
                    ? "Semua respons disaring oleh RobustZeroAnswerGuardrail agar kunci jawaban akhir tidak pernah bocor."
                    : "Every explanation passes through RobustZeroAnswerGuardrail so final exercise solutions never leak."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/80 border border-zinc-200/80 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#faf4ed] border border-[#d4a574]/35 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4 text-[#8f5e32]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#09090b]">
                  {lang === "id" ? "Dialog Sokrates & Counter-Example" : "Socratic Dialogue & Counter-Examples"}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {lang === "id"
                    ? "Saat langkah keliru, mesin otomatis menyusun uji substitusi angka konkret untuk memicu pemahaman."
                    : "When a derivation step fails, the engine synthesizes concrete numerical counter-examples."}
                </p>
              </div>
            </div>
          </FadeInOnScroll>
        </section>

        {/* ====================================================================
         * 3. WARM GOLD GRADIENT INTERACTIVE CAS & GEOMETRY EXPLORER BANNER
         * ==================================================================== */}
        <FadeInOnScroll>
          <LiveCasExplorer lang={lang} />
        </FadeInOnScroll>

        {/* ====================================================================
         * 4. LIVE INTERACTIVE SHOWCASE (TERMINAL + STUDIO AUTO-TYPING DEMO)
         * ==================================================================== */}
        <FadeInOnScroll>
          <LiveInteractiveShowcase lang={lang} />
        </FadeInOnScroll>

        {/* ====================================================================
         * 5. HORIZONTAL SNAP-SCROLL CAROUSEL (Pilihan Modul & Jenjang)
         * ==================================================================== */}
        <FadeInOnScroll>
          <section id="jenjang" className="py-16 px-6 max-w-6xl mx-auto border-t border-zinc-200/60">
            {/* Header + Filter Pills + Slide Counter */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200/80 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8f5e32] mb-3 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c4956a]" />
                  {lang === "id" ? "MODUL & KURIKULUM" : "MODULES & CURRICULUM"}
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#09090b] mb-3">
                  {lang === "id" ? (
                    <>
                      Pilihan Modul Unggulan{" "}
                      <span className="font-serif font-normal text-[#c4956a]">
                        Tanpa Contek Instan
                      </span>
                    </>
                  ) : (
                    <>
                      Featured Verification Modules &amp;{" "}
                      <span className="font-serif font-normal text-[#c4956a]">
                        Curriculum Tiers
                      </span>
                    </>
                  )}
                </h2>
                <p className="text-zinc-500 text-sm max-w-lg mb-5 leading-relaxed">
                  {lang === "id"
                    ? "Akses penuh ruang kerja aljabar simbolik, kanvas geometri 3D, dan kurikulum bertahap dari TK hingga riset doktoral S3."
                    : "Full access to the symbolic algebra scratchpad, 3D spatial geometry canvas, and structured curricula from preschool to doctoral research."}
                </p>

                {/* Category Filter Pills (Matching ai.databyte.co.id) */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPlanCategory("all");
                      setActiveSlideIndex(0);
                      carouselRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
                      planCategory === "all"
                        ? "bg-[#09090b] text-white shadow-sm"
                        : "bg-white border border-zinc-200/90 text-zinc-600 hover:border-zinc-300 hover:text-[#09090b]"
                    }`}
                  >
                    {lang === "id" ? "Semua Modul" : "All Modules"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlanCategory("engine");
                      setActiveSlideIndex(0);
                      carouselRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                      planCategory === "engine"
                        ? "bg-[#09090b] text-white shadow-sm"
                        : "bg-white border border-zinc-200/90 text-zinc-600 hover:border-zinc-300 hover:text-[#09090b]"
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#c4956a]" />
                    <span>{lang === "id" ? "Core Engine & CAS" : "Core Engine & CAS"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlanCategory("curriculum");
                      setActiveSlideIndex(0);
                      carouselRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                      planCategory === "curriculum"
                        ? "bg-[#09090b] text-white shadow-sm"
                        : "bg-white border border-zinc-200/90 text-zinc-600 hover:border-zinc-300 hover:text-[#09090b]"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-[#c4956a]" />
                    <span>{lang === "id" ? "Kurikulum TK – S3" : "Curriculum TK – PhD"}</span>
                  </button>
                </div>
              </div>

              {/* Right Counter & Prev/Next Buttons */}
              <div className="flex items-center gap-3 self-end">
                <span className="text-xs font-mono text-zinc-400 mr-1">
                  <strong className="text-[#09090b]">
                    {String(activeSlideIndex + 1).padStart(2, "0")}
                  </strong>{" "}
                  / {String(filteredPlans.length).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => scrollCarousel("left")}
                  aria-label="Slide Sebelumnya"
                  className="w-10 h-10 rounded-full border border-zinc-200 bg-white flex items-center justify-center hover:bg-[#faf9f6] hover:border-zinc-300 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-700" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("right")}
                  aria-label="Slide Berikutnya"
                  className="w-10 h-10 rounded-full border border-zinc-200 bg-white flex items-center justify-center hover:bg-[#faf9f6] hover:border-zinc-300 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-zinc-700" />
                </button>
              </div>
            </div>

            {/* Snap-Mandatory Horizontal Cards Container */}
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex gap-6 overflow-x-auto pb-6 pt-4 px-1 snap-x snap-mandatory no-scrollbar"
            >
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`min-w-[300px] sm:min-w-[345px] max-w-[345px] rounded-3xl p-6 flex flex-col justify-between snap-start shrink-0 transition-all duration-300 hover:-translate-y-1 relative ${
                    plan.isFeatured
                      ? "bg-gradient-to-b from-[#fffdf9] to-white border-2 border-[#c4956a] shadow-[0_14px_40px_-12px_rgba(196,149,106,0.28)]"
                      : "bg-white border border-zinc-200/90 shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Top Popular Floating Pill Badge */}
                  {plan.popularBadge && (
                    <div className="absolute -top-3 left-6 inline-flex items-center gap-1 bg-gradient-to-r from-[#b88655] to-[#d4a574] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      <Zap className="w-3 h-3 fill-white" />
                      <span>{plan.popularBadge}</span>
                    </div>
                  )}

                  <div>
                    {/* Category & Highlight Badge Row */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 bg-[#f5f3ef] border border-zinc-200/80 px-3 py-1 rounded-full">
                        {plan.category === "engine" ? (
                          <Cpu className="w-3 h-3 text-[#8f5e32]" />
                        ) : (
                          <GraduationCap className="w-3 h-3 text-[#8f5e32]" />
                        )}
                        <span>{plan.badge}</span>
                      </div>
                      {plan.discountBadge && (
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#faf4ed] text-[#8f5e32] border border-[#d4a574]/45">
                          {plan.discountBadge}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-bold text-[#09090b] mb-1 tracking-tight">{plan.name}</h3>
                    <p className="text-xs text-zinc-500 mb-5 min-h-[34px] leading-relaxed">
                      {lang === "id" ? plan.descId : plan.descEn}
                    </p>

                    {/* Metric Display */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold tracking-tight text-[#09090b] font-mono">
                          {plan.metricMain}
                        </span>
                        <span className="text-xs text-zinc-400 font-normal">
                          {lang === "id" ? plan.metricUnitId : plan.metricUnitEn}
                        </span>
                      </div>
                      {plan.metricSub ? (
                        <div className="text-[11px] text-[#8f5e32] font-mono mt-0.5 font-medium">
                          {plan.metricSub}
                        </div>
                      ) : (
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          Deterministic SymPy CAS
                        </div>
                      )}
                    </div>

                    {/* Monospace Spec Box (Warm Editorial Style) */}
                    <div className="bg-[#faf9f6] rounded-2xl p-3.5 mb-5 border border-zinc-200/80 space-y-2 text-xs font-mono">
                      {plan.quotaRows.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          className={`flex justify-between items-center ${
                            rIdx === plan.quotaRows.length - 1
                              ? "pt-1.5 border-t border-zinc-200/70"
                              : ""
                          }`}
                        >
                          <span className="text-zinc-500">
                            {lang === "id" ? row.labelId : row.labelEn}
                          </span>
                          <span className="font-bold text-[#09090b]">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Feature Checklist */}
                    <ul className="space-y-2.5 text-xs text-zinc-600 mb-6">
                      {(lang === "id" ? plan.featuresId : plan.featuresEn).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Bottom ActionButton */}
                  <ActionButton
                    href={plan.ctaHref}
                    variant={plan.isFeatured ? "gold" : "black"}
                    size="md"
                    className="w-full justify-between"
                  >
                    {lang === "id" ? plan.ctaTextId : plan.ctaTextEn}
                  </ActionButton>
                </div>
              ))}
            </div>

            {/* Carousel Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {filteredPlans.map((plan, idx) => (
                <button
                  key={plan.id}
                  type="button"
                  aria-label={`Ke kartu ${idx + 1}`}
                  onClick={() => {
                    carouselRef.current?.scrollTo({
                      left: idx * 364,
                      behavior: "smooth",
                    });
                    setActiveSlideIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeSlideIndex === idx
                      ? "w-6 bg-zinc-900"
                      : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
                  }`}
                />
              ))}
            </div>
          </section>
        </FadeInOnScroll>

        {/* ====================================================================
         * 6. DUAL-ROW INFINITE MARQUEE SECTION (Model Terdepan, CAS, & Ekosistem)
         * ==================================================================== */}
        <FadeInOnScroll>
          <section id="ekosistem" className="py-14 overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-2">
                {lang === "id" ? (
                  <>
                    Terhubung Mulus dengan Model Terdepan,{" "}
                    <span className="font-serif italic font-normal text-[#c4956a]">
                      SymPy CAS, &amp; Ekosistem
                    </span>
                  </>
                ) : (
                  <>
                    Seamlessly Connected with Frontier Models,{" "}
                    <span className="font-serif italic font-normal text-[#c4956a]">
                      SymPy CAS, &amp; Ecosystem
                    </span>
                  </>
                )}
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm max-w-xl mx-auto">
                {lang === "id"
                  ? "Gunakan API key BYOK Anda atau jalankan Ollama lokal untuk memadukan kecerdasan LLM dengan kepastian aljabar simbolik."
                  : "Use your own BYOK API keys or local Ollama models to combine frontier conversational AI with symbolic mathematical certainty."}
              </p>
            </div>

            {/* Marquee Edge Mask Container */}
            <div
              className="relative space-y-3"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              }}
            >
              {/* Row 1: Left-scrolling Marquee */}
              <div className="flex w-max animate-marquee gap-3">
                {[...MARQUEE_ROW_1, ...MARQUEE_ROW_1].map((item, idx) => (
                  <div
                    key={`r1-${idx}`}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#d4a574]/60 transition-colors shrink-0"
                  >
                    <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="text-left pr-1">
                      <div className="text-xs font-semibold text-zinc-900 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2: Right-scrolling Reverse Marquee */}
              <div className="flex w-max animate-marquee-reverse gap-3">
                {[...MARQUEE_ROW_2, ...MARQUEE_ROW_2].map((item, idx) => (
                  <div
                    key={`r2-${idx}`}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#d4a574]/60 transition-colors shrink-0"
                  >
                    <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="text-left pr-1">
                      <div className="text-xs font-semibold text-zinc-900 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeInOnScroll>

        {/* ====================================================================
         * 7. INTERACTIVE FAQ ACCORDION (Semua yang Perlu Anda Ketahui)
         * ==================================================================== */}
        <FadeInOnScroll>
          <section id="faq" className="py-16 px-6 max-w-3xl mx-auto border-t border-zinc-200/60">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200/80 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8f5e32] mb-3 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c4956a]" />
                {lang === "id" ? "PERTANYAAN UMUM" : "FREQUENTLY ASKED QUESTIONS"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#09090b] mb-2">
                {lang === "id" ? (
                  <>
                    Semua yang Perlu{" "}
                    <span className="font-serif font-normal text-[#c4956a]">Anda Ketahui</span>
                  </>
                ) : (
                  <>
                    Everything You{" "}
                    <span className="font-serif font-normal text-[#c4956a]">Need to Know</span>
                  </>
                )}
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                {lang === "id"
                  ? "Jawaban atas pertanyaan seputar mesin simbolik SymPy CAS, Zero-Answer Policy, dan konektor BYOK."
                  : "Answers to common questions about the SymPy CAS symbolic engine, Zero-Answer Policy, and BYOK connectors."}
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                      isOpen
                        ? "border-[#c4956a]/60 shadow-sm"
                        : "border-zinc-200/80 hover:border-zinc-300"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-[#09090b] hover:bg-[#faf9f6]/70 transition-colors cursor-pointer"
                    >
                      <span>{lang === "id" ? faq.qId : faq.qEn}</span>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                          isOpen
                            ? "bg-[#faf4ed] text-[#8f5e32] border border-[#d4a574]/40 rotate-180"
                            : "bg-[#f5f3ef] text-zinc-500"
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3.5">
                        {lang === "id" ? faq.aId : faq.aEn}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </FadeInOnScroll>

        {/* ====================================================================
         * 8. MOUSE-TRACKING SPOTLIGHT DARK CTA BANNER
         * ==================================================================== */}
        <FadeInOnScroll>
          <section className="py-12 px-6 max-w-5xl mx-auto">
            <SpotlightCard className="bg-black text-white rounded-3xl p-8 sm:p-12 text-center shadow-2xl border border-zinc-800/80">
              {/* Subtle radial dot pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              {/* Bottom warm copper glow */}
              <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#d4a574]/25 blur-[90px] rounded-full" />

              <div className="relative z-10 max-w-xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">
                  {lang === "id"
                    ? "Bangun Penalaran Matematika Sejati di Ekosistem ChatZAP"
                    : "Build Genuine Mathematical Reasoning in the ChatZAP Ecosystem"}
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm mb-8 leading-relaxed">
                  {lang === "id"
                    ? "Satu platform untuk verifikasi aljabar deterministik SymPy CAS, Smartboard Geometri 3D, dan dialog Sokrates dari jenjang sekolah dasar hingga riset doktoral."
                    : "One unified platform for deterministic SymPy CAS algebraic verification, 3D Geometry Smartboard, and Socratic dialogue from primary school to doctoral research."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <ActionButton href="/chat" variant="gold" size="md">
                    {lang === "id" ? "Buka ZAP Studio" : "Open ZAP Studio"}
                  </ActionButton>
                  <ActionButton
                    href="/connector"
                    variant="outline"
                    size="md"
                    className="!bg-zinc-900/90 !text-white !border-zinc-700 hover:!bg-zinc-800"
                  >
                    {lang === "id" ? "Atur Konektor BYOK" : "Configure BYOK"}
                  </ActionButton>
                </div>
                <p className="text-[11px] text-zinc-500 mt-6 font-mono">
                  {lang === "id"
                    ? "SymPy CAS < 1 ms Pre-Parse · 64 Automated Test Suites · Zero Answer Leaks"
                    : "SymPy CAS < 1 ms Pre-Parse · 64 Automated Test Suites · Zero Answer Leaks"}
                </p>
              </div>
            </SpotlightCard>
          </section>
        </FadeInOnScroll>
      </main>

      {/* ====================================================================
       * 9. EDITORIAL FOOTER (Matching ai.databyte.co.id)
       * ==================================================================== */}
      <footer className="py-12 px-6 border-t border-zinc-200/60 text-xs text-zinc-400 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pb-8 mb-8 border-b border-zinc-200/50 text-zinc-500">
          <Link href="/chat" className="hover:text-zinc-900 transition-colors">
            ZAP Socratic Studio
          </Link>
          <Link
            href="/chat?mode=smartboard"
            className="hover:text-zinc-900 transition-colors"
          >
            Smartboard Geometri 3D
          </Link>
          <a
            href="#explorer"
            onClick={(e) => scrollToSection(e, "#explorer")}
            className="hover:text-zinc-900 transition-colors"
          >
            SymPy CAS Sandbox
          </a>
          <a
            href="#showcase"
            onClick={(e) => scrollToSection(e, "#showcase")}
            className="hover:text-zinc-900 transition-colors"
          >
            CFL Terminal Demo
          </a>
          <a
            href="#jenjang"
            onClick={(e) => scrollToSection(e, "#jenjang")}
            className="hover:text-zinc-900 transition-colors"
          >
            Kurikulum TK–S3
          </a>
          <Link href="/connector" className="hover:text-zinc-900 transition-colors">
            BYOK Multi-LLM Connector
          </Link>
          <a
            href="#faq"
            onClick={(e) => scrollToSection(e, "#faq")}
            className="hover:text-zinc-900 transition-colors"
          >
            FAQ &amp; Privasi UU PDP
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center">
              <ZapLogo className="w-3 h-3" />
            </div>
            <span className="text-zinc-500">
              © 2026 ChatZAP · Zero-Answer Policy Symbolic Reasoning Platform. All rights reserved.
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-5 text-zinc-500">
            <Link href="/chat" className="hover:text-zinc-900 transition-colors">
              Studio
            </Link>
            <Link href="/connector" className="hover:text-zinc-900 transition-colors">
              Connector
            </Link>
            <a
              href="#explorer"
              onClick={(e) => scrollToSection(e, "#explorer")}
              className="hover:text-zinc-900 transition-colors"
            >
              CAS Verifier
            </a>
            <a
              href="#faq"
              onClick={(e) => scrollToSection(e, "#faq")}
              className="hover:text-zinc-900 transition-colors"
            >
              Zero-Answer Contract
            </a>
          </div>
        </div>
      </footer>

      {/* ====================================================================
       * 10. WAITING LIST MODAL (Triggered from Hero Preview or Mega Menu)
       * ==================================================================== */}
      <AnimatePresence>
        {waitlistProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setWaitlistProduct(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full p-6 border border-zinc-200 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setWaitlistProduct(null)}
                aria-label="Tutup modal"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-[#a3703f] text-[11px] font-semibold mb-3">
                <Clock className="w-3.5 h-3.5" />
                <span>Waiting List Ekosistem ChatZAP</span>
              </div>

              <h3 className="text-xl font-bold text-zinc-900 mb-1.5">
                {waitlistProduct}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-5">
                {lang === "id"
                  ? "Modul ini sedang dalam tahap kalibrasi kurikuler dan uji coba terbatas. Daftarkan email Anda untuk memperoleh akses prioritas saat rilis."
                  : "This module is currently in curricular calibration and private beta. Register your email for priority access upon release."}
              </p>

              {waitlistSubmitted ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="text-sm font-bold text-emerald-950">
                    {lang === "id"
                      ? "Terdaftar di Antrean Prioritas!"
                      : "Added to Priority Waitlist!"}
                  </div>
                  <p className="text-xs text-emerald-800">
                    {lang === "id"
                      ? `Kami akan mengirimkan undangan akses ${waitlistProduct} ke ${waitlistEmail}.`
                      : `We will send your ${waitlistProduct} invite to ${waitlistEmail}.`}
                  </p>
                  <div className="pt-2">
                    <ActionButton
                      href="/chat"
                      variant="black"
                      size="sm"
                      onClick={() => setWaitlistProduct(null)}
                    >
                      {lang === "id"
                        ? "Buka ZAP Studio Sekarang"
                        : "Open ZAP Studio In The Meantime"}
                    </ActionButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      {lang === "id" ? "Nama Lengkap / Institusi" : "Full Name / Institution"}
                    </label>
                    <input
                      type="text"
                      required
                      value={waitlistName}
                      onChange={(e) => setWaitlistName(e.target.value)}
                      placeholder={lang === "id" ? "Contoh: Budi Santoso (SMA 8 / ITB)" : "e.g., Alex Rivera"}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#c4956a] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      {lang === "id" ? "Alamat Email" : "Email Address"}
                    </label>
                    <input
                      type="email"
                      required
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="nama@sekolah.sch.id"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#c4956a] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <ActionButton
                      type="submit"
                      variant="gold"
                      size="md"
                      className="w-full justify-between"
                    >
                      {lang === "id" ? "Daftar Waiting List" : "Join Waiting List"}
                    </ActionButton>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
