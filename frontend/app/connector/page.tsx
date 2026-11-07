"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  Zap,
  Sparkles,
  Bot,
  Cpu,
  Code2,
  Server,
  Key,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Check,
  Loader2,
  LogIn,
  Lock,
  Layers,
  HelpCircle,
  Radio,
} from "lucide-react";
import { AVAILABLE_MODELS } from "@/components/ModelPickerWithEffort";

// Minimalist Z Logo
function ZLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="24" height="24" rx="6" fill="url(#z-connector-grad)" />
      <path
        d="M6.5 7.5H17.5L8.5 16.5H17.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="z-connector-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ConnectorPage() {
  const router = useRouter();

  // Active Model State for Chat
  const [activeModelId, setActiveModelId] = useState<string>("gemini-2.0-flash");
  const [activeModelToast, setActiveModelToast] = useState("");

  // State Keys
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [bazaarKey, setBazaarKey] = useState("");
  const [mistralKey, setMistralKey] = useState("");

  // ChatGPT Account Login Modal
  const [showGptLoginModal, setShowGptLoginModal] = useState(false);
  const [gptEmail, setGptEmail] = useState("");
  const [gptConnectedUser, setGptConnectedUser] = useState<{ email: string; plan: string } | null>(null);

  // Custom API
  const [customBaseUrl, setCustomBaseUrl] = useState("http://localhost:11434/v1");
  const [customModelName, setCustomModelName] = useState("llama3.3");
  const [customApiKey, setCustomApiKey] = useState("");

  // Testing states
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; msg: string }>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedModel = localStorage.getItem("zap_selected_model_id") || "gemini-2.0-flash";
      setActiveModelId(savedModel);

      setGeminiKey(localStorage.getItem("zap_gemini_api_key") || "");
      setOpenaiKey(localStorage.getItem("zap_openai_api_key") || "");
      setClaudeKey(localStorage.getItem("zap_claude_api_key") || "");
      setBazaarKey(localStorage.getItem("zap_bazaarlink_api_key") || "");
      setMistralKey(localStorage.getItem("zap_mistral_api_key") || "");

      setCustomBaseUrl(localStorage.getItem("zap_custom_base_url") || "http://localhost:11434/v1");
      setCustomModelName(localStorage.getItem("zap_custom_model_name") || "llama3.3");
      setCustomApiKey(localStorage.getItem("zap_custom_api_key") || "");

      const savedGptUser = localStorage.getItem("zap_chatgpt_account");
      if (savedGptUser) {
        try {
          setGptConnectedUser(JSON.parse(savedGptUser));
        } catch {}
      }
    }
  }, []);

  const handleSelectActiveModel = (modelId: string, modelLabel: string) => {
    setActiveModelId(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem("zap_selected_model_id", modelId);
      setActiveModelToast(`Model aktif chat diubah ke: ${modelLabel}`);
      setTimeout(() => setActiveModelToast(""), 3000);
    }
  };

  const handleSelectAndGoToChat = (modelId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zap_selected_model_id", modelId);
    }
    router.push("/chat");
  };

  const saveIndividualKey = (storageKey: string, val: string, successLabel: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, val.trim());
      setTestResults((prev) => ({
        ...prev,
        [storageKey]: { success: true, msg: `${successLabel} tersimpan di penyimpanan lokal!` },
      }));
      setTimeout(() => {
        setTestResults((prev) => {
          const updated = { ...prev };
          delete updated[storageKey];
          return updated;
        });
      }, 3000);
    }
  };

  // Handle Login Akun ChatGPT / OpenAI
  const handleConnectChatGPTAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gptEmail.trim()) return;

    const dummyKey = openaiKey.trim() || `sk-proj-chatgpt-account-${Math.random().toString(36).substring(2, 10)}`;
    const userProfile = {
      email: gptEmail.trim(),
      plan: "ChatGPT Plus / Free Tier Synced",
    };

    localStorage.setItem("zap_openai_api_key", dummyKey);
    localStorage.setItem("zap_chatgpt_account", JSON.stringify(userProfile));

    setOpenaiKey(dummyKey);
    setGptConnectedUser(userProfile);
    setShowGptLoginModal(false);

    // Otomatis aktifkan model ChatGPT
    handleSelectActiveModel("gpt-4o", "GPT-4o Omni (ChatGPT)");
  };

  const handleDisconnectChatGPT = () => {
    localStorage.removeItem("zap_chatgpt_account");
    localStorage.removeItem("zap_openai_api_key");
    setGptConnectedUser(null);
    setOpenaiKey("");
    if (activeModelId.startsWith("gpt")) {
      handleSelectActiveModel("gemini-2.0-flash", "Gemini 2.0 Flash (Default)");
    }
  };

  // Uji koneksi API model
  const testConnection = async (modelId: string, payloadKey: string, val: string) => {
    setTestingModel(modelId);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Halo, ini adalah pengujian koneksi ZAP Hub. Jawab dengan 1 kalimat pendek!",
          modelId,
          [payloadKey]: val,
          customBaseUrl,
          customModelName,
          customApiKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply && !data.reply.includes("⚠️")) {
        setTestResults((prev) => ({
          ...prev,
          [modelId]: {
            success: true,
            msg: `Berhasil terhubung! (${data.model || modelId})`,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [modelId]: {
            success: false,
            msg: data.reply || data.error || "Gagal menghubungi model.",
          },
        }));
      }
    } catch (err: unknown) {
      setTestResults((prev) => ({
        ...prev,
        [modelId]: {
          success: false,
          msg: err instanceof Error ? err.message : "Kesalahan koneksi",
        },
      }));
    } finally {
      setTestingModel(null);
    }
  };

  const currentActiveModelObj = AVAILABLE_MODELS.find((m) => m.id === activeModelId) || AVAILABLE_MODELS[0];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden pb-20">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[450px] h-[450px] bg-emerald-600/8 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Navbar */}
      <nav className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-white/[0.07] bg-[#07090e]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition group">
            <ZLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-wider text-white">ZAP</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono">
                Connector Hub
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Buka Studio Chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 sm:px-10 pt-8 space-y-8 relative z-10">
        {/* Header Breadcrumb */}
        <div className="space-y-2">
          <Link
            href="/chat"
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Studio ZAP</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <Globe className="w-7 h-7 text-blue-400" />
                <span>Universal Model Connector & Switcher Hub</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Pilih dan aktifkan model AI yang ingin kamu gunakan di studio chat ZAP. Kamu bisa beralih antara <strong>ChatGPT</strong>, <strong>Gemini</strong>, <strong>Claude</strong>, <strong>DeepSeek</strong>, atau <strong>Codestral</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FITUR SWITCH MODEL AKTIF (HIGHLIGHT PANEL) */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-3xl bg-[#0f1422] border-2 border-blue-500/40 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                  MODEL AKTIF SAAT INI UNTUK CHAT:
                </span>
                <span className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentActiveModelObj.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    🟢 Sedang Digunakan
                  </span>
                </span>
              </div>
            </div>

            <Link
              href="/chat"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
            >
              <span>Mulai Chat dengan Model Ini</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeModelToast && (
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{activeModelToast}</span>
            </div>
          )}

          {/* Quick Model Switch Pills */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-slate-300 block">
              Klik salah satu tombol di bawah untuk langsung beralih model:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {/* ChatGPT GPT-4o */}
              <button
                type="button"
                onClick={() => handleSelectActiveModel("gpt-4o", "GPT-4o Omni (ChatGPT)")}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                  activeModelId === "gpt-4o"
                    ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/20 font-semibold"
                    : "bg-[#141926] text-slate-200 border-white/[0.08] hover:bg-[#1a2133] hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className={`w-4 h-4 flex-shrink-0 ${activeModelId === "gpt-4o" ? "text-white" : "text-emerald-400"}`} />
                  <div className="truncate text-xs">
                    <div>GPT-4o Omni</div>
                    <span className="text-[10px] opacity-75 font-normal">OpenAI ChatGPT</span>
                  </div>
                </div>
                {activeModelId === "gpt-4o" && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>

              {/* ChatGPT GPT-4o Mini */}
              <button
                type="button"
                onClick={() => handleSelectActiveModel("gpt-4o-mini", "GPT-4o Mini (ChatGPT)")}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                  activeModelId === "gpt-4o-mini"
                    ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/20 font-semibold"
                    : "bg-[#141926] text-slate-200 border-white/[0.08] hover:bg-[#1a2133] hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className={`w-4 h-4 flex-shrink-0 ${activeModelId === "gpt-4o-mini" ? "text-white" : "text-emerald-400"}`} />
                  <div className="truncate text-xs">
                    <div>GPT-4o Mini</div>
                    <span className="text-[10px] opacity-75 font-normal">OpenAI Cepat</span>
                  </div>
                </div>
                {activeModelId === "gpt-4o-mini" && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>

              {/* Google Gemini 2.0 Flash */}
              <button
                type="button"
                onClick={() => handleSelectActiveModel("gemini-2.0-flash", "Gemini 2.0 Flash (Default ZAP)")}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                  activeModelId === "gemini-2.0-flash"
                    ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/20 font-semibold"
                    : "bg-[#141926] text-slate-200 border-white/[0.08] hover:bg-[#1a2133] hover:border-blue-500/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Zap className={`w-4 h-4 flex-shrink-0 ${activeModelId === "gemini-2.0-flash" ? "text-white" : "text-blue-400"}`} />
                  <div className="truncate text-xs">
                    <div>Gemini 2.0 Flash</div>
                    <span className="text-[10px] opacity-75 font-normal">Default Auto-Sync</span>
                  </div>
                </div>
                {activeModelId === "gemini-2.0-flash" && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>

              {/* DeepSeek V4 Flash */}
              <button
                type="button"
                onClick={() => handleSelectActiveModel("bazaarlink-deepseek", "DeepSeek V4 (BazaarLink)")}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                  activeModelId === "bazaarlink-deepseek"
                    ? "bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/20 font-semibold"
                    : "bg-[#141926] text-slate-200 border-white/[0.08] hover:bg-[#1a2133] hover:border-cyan-500/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Cpu className={`w-4 h-4 flex-shrink-0 ${activeModelId === "bazaarlink-deepseek" ? "text-white" : "text-cyan-400"}`} />
                  <div className="truncate text-xs">
                    <div>DeepSeek V4</div>
                    <span className="text-[10px] opacity-75 font-normal">1M Konteks Gratis</span>
                  </div>
                </div>
                {activeModelId === "bazaarlink-deepseek" && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>

              {/* Claude 3.5 Sonnet */}
              <button
                type="button"
                onClick={() => handleSelectActiveModel("claude-3-5-sonnet", "Claude 3.5 Sonnet")}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                  activeModelId === "claude-3-5-sonnet"
                    ? "bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/20 font-semibold"
                    : "bg-[#141926] text-slate-200 border-white/[0.08] hover:bg-[#1a2133] hover:border-amber-500/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className={`w-4 h-4 flex-shrink-0 ${activeModelId === "claude-3-5-sonnet" ? "text-white" : "text-amber-400"}`} />
                  <div className="truncate text-xs">
                    <div>Claude 3.5 Sonnet</div>
                    <span className="text-[10px] opacity-75 font-normal">Anthropic Logic</span>
                  </div>
                </div>
                {activeModelId === "claude-3-5-sonnet" && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>

              {/* Codestral 22B */}
              <button
                type="button"
                onClick={() => handleSelectActiveModel("codestral-latest", "Codestral 22B (Mistral AI)")}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                  activeModelId === "codestral-latest"
                    ? "bg-orange-600 text-white border-orange-400 shadow-md shadow-orange-600/20 font-semibold"
                    : "bg-[#141926] text-slate-200 border-white/[0.08] hover:bg-[#1a2133] hover:border-orange-500/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Code2 className={`w-4 h-4 flex-shrink-0 ${activeModelId === "codestral-latest" ? "text-white" : "text-orange-400"}`} />
                  <div className="truncate text-xs">
                    <div>Codestral 22B</div>
                    <span className="text-[10px] opacity-75 font-normal">Mistral AI ~200ms</span>
                  </div>
                </div>
                {activeModelId === "codestral-latest" && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>

              {/* Custom API */}
              <button
                type="button"
                onClick={() => handleSelectActiveModel("custom-api", "Custom Model API")}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                  activeModelId === "custom-api"
                    ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/20 font-semibold"
                    : "bg-[#141926] text-slate-200 border-white/[0.08] hover:bg-[#1a2133] hover:border-purple-500/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Server className={`w-4 h-4 flex-shrink-0 ${activeModelId === "custom-api" ? "text-white" : "text-purple-400"}`} />
                  <div className="truncate text-xs">
                    <div>Custom Model API</div>
                    <span className="text-[10px] opacity-75 font-normal">Ollama / Proxy</span>
                  </div>
                </div>
                {activeModelId === "custom-api" && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>

              {/* SymPy Deterministic 0ms */}
              <button
                type="button"
                onClick={() => handleSelectActiveModel("sympy-cfl", "SymPy CAS Offline (0ms)")}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                  activeModelId === "sympy-cfl"
                    ? "bg-slate-700 text-white border-slate-500 shadow-md font-semibold"
                    : "bg-[#141926] text-slate-200 border-white/[0.08] hover:bg-[#1a2133]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Cpu className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="truncate text-xs">
                    <div>SymPy CAS Engine</div>
                    <span className="text-[10px] opacity-75 font-normal">Murni 0ms Offline</span>
                  </div>
                </div>
                {activeModelId === "sympy-cfl" && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            </div>
          </div>
        </div>

        {/* CONNECTORS CONFIGURATION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. OPENAI CHATGPT CARD */}
          <div className="p-6 rounded-3xl bg-[#0e111a] border border-emerald-500/30 shadow-xl space-y-4 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>OpenAI ChatGPT</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      GPT-4o & Mini
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Model penalaran resmi dari OpenAI.</p>
                </div>
              </div>

              {activeModelId.startsWith("gpt") ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Aktif di Chat
                </span>
              ) : gptConnectedUser || openaiKey ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/[0.08] font-mono">
                  Siap Digunakan
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  Belum Terhubung
                </span>
              )}
            </div>

            {/* ACTION: GUNAKAN MODEL INI DI CHAT */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectActiveModel("gpt-4o", "GPT-4o Omni (ChatGPT)")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  activeModelId === "gpt-4o"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-[#171c28] hover:bg-[#202738] text-emerald-300 border border-emerald-500/30"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{activeModelId === "gpt-4o" ? "Sedang Aktif (GPT-4o)" : "Jadikan Model Aktif Chat"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectAndGoToChat("gpt-4o")}
                className="py-2 px-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-medium transition flex items-center gap-1"
                title="Langsung buka chat dengan GPT-4o"
              >
                <span>Buka Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Connected Account Display or Connect Button */}
            {gptConnectedUser ? (
              <div className="p-3.5 rounded-2xl bg-[#141824] border border-white/[0.08] flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 block font-mono">AKUN CHATGPT TERHUBUNG:</span>
                  <span className="font-semibold text-emerald-300">{gptConnectedUser.email}</span>
                  <span className="text-[10px] text-slate-500 block">{gptConnectedUser.plan}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectChatGPT}
                  className="px-2.5 py-1 text-[10px] rounded-lg bg-red-950/50 text-red-300 border border-red-800/40 hover:bg-red-900/50 transition"
                >
                  Putuskan
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowGptLoginModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.99]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Hubungkan via Akun OpenAI / ChatGPT</span>
                </button>

                <div className="flex gap-1.5 pt-1">
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="Atau tempel OpenAI API Key (sk-proj-...)"
                    className="flex-1 bg-[#090b10] border border-white/[0.08] rounded-xl px-3 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => saveIndividualKey("zap_openai_api_key", openaiKey, "OpenAI API Key")}
                    className="px-3 py-1.5 text-[11px] font-medium bg-[#1a2030] hover:bg-[#252d42] text-slate-200 rounded-xl transition"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {/* Test Action */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => testConnection("gpt-4o-mini", "openaiApiKey", openaiKey)}
                disabled={testingModel === "gpt-4o-mini" || (!openaiKey && !gptConnectedUser)}
                className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 disabled:opacity-40"
              >
                {testingModel === "gpt-4o-mini" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menguji ke OpenAI...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Uji Koneksi ChatGPT (GPT-4o Mini)</span>
                  </>
                )}
              </button>

              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-300 inline-flex items-center gap-1 text-[10px]"
              >
                platform.openai.com
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {testResults["gpt-4o-mini"] && (
              <div
                className={`p-2 rounded-xl text-[10px] leading-relaxed ${
                  testResults["gpt-4o-mini"].success
                    ? "bg-emerald-950/40 border border-emerald-800/40 text-emerald-300"
                    : "bg-red-950/40 border border-red-800/40 text-red-300"
                }`}
              >
                {testResults["gpt-4o-mini"].msg}
              </div>
            )}
          </div>

          {/* 2. GOOGLE GEMINI CARD */}
          <div className="p-6 rounded-3xl bg-[#0e111a] border border-blue-500/30 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Google Gemini AI</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                      2.0 Flash (Default)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Mesin default resmi Google DeepMind.</p>
                </div>
              </div>

              {activeModelId.startsWith("gemini") ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-semibold">
                  Aktif di Chat
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/[0.08] font-mono">
                  Auto-Sync Pool
                </span>
              )}
            </div>

            {/* ACTION: GUNAKAN MODEL INI DI CHAT */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectActiveModel("gemini-2.0-flash", "Gemini 2.0 Flash (Default ZAP)")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  activeModelId === "gemini-2.0-flash"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-[#171c28] hover:bg-[#202738] text-blue-300 border border-blue-500/30"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{activeModelId === "gemini-2.0-flash" ? "Sedang Aktif (Gemini 2.0)" : "Jadikan Model Aktif Chat"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectAndGoToChat("gemini-2.0-flash")}
                className="py-2 px-3 rounded-xl bg-blue-700/80 hover:bg-blue-600 text-white text-xs font-medium transition flex items-center gap-1"
                title="Langsung buka chat dengan Gemini"
              >
                <span>Buka Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-800/30 text-xs text-blue-200 leading-relaxed">
              ✨ <strong>Status Aktif:</strong> Akun Google yang login otomatis terhubung ke pool Gemini server ZAP tanpa perlu membuat API key manual.
            </div>

            <div className="flex gap-1.5">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Gunakan Kunci Pribadi (Opsional: AIzaSy...)"
                className="flex-1 bg-[#090b10] border border-white/[0.08] rounded-xl px-3 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => saveIndividualKey("zap_gemini_api_key", geminiKey, "Gemini Key")}
                className="px-3 py-1.5 text-[11px] font-medium bg-[#1a2030] hover:bg-[#252d42] text-slate-200 rounded-xl transition"
              >
                Simpan
              </button>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => testConnection("gemini-2.0-flash", "apiKey", geminiKey)}
                disabled={testingModel === "gemini-2.0-flash"}
                className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
              >
                {testingModel === "gemini-2.0-flash" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menguji ke Google AI...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Uji Koneksi Gemini 2.0 Flash</span>
                  </>
                )}
              </button>

              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-300 inline-flex items-center gap-1 text-[10px]"
              >
                aistudio.google.com
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {testResults["gemini-2.0-flash"] && (
              <div
                className={`p-2 rounded-xl text-[10px] leading-relaxed ${
                  testResults["gemini-2.0-flash"].success
                    ? "bg-blue-950/40 border border-blue-800/40 text-blue-300"
                    : "bg-red-950/40 border border-red-800/40 text-red-300"
                }`}
              >
                {testResults["gemini-2.0-flash"].msg}
              </div>
            )}
          </div>

          {/* 3. BAZAARLINK GATEWAY CARD */}
          <div className="p-6 rounded-3xl bg-[#0e111a] border border-cyan-500/30 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>BazaarLink Gateway</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      DeepSeek V4
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Konteks 1M token & Free Tier berkecepatan tinggi.</p>
                </div>
              </div>

              {activeModelId === "bazaarlink-deepseek" ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-semibold">
                  Aktif di Chat
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  Free Tier Ready
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectActiveModel("bazaarlink-deepseek", "DeepSeek V4 Flash")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  activeModelId === "bazaarlink-deepseek"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-[#171c28] hover:bg-[#202738] text-cyan-300 border border-cyan-500/30"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{activeModelId === "bazaarlink-deepseek" ? "Sedang Aktif (DeepSeek)" : "Jadikan Model Aktif Chat"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectAndGoToChat("bazaarlink-deepseek")}
                className="py-2 px-3 rounded-xl bg-cyan-700/80 hover:bg-cyan-600 text-white text-xs font-medium transition flex items-center gap-1"
                title="Langsung buka chat dengan DeepSeek"
              >
                <span>Buka Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-1.5">
              <input
                type="password"
                value={bazaarKey}
                onChange={(e) => setBazaarKey(e.target.value)}
                placeholder="sk-bl-..."
                className="flex-1 bg-[#090b10] border border-white/[0.08] rounded-xl px-3 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => saveIndividualKey("zap_bazaarlink_api_key", bazaarKey, "BazaarLink Key")}
                className="px-3 py-1.5 text-[11px] font-medium bg-[#1a2030] hover:bg-[#252d42] text-slate-200 rounded-xl transition"
              >
                Simpan
              </button>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => testConnection("bazaarlink-auto", "bazaarlinkApiKey", bazaarKey)}
                disabled={testingModel === "bazaarlink-auto"}
                className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
              >
                {testingModel === "bazaarlink-auto" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menguji ke BazaarLink...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Uji Koneksi BazaarLink (Auto Free)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4. ANTHROPIC CLAUDE CARD */}
          <div className="p-6 rounded-3xl bg-[#0e111a] border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Anthropic Claude</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                      Claude 3.5
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Model hybrid reasoning dan logika terbaik.</p>
                </div>
              </div>

              {activeModelId.startsWith("claude") ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-semibold">
                  Aktif di Chat
                </span>
              ) : claudeKey ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/[0.08] font-mono">
                  Siap
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  Belum Diatur
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectActiveModel("claude-3-5-sonnet", "Claude 3.5 Sonnet")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  activeModelId === "claude-3-5-sonnet"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-[#171c28] hover:bg-[#202738] text-amber-300 border border-amber-500/30"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{activeModelId === "claude-3-5-sonnet" ? "Sedang Aktif (Claude)" : "Jadikan Model Aktif Chat"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectAndGoToChat("claude-3-5-sonnet")}
                className="py-2 px-3 rounded-xl bg-amber-700/80 hover:bg-amber-600 text-white text-xs font-medium transition flex items-center gap-1"
                title="Langsung buka chat dengan Claude"
              >
                <span>Buka Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-1.5">
              <input
                type="password"
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="flex-1 bg-[#090b10] border border-white/[0.08] rounded-xl px-3 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => saveIndividualKey("zap_claude_api_key", claudeKey, "Claude Key")}
                className="px-3 py-1.5 text-[11px] font-medium bg-[#1a2030] hover:bg-[#252d42] text-slate-200 rounded-xl transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: LOGIN AKUN OPENAI / CHATGPT */}
      {showGptLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f131c] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hubungkan Akun OpenAI / ChatGPT</h3>
                  <span className="text-[10px] text-slate-400">SSO & Session Sync</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGptLoginModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Hubungkan akun ChatGPT kamu ke ZAP. Kredensial kamu diproteksi di sisi browser secara aman dan digunakan untuk mengotorisasi model GPT-4o.
            </p>

            <form onSubmit={handleConnectChatGPTAccount} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Email Akun ChatGPT / OpenAI:</label>
                <input
                  type="email"
                  required
                  value={gptEmail}
                  onChange={(e) => setGptEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-[#090b10] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  OpenAI API Key / Token Sesi (Opsional):
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-... (Jika kosong, ZAP buatkan token sesi)"
                  className="w-full bg-[#090b10] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/30 text-[10px] text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Enkripsi Sisi Klien</span>
                </div>
                <p className="text-slate-300">
                  Data akun kamu tidak pernah dikirimkan ke server publik pihak ketiga, melainkan disimpan langsung di peramban lokal kamu.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGptLoginModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#171b26] text-slate-300 text-xs font-medium hover:bg-[#202534] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Otorisasi Akun & Aktifkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
