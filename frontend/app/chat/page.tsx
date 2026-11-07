"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MathView from "@/components/MathView";
import RichChatText from "@/components/RichChatText";
import GoogleAuthButton, { type ZAPUser } from "@/components/GoogleAuthButton";
import InteractiveCanvas3D, { type MathModelType } from "@/components/InteractiveCanvas3D";
import ModelPickerWithEffort, {
  AVAILABLE_MODELS,
  type AIModel,
  type ReasoningEffort,
} from "@/components/ModelPickerWithEffort";
import {
  Plus,
  ArrowUp,
  RotateCw,
  Search,
  CheckCircle2,
  AlertCircle,
  MessageSquareQuote,
  FlaskConical,
  Layers,
  Tv,
  Box,
  PanelLeft,
  SlidersHorizontal,
  Sparkles,
  Calculator,
  Compass,
  Code2,
  Globe,
} from "lucide-react";

// Clean Minimalist "Z" Logo Emblem
function ZLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="6" fill="url(#z-logo-grad)" />
      <path
        d="M6.5 7.5H17.5L8.5 16.5H17.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="z-logo-grad"
          x1="0"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface LineTranscription {
  line_number: number;
  raw_latex: string;
  is_valid: boolean;
}

interface CounterExample {
  test_variable: string;
  test_value: number;
  lhs_expected: string;
  rhs_calculated: string;
  contradiction_statement: string;
}

interface DiagnosisResult {
  has_fault: boolean;
  first_fault_line: number | null;
  fault_type: string | null;
  status: "FAULT_DETECTED" | "ALL_STEPS_VALID" | "UNDECIDABLE_STEP";
  human_explanation: string;
  socratic_prompt: string;
  counter_example: CounterExample | null;
}

interface DiagnoseResponse {
  status: string;
  session_id: string;
  transcription: {
    total_lines: number;
    lines: LineTranscription[];
  };
  diagnosis: DiagnosisResult;
  guardrail_status: {
    final_answer_suppressed: boolean;
  };
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  steps?: string[];
  rawText?: string;
  diagnosis?: DiagnoseResponse;
  replyText?: string;
  modelName?: string;
  timestamp: string;
}

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

interface PresetSample {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  steps: string[];
  targetVar: string;
  modelType: MathModelType;
}

const PRESET_SAMPLES: PresetSample[] = [
  {
    id: "sample-1",
    title: "Ekspansi Kuadrat 3D",
    subtitle: "(x + 3)^2 - 4 → x^2 + 9 - 4",
    icon: Box,
    steps: ["(x + 3)^2 - 4", "x^2 + 9 - 4", "x^2 + 5"],
    targetVar: "x",
    modelType: "parabola",
  },
  {
    id: "sample-2",
    title: "Irisan Kerucut & Elips",
    subtitle: "x^2/4 + y^2/9 = 1",
    icon: Layers,
    steps: ["x^2 / 4 + y^2 / 9 = 1"],
    targetVar: "x",
    modelType: "conic_slicer",
  },
  {
    id: "sample-3",
    title: "Simulasi Volume Tabung",
    subtitle: "V = π * r^2 * h",
    icon: Compass,
    steps: ["V = pi * r^2 * h"],
    targetVar: "r",
    modelType: "cylinder",
  },
  {
    id: "sample-4",
    title: "Balok Hitung CPA (TK/SD)",
    subtitle: "Agregasi Konkret: 3 + 2 = 5",
    icon: Sparkles,
    steps: ["3 + 2 = 5"],
    targetVar: "x",
    modelType: "counting_blocks",
  },
  {
    id: "sample-5",
    title: "Kehilangan Akar Kuadrat",
    subtitle: "x^2 = 4 → x = 2 (Root Loss)",
    icon: Search,
    steps: ["x^2 = 4", "x = 2"],
    targetVar: "x",
    modelType: "parabola",
  },
];

const SUGGESTIONS = [
  {
    id: "sug-1",
    title: "Ekspansi Kuadrat 3D",
    subtitle: "(x + 3)^2 - 4 → x^2 + 9 - 4",
    icon: Box,
    steps: ["(x + 3)^2 - 4", "x^2 + 9 - 4", "x^2 + 5"],
    modelType: "parabola" as MathModelType,
  },
  {
    id: "sug-2",
    title: "Kehilangan Akar Kuadrat",
    subtitle: "x^2 = 4 → x = 2 (Root Loss)",
    icon: Search,
    steps: ["x^2 = 4", "x = 2"],
    modelType: "parabola" as MathModelType,
  },
  {
    id: "sug-3",
    title: "Irisan Kerucut & Elips 3D",
    subtitle: "x^2/4 + y^2/9 = 1",
    icon: Layers,
    steps: ["x^2 / 4 + y^2 / 9 = 1"],
    modelType: "conic_slicer" as MathModelType,
  },
];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function ZAPApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [targetVar, setTargetVar] = useState<string>("x");
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    return AVAILABLE_MODELS.find((m) => m.id === "gemini-2.0-flash") || AVAILABLE_MODELS[0];
  });
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("medium");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("Menganalisis langkah aljabar...");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeProblemFirstStep, setActiveProblemFirstStep] = useState<string | null>(null);
  const [activeProblemContext, setActiveProblemContext] = useState<ActiveProblemContext | null>(null);

  // 3D Canvas: Default TIDAK langsung muncul (ditoggle via tombol / preset)
  const [show3DCanvas, setShow3DCanvas] = useState<boolean>(false);
  const [active3DModel, setActive3DModel] = useState<MathModelType>("parabola");
  const [showFaultComparison, setShowFaultComparison] = useState<boolean>(false);
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<ZAPUser | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "canvas">("chat");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedModelId = localStorage.getItem("zap_selected_model_id");
      if (savedModelId) {
        const found = AVAILABLE_MODELS.find((m) => m.id === savedModelId);
        if (found) {
          setSelectedModel(found);
        }
      }
    }
    checkHealth();
  }, []);

  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    if (typeof window !== "undefined") {
      localStorage.setItem("zap_selected_model_id", model.id);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { method: "GET" });
      if (res.ok) setBackendStatus("online");
      else setBackendStatus("offline");
    } catch {
      setBackendStatus("offline");
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInputText("");
    setActiveProblemFirstStep(null);
    setActiveProblemContext(null);
    setShowFaultComparison(false);
  };

  const normalizeStep = (raw: string): string => {
    return raw
      .replace(/\\cdot/g, "*")
      .replace(/\\times/g, "*")
      .replace(/\\left\(/g, "(")
      .replace(/\\right\)/g, ")")
      .replace(/\\/g, "")
      .trim();
  };

  // Cek apakah input mengandung ekspresi aljabar atau matematika
  const isMathStep = (text: string): boolean => {
    const clean = text.trim();
    // Jika ada operator aljabar (+, -, *, /, ^, =), angka berpangkat, LaTeX, atau persamaan
    return /[\d\+\-\*\/\^\=\\_\{\}\(\)]/.test(clean) && !/^[a-zA-Z\s\?\,\.\!]+$/.test(clean);
  };

  const handleSend = async (customSteps?: string[], sampleModelType?: MathModelType) => {
    if (sampleModelType) {
      setActive3DModel(sampleModelType);
      setShow3DCanvas(true);
    }

    const textToProcess = customSteps ? customSteps.join("\n") : inputText;
    if (!textToProcess.trim() || loading) return;

    const lines = textToProcess
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Deteksi apakah ini pertanyaan/percakapan umum atau penurunan langkah matematika
    const isConversational =
      !customSteps &&
      (!isMathStep(textToProcess) ||
        lines[0].endsWith("?") ||
        /^(kenapa|mengapa|apa|bagaimana|kok|bisa|tolong|kak|halo|hi|tes|testing|jelaskan|why|how|what)/i.test(
          lines[0]
        ));

    // JALUR 1: PERCAKAPAN SOKRATIK (GEMINI SOCRATIC TUTOR)
    if (isConversational) {
      const userQuestion = textToProcess.trim();
      const userMsg: Message = {
        id: "msg_" + Date.now(),
        sender: "user",
        rawText: userQuestion,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setLoading(true);
      setLoadingStatus("Tutor Sokratik ZAP sedang menyusun respon...");

      try {
        const conversationHistory = messages.map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.rawText || (m.steps ? m.steps.join("\n") : m.replyText || ""),
        }));

        const savedBazaarlinkKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_bazaarlink_api_key") ||
              "sk-bl-tjmuoNkhmwyhdJKzTuK0C7jNrzRj51IvNjVisfqkDZ25XT_i"
            : undefined;

        const savedGeminiKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_gemini_api_key") || undefined
            : undefined;

        const savedMistralKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_mistral_api_key") || undefined
            : undefined;

        const savedClaudeKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_claude_api_key") || undefined
            : undefined;

        const savedOpenaiKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_openai_api_key") || undefined
            : undefined;

        const savedCustomBaseUrl =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_custom_base_url") || undefined
            : undefined;

        const savedCustomModelName =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_custom_model_name") || undefined
            : undefined;

        const savedCustomApiKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_custom_api_key") || undefined
            : undefined;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userQuestion,
            conversationHistory,
            activeProblem: activeProblemContext,
            modelId: selectedModel.id,
            apiKey: savedGeminiKey,
            mistralApiKey: savedMistralKey,
            bazaarlinkApiKey: savedBazaarlinkKey,
            claudeApiKey: savedClaudeKey,
            openaiApiKey: savedOpenaiKey,
            customBaseUrl: savedCustomBaseUrl,
            customModelName: savedCustomModelName,
            customApiKey: savedCustomApiKey,
            userName: currentUser?.name || "Wakhid Pangestu",
          }),
        });

        if (!res.ok) {
          throw new Error(`Chat HTTP ${res.status}`);
        }

        const chatData = await res.json();
        const replyText =
          chatData.reply ||
          "Halo! Saya tutor Sokratik ZAP. Tuliskan persamaan atau langkah penurunan aljabar yang ingin kamu buktikan hari ini (contoh: (x + 3)^2 - 4), dan kita amati grafiknya di kanvas 3D sebelah kanan.";

        const assistantMsg: Message = {
          id: "msg_" + (Date.now() + 1),
          sender: "assistant",
          replyText: replyText,
          modelName: chatData.model || selectedModel.name,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error("Chat error:", err);
        const assistantMsg: Message = {
          id: "msg_" + (Date.now() + 1),
          sender: "assistant",
          replyText:
            "Halo! Ada persamaan aljabar yang ingin kita analisis bersama? Tuliskan langkah penurunan rumusmu di bawah untuk diverifikasi oleh SymPy CAS dan dimodelkan di kanvas 3D sebelah kanan.",
          modelName: "ZAP Socratic Engine (Local Fallback)",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // JALUR 2: VERIFIKASI LANGKAH ALJABAR CAS (SYMPY)
    const stepsArray = customSteps || lines;
    const normalizedSteps = stepsArray.map((s) => normalizeStep(s));

    let stepsToSend = normalizedSteps;
    let isCorrection = false;
    if (normalizedSteps.length === 1 && activeProblemFirstStep && !customSteps) {
      stepsToSend = [activeProblemFirstStep, normalizedSteps[0]];
      isCorrection = true;
    }

    const userMsg: Message = {
      id: "msg_" + Date.now(),
      sender: "user",
      steps: stepsArray,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);
    setLoadingStatus("Menganalisis konsistensi aljabar dengan SymPy CAS...");

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed_steps: stepsToSend,
          target_variable: targetVar.trim() || "x",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || `Error HTTP ${res.status}`);
      }

      const data: DiagnoseResponse = await res.json();

      if (data.diagnosis.has_fault) {
        setShowFaultComparison(true);
        setActive3DModel("parabola");
        setShow3DCanvas(true);
      } else {
        setShowFaultComparison(false);
      }

      let customReplyText: string | undefined = undefined;
      if (!isCorrection && stepsToSend.length === 1) {
        setActiveProblemFirstStep(stepsToSend[0]);
        customReplyText = `Langkah awal "${stepsArray[0]}" tercatat. Tuliskan baris penurunan berikutnya untuk menguji validitas aljabar langkahmu.`;
      } else if (!isCorrection && stepsToSend.length > 1) {
        setActiveProblemFirstStep(stepsToSend[0]);
      } else if (isCorrection) {
        if (!data.diagnosis.has_fault) {
          setActiveProblemFirstStep(normalizedSteps[0]);
          customReplyText = `Perbaikanmu valid! Langkah "${stepsArray[0]}" konsisten dan benar secara aljabar terhadap soal awal.`;
        } else {
          customReplyText = `Langkah perbaikanmu "${stepsArray[0]}" masih memiliki kejanggalan: ${data.diagnosis.human_explanation}`;
        }
      }

      setActiveProblemContext({
        steps: stepsToSend,
        faultLine: data.diagnosis.has_fault ? (data.diagnosis.first_fault_line ?? undefined) : undefined,
        misconceptionType: data.diagnosis.fault_type ?? undefined,
        explanation: data.diagnosis.human_explanation,
        socraticHint: data.diagnosis.socratic_prompt,
        counterExample: data.diagnosis.counter_example ?? undefined,
      });

      const assistantMsg: Message = {
        id: "msg_" + (Date.now() + 1),
        sender: "assistant",
        diagnosis: data,
        replyText: customReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Gagal terhubung ke microservice SymPy.";
      const assistantMsg: Message = {
        id: "msg_" + (Date.now() + 1),
        sender: "assistant",
        replyText: `Kendala Diagnostik: ${errMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex h-screen bg-[#0a0c10] text-[#e2e8f0] overflow-hidden font-sans select-none ${
        isProjectorMode ? "text-sm contrast-125" : "text-xs"
      }`}
    >
      {/* 1. LEFT SIDEBAR: BERSIH & RAPI */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#11141c] border-r border-[#1f2430] flex flex-col transition-transform duration-200 ease-in-out sm:static sm:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full sm:hidden"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#1f2430]">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition group" title="Kembali ke Beranda chatzap.xyz">
            <ZLogo className="w-7 h-7 flex-shrink-0 group-hover:scale-105 transition-transform" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wide text-white">ZAP</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950/70 text-blue-400 border border-blue-800/50 font-mono">
                CAS
              </span>
            </div>
          </a>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            title="Ciutkan menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1f2c] transition"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* "+ Sesi Baru" Action Pill */}
        <div className="p-3 pb-1.5">
          <button
            onClick={startNewChat}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Sesi Baru ZAP</span>
          </button>
        </div>

        {/* Active Model Indicator in Sidebar */}
        <div className="px-3 pb-2">
          <div className="p-2.5 rounded-xl bg-[#141824] border border-[#232a3b] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400">Model Aktif:</span>
              <Link
                href="/connector"
                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium"
              >
                Ganti ➔
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <selectedModel.icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-200 truncate">
                {selectedModel.shortName}
              </span>
            </div>
          </div>
        </div>

        {/* Presets List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-3">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-3 pt-1">
              Simulasi 3D Interaktif
            </div>

            {PRESET_SAMPLES.map((sample) => {
              const Icon = sample.icon;
              return (
                <button
                  key={sample.id}
                  onClick={() => handleSend(sample.steps, sample.modelType)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-[#181d28] transition group flex items-start gap-2.5 border border-transparent hover:border-[#262e40]"
                >
                  <Icon className="w-4 h-4 text-blue-400 group-hover:text-blue-300 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs text-slate-200 group-hover:text-white truncate">
                      {sample.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {sample.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CAS Status Pill & Target Var */}
        <div className="px-3.5 py-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-[#1f2430] bg-[#0d1017]">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === "online" ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="font-mono text-[10px] text-slate-300">
              {backendStatus === "online" ? "CAS SymPy Online" : "CAS Offline"}
            </span>
            <button
              onClick={checkHealth}
              title="Cek koneksi CAS"
              className="text-slate-400 hover:text-white ml-0.5"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Var:</span>
            <input
              type="text"
              value={targetVar}
              onChange={(e) => setTargetVar(e.target.value.toLowerCase())}
              maxLength={2}
              className="w-5 text-center bg-[#181d28] text-white rounded text-[10px] font-mono focus:outline-none border border-[#2b3447]"
            />
          </div>
        </div>

        {/* User Profile Bar */}
        <div className="p-2 border-t border-[#1f2430]">
          <GoogleAuthButton variant="sidebar-profile" onUserChange={setCurrentUser} />
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* TOP NAVBAR: MINIMALIST & RAPI */}
        <header className="h-14 border-b border-[#1f2430] bg-[#0c0e14] flex items-center justify-between px-3 sm:px-4 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1f2c] transition flex-shrink-0"
                title="Buka menu navigasi"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                Studio Penalaran ZAP
              </span>
              <span className="text-[10px] text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 font-mono hidden md:inline-block flex-shrink-0">
                Zero-Answer Policy
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* PROMINENT MODEL SWITCHER DI HEADER */}
            <ModelPickerWithEffort
              variant="default"
              selectedModelId={selectedModel.id}
              onSelectModel={handleSelectModel}
              reasoningEffort={reasoningEffort}
              onChangeEffort={setReasoningEffort}
            />

            {/* Connector Hub Link */}
            <Link
              href="/connector"
              title="Universal Model Connector (ChatGPT, Claude, Gemini, DeepSeek)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#141822] text-slate-300 hover:text-white hover:bg-[#1d2332] text-xs font-medium transition"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Connector Hub</span>
            </Link>

            {/* Toggle Kanvas 3D Button */}
            <button
              onClick={() => setShow3DCanvas(!show3DCanvas)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                show3DCanvas
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-sm"
                  : "bg-[#141822] text-slate-300 hover:text-white border-[#242b3b] hover:bg-[#1d2332]"
              }`}
            >
              <Box className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{show3DCanvas ? "Tutup Kanvas 3D" : "Buka Kanvas 3D"}</span>
              <span className="sm:hidden">{show3DCanvas ? "Tutup 3D" : "3D"}</span>
            </button>

            {/* Projector Mode Toggle */}
            <button
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              title="Mode Presentasi Proyektor"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                isProjectorMode
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : "bg-[#141822] text-slate-300 hover:text-white border-[#242b3b] hover:bg-[#1d2332]"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Proyektor</span>
            </button>

            {/* Google Auth Avatar */}
            <GoogleAuthButton variant="avatar-only" onUserChange={setCurrentUser} />
          </div>
        </header>

        {/* MOBILE SEGMENTED TABS (HANYA JIKA KANVAS AKTIF) */}
        {show3DCanvas && (
          <div className="flex lg:hidden border-b border-[#1f2430] bg-[#11141c] text-xs font-medium">
            <button
              onClick={() => setMobileTab("chat")}
              className={`flex-1 py-2 text-center transition ${
                mobileTab === "chat"
                  ? "border-b-2 border-blue-500 text-blue-400 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              💬 Bimbingan Sokratik
            </button>
            <button
              onClick={() => setMobileTab("canvas")}
              className={`flex-1 py-2 text-center transition ${
                mobileTab === "canvas"
                  ? "border-b-2 border-blue-500 text-blue-400 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📐 Kanvas 3D Interaktif
            </button>
          </div>
        )}

        {/* WORKSPACE CONTENT: CHAT DI KIRI, KANVAS 3D DI KANAN */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* KOLOM CHAT (KIRI / FULL WIDTH SAAT KANVAS MATI) */}
          <div
            className={`flex flex-col h-full overflow-hidden transition-all duration-200 ${
              show3DCanvas
                ? mobileTab === "chat"
                  ? "w-full lg:w-1/2 xl:w-7/12 border-r border-[#1f2430]"
                  : "hidden lg:flex lg:w-1/2 xl:w-7/12 border-r border-[#1f2430]"
                : "w-full"
            } bg-[#0c0e14]`}
          >
            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className={`mx-auto w-full ${show3DCanvas ? "max-w-xl" : "max-w-2xl"} h-full`}>
                {messages.length === 0 ? (
                // EMPTY STATE HERO
                <div className="h-full flex flex-col items-center justify-center text-center px-2 py-8 my-auto">
                  <ZLogo className="w-11 h-11 mb-3 shadow-md shadow-blue-500/20" />
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
                    Tutor Aljabar Sokratik & Kanvas 3D
                  </h1>
                  <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                    Tuliskan langkah aljabar penurunan rumusmu. ZAP membimbing proses penalaranmu tanpa memberi contekan instan, langsung divisualisasikan pada kanvas 3D di sebelah kanan.
                  </p>

                  <div className="w-full max-w-md space-y-2">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 text-left px-1">
                      Coba Eksplorasi Cepat:
                    </div>
                    {SUGGESTIONS.map((sug) => {
                      const Icon = sug.icon;
                      return (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => handleSend(sug.steps, sug.modelType)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#131620] hover:bg-[#1a1f2c] border border-[#222736] hover:border-[#2f374c] transition text-left group"
                        >
                          <Icon className="w-4 h-4 text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs text-slate-200 group-hover:text-white truncate">
                              {sug.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {sug.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // ACTIVE MESSAGES LIST
                <div className="space-y-4 pb-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="space-y-2.5">
                      {/* USER MESSAGE */}
                      {msg.sender === "user" && (
                        <div className="flex justify-end">
                          <div className="max-w-lg bg-[#181d28] border border-[#2b3345] text-slate-100 rounded-2xl px-4 py-2.5 text-xs space-y-1.5 shadow-sm">
                            <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center justify-between gap-3">
                              <span>Langkah Siswa</span>
                              <span>{msg.timestamp}</span>
                            </div>

                            {msg.steps ? (
                              <div className="space-y-1 font-mono pt-0.5">
                                {msg.steps.map((st, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 bg-[#0d1017] px-2.5 py-1 rounded-lg border border-[#222736]"
                                  >
                                    <span className="text-slate-400 text-[10px] w-4">#{i + 1}</span>
                                    <div className="text-slate-200 overflow-x-auto py-0.5">
                                      <MathView math={st} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : msg.rawText ? (
                              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                                {msg.rawText}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* ASSISTANT MESSAGE */}
                      {msg.sender === "assistant" && (
                        <div className="flex gap-2.5 items-start">
                          <ZLogo className="w-6 h-6 flex-shrink-0 mt-0.5 shadow-sm" />

                          <div className="flex-1 space-y-2 max-w-lg">
                            {/* Model Badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-blue-300 font-semibold px-2 py-0.5 rounded-full bg-blue-950/70 border border-blue-800/50 font-mono flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>{msg.modelName || selectedModel.name}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {msg.timestamp}
                              </span>
                            </div>

                            {/* Free-form Reply / Socratic Prompt */}
                            {msg.replyText && (
                              <div className="bg-[#12151e] border border-[#202534] text-slate-200 rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm">
                                <RichChatText content={msg.replyText} />
                              </div>
                            )}

                            {/* Full SymPy Diagnosis Report */}
                            {msg.diagnosis && (
                              <div className="bg-[#12151e] border border-[#202534] rounded-2xl p-3.5 space-y-2.5 shadow-md">
                                {/* Header Status */}
                                <div className="flex items-center justify-between border-b border-[#202534] pb-2">
                                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                                    {msg.diagnosis.diagnosis.has_fault ? (
                                      <>
                                        <AlertCircle className="w-4 h-4 text-amber-400" />
                                        <span className="text-amber-400">Patah Logika Terdeteksi</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span className="text-emerald-400">Langkah Aljabar Valid</span>
                                      </>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    SymPy CAS
                                  </span>
                                </div>

                                {/* Step-by-Step Lines */}
                                <div className="space-y-1">
                                  {msg.diagnosis.transcription.lines.map((line) => (
                                    <div
                                      key={line.line_number}
                                      className={`flex items-center justify-between px-2.5 py-1 rounded-lg border text-xs font-mono transition ${
                                        line.is_valid
                                          ? "bg-[#0b0d13] border-[#1e2432] text-slate-300"
                                          : "bg-amber-950/20 border-amber-500/40 text-amber-200"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 overflow-x-auto">
                                        <span className="text-slate-400 text-[10px]">
                                          #{line.line_number}
                                        </span>
                                        <MathView math={line.raw_latex} />
                                      </div>
                                      <span
                                        className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold ${
                                          line.is_valid
                                            ? "text-emerald-400 bg-emerald-950/40"
                                            : "text-amber-400 bg-amber-950/60"
                                        }`}
                                      >
                                        {line.is_valid ? "Valid" : "Galat"}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Explanation & Socratic Guidance */}
                                {msg.diagnosis.diagnosis.has_fault && (
                                  <div className="space-y-2 pt-1">
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                      {msg.diagnosis.diagnosis.human_explanation}
                                    </p>

                                    <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-900/40 text-blue-200 space-y-1">
                                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-300">
                                        <MessageSquareQuote className="w-3.5 h-3.5" />
                                        <span>Pertanyaan Sokratik ZAP:</span>
                                      </div>
                                      <p className="text-xs italic leading-relaxed text-blue-100">
                                        {msg.diagnosis.diagnosis.socratic_prompt}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Counter Example Card */}
                                {msg.diagnosis.diagnosis.counter_example && (
                                  <div className="p-2.5 rounded-xl bg-[#0b0d13] border border-[#1e2432] space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="flex items-center gap-1 font-medium text-slate-300">
                                        <FlaskConical className="w-3 h-3 text-slate-400" />
                                        <span>Uji Kontra-Contoh:</span>
                                      </span>
                                      <span className="text-[9px] font-mono text-slate-400">
                                        Substitusi
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1 text-center text-xs">
                                      <div className="p-1.5 rounded bg-[#131620] border border-[#1e2432]">
                                        <div className="text-[8px] text-slate-400">Variabel</div>
                                        <div className="font-bold text-white font-mono text-[11px]">
                                          {msg.diagnosis.diagnosis.counter_example.test_variable} ={" "}
                                          {msg.diagnosis.diagnosis.counter_example.test_value}
                                        </div>
                                      </div>
                                      <div className="p-1.5 rounded bg-[#131620] border border-[#1e2432]">
                                        <div className="text-[8px] text-slate-400">Rumus Asal</div>
                                        <div className="font-bold text-emerald-400 font-mono text-[11px]">
                                          {msg.diagnosis.diagnosis.counter_example.lhs_expected}
                                        </div>
                                      </div>
                                      <div className="p-1.5 rounded bg-[#131620] border border-[#1e2432]">
                                        <div className="text-[8px] text-slate-400">Hitunganmu</div>
                                        <div className="font-bold text-amber-400 font-mono text-[11px]">
                                          {msg.diagnosis.diagnosis.counter_example.rhs_calculated}
                                        </div>
                                      </div>
                                    </div>

                                    <p className="text-[10px] text-slate-300 leading-normal">
                                      <strong>Kontradiksi:</strong>{" "}
                                      {msg.diagnosis.diagnosis.counter_example.contradiction_statement}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2.5 items-center">
                      <ZLogo className="w-5 h-5 animate-pulse" />
                      <div className="bg-[#12151e] border border-[#202534] rounded-xl px-3 py-1.5 text-xs text-slate-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{loadingStatus}</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
              </div>
            </div>

            {/* DOCKED INPUT BAR DI BAWAH KOLOM CHAT */}
            <div className="p-3 bg-[#0f1118] border-t border-[#1f2430] relative z-20">
              <div className={`mx-auto w-full ${show3DCanvas ? "max-w-xl" : "max-w-2xl"}`}>
                <div className="w-full bg-[#161a24] border border-[#272f42] focus-within:border-blue-500/80 rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-lg transition-all">
                  <button
                    type="button"
                    title="Langkah Aljabar"
                    className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0"
                  >
                    <Calculator className="w-4 h-4" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Tuliskan langkah aljabar atau tanyakan konsep..."
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none font-sans py-1 leading-normal max-h-24"
                  />

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ModelPickerWithEffort
                      variant="pill"
                      dropUp={true}
                      selectedModelId={selectedModel.id}
                      onSelectModel={handleSelectModel}
                      reasoningEffort={reasoningEffort}
                      onChangeEffort={setReasoningEffort}
                    />

                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={loading || !inputText.trim()}
                      title="Kirim (Enter)"
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                        inputText.trim() && !loading
                          ? "bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
                          : "bg-[#202533] text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center mt-1.5">
                  Tekan Enter untuk mendiagnosa • Shift+Enter untuk baris baru
                </div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: KANVAS 3D INTERAKTIF (HANYA MUNCUL SAAT AKTIF) */}
          {show3DCanvas && (
            <div
              className={`h-full bg-[#080a0e] p-3 transition-all flex flex-col ${
                mobileTab === "canvas" ? "w-full" : "hidden lg:flex lg:w-1/2 xl:w-5/12"
              }`}
            >
              <div className="w-full h-full rounded-2xl overflow-hidden border border-[#1f2430] bg-[#0c0e14] shadow-xl relative flex flex-col">
                <InteractiveCanvas3D
                  initialModel={active3DModel}
                  showComparisonFault={showFaultComparison}
                  onModelChange={setActive3DModel}
                  isProjectorMode={isProjectorMode}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
