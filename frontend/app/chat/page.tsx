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
  deriveTitle,
  formatRelativeTime,
  loadConversations,
  removeConversation,
  saveConversations,
  upsertConversation,
  windowHistory,
  type StoredConversation,
} from "@/utils/chat-memory";
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
  Sparkles,
  Calculator,
  Compass,
  Globe,
  Trash2,
  Maximize,
  Minimize,
  X,
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

type StoredConv = StoredConversation<Message, ActiveProblemContext>;

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

  // Papan tulis virtual (kanvas 3D) di panel kanan, terbuka secara bawaan
  // di layar lebar dan bisa diperbesar menjadi layar penuh.
  const [show3DCanvas, setShow3DCanvas] = useState<boolean>(true);
  const [active3DModel, setActive3DModel] = useState<MathModelType>("parabola");
  const [showFaultComparison, setShowFaultComparison] = useState<boolean>(false);
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<ZAPUser | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "canvas">("chat");
  const [boardFullscreen, setBoardFullscreen] = useState<boolean>(false);

  // Memory chat: daftar percakapan tersimpan + percakapan aktif.
  const [conversations, setConversations] = useState<StoredConv[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>(
    () => "conv_" + Date.now()
  );
  const [memoryReady, setMemoryReady] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const boardPanelRef = useRef<HTMLDivElement>(null);
  const createdAtRef = useRef<number>(Date.now());

  // Pulihkan memory chat saat pertama dimuat + model tersimpan + health check.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedModelId = localStorage.getItem("zap_selected_model_id");
      if (savedModelId) {
        const found = AVAILABLE_MODELS.find((m) => m.id === savedModelId);
        if (found) {
          setSelectedModel(found);
        }
      }
      const stored = loadConversations<Message, ActiveProblemContext>();
      if (stored.length > 0) {
        setConversations(stored);
        const latest = stored[0];
        setActiveConversationId(latest.id);
        createdAtRef.current = latest.createdAt;
        setMessages(latest.messages);
        setActiveProblemFirstStep(latest.activeProblemFirstStep);
        setActiveProblemContext(latest.activeProblemContext);
        setTargetVar(latest.targetVar || "x");
      }
    }
    setMemoryReady(true);
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan percakapan aktif setiap ada perubahan (memory persisten).
  useEffect(() => {
    if (!memoryReady || messages.length === 0) return;
    const entry: StoredConv = {
      id: activeConversationId,
      title: deriveTitle(messages),
      createdAt: createdAtRef.current,
      updatedAt: Date.now(),
      messages,
      activeProblemFirstStep,
      activeProblemContext,
      targetVar,
    };
    setConversations((prev) => {
      const next = upsertConversation(prev, entry);
      saveConversations(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeProblemContext, activeProblemFirstStep, targetVar, memoryReady]);

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
    createdAtRef.current = Date.now();
    setActiveConversationId("conv_" + Date.now());
    setMessages([]);
    setInputText("");
    setActiveProblemFirstStep(null);
    setActiveProblemContext(null);
    setShowFaultComparison(false);
  };

  const openConversation = (id: string) => {
    const found = conversations.find((c) => c.id === id);
    if (!found) return;
    createdAtRef.current = found.createdAt;
    setActiveConversationId(found.id);
    setMessages(found.messages);
    setActiveProblemFirstStep(found.activeProblemFirstStep);
    setActiveProblemContext(found.activeProblemContext);
    setTargetVar(found.targetVar || "x");
    setInputText("");
    setMobileTab("chat");
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => {
      const next = removeConversation(prev, id);
      saveConversations(next);
      return next;
    });
    if (id === activeConversationId) {
      startNewChat();
    }
  };

  const toggleBoardFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (boardPanelRef.current) {
        await boardPanelRef.current.requestFullscreen();
      }
    } catch {
      // Fullscreen ditolak browser: panel tetap tampil apa adanya.
    }
  };

  useEffect(() => {
    const onFsChange = () => setBoardFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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
    return /[\d\+\-\*\/\^\=\\\_\{\}\(\)]/.test(clean) && !/^[a-zA-Z\s\?\,\.\!]+$/.test(clean);
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
        // Memory konteks: hanya 20 pesan terakhir yang dikirim ke model.
        const conversationHistory = windowHistory(messages, 20);

        const savedBazaarlinkKey =
          typeof window !== "undefined"
            ? localStorage.getItem("zap_bazaarlink_api_key") || undefined
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
            userName: currentUser?.name || "Pengguna ZAP",
          }),
        });

        if (!res.ok) {
          throw new Error(`Chat HTTP ${res.status}`);
        }

        const chatData = await res.json();
        const replyText =
          chatData.reply ||
          "Halo! Saya tutor Sokratik ZAP. Tuliskan persamaan atau langkah penurunan aljabar yang ingin kamu buktikan hari ini (contoh: (x + 3)^2 - 4), dan kita amati grafiknya di papan tulis virtual sebelah kanan.";

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
            "Halo! Ada persamaan aljabar yang ingin kita analisis bersama? Tuliskan langkah penurunan rumusmu di bawah untuk diverifikasi oleh SymPy CAS dan dimodelkan di papan tulis virtual sebelah kanan.",
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
      className={`flex h-screen bg-[#0a0a0b] text-zinc-200 overflow-hidden font-sans ${
        isProjectorMode ? "text-sm contrast-125" : "text-xs"
      }`}
    >
      {/* 1. SIDEBAR KIRI: simpel, ala panel sesi */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#101012] border-r border-white/[0.06] flex flex-col transition-transform duration-200 ease-in-out sm:static sm:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full sm:hidden"
        }`}
      >
        {/* Brand */}
        <div className="h-12 px-3.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-90 transition" title="Kembali ke Beranda chatzap.xyz">
            <ZLogo className="w-6 h-6 flex-shrink-0" />
            <span className="font-semibold text-sm tracking-wide text-white">ZAP</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 font-mono">
              Zero Answer
            </span>
          </a>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            title="Ciutkan menu"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Sesi Baru */}
        <div className="px-3 pb-2">
          <button
            onClick={startNewChat}
            className="w-full py-2 px-3 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-zinc-100 font-medium text-xs flex items-center justify-center gap-2 transition active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Sesi Baru</span>
          </button>
        </div>

        {/* Navigasi */}
        <div className="px-3 pb-2 space-y-0.5">
          <Link
            href="/connector"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.05] transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Connector / Plugin</span>
          </Link>
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400">
            <selectedModel.icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">
              Model: <span className="text-zinc-200 font-medium">{selectedModel.shortName}</span>
            </span>
            <Link href="/connector" className="ml-auto text-[10px] text-blue-400 hover:text-blue-300 flex-shrink-0">
              Ganti
            </Link>
          </div>
        </div>

        {/* Riwayat + Simulasi (scroll) */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-2">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-2.5 pt-1 pb-1">
              Riwayat Percakapan
            </div>
            {conversations.length === 0 ? (
              <p className="px-2.5 text-[11px] text-zinc-600 leading-relaxed">
                Belum ada riwayat. Percakapanmu tersimpan otomatis di perangkat ini.
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                    conv.id === activeConversationId
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="truncate flex-1 text-left">{conv.title}</span>
                  <span className="text-[9px] text-zinc-600 flex-shrink-0 group-hover:hidden">
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                  <button
                    type="button"
                    title="Hapus percakapan"
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="hidden group-hover:block flex-shrink-0 text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-2.5 pt-1 pb-1">
              Simulasi Cepat
            </div>
            {PRESET_SAMPLES.map((sample) => {
              const Icon = sample.icon;
              return (
                <button
                  key={sample.id}
                  onClick={() => handleSend(sample.steps, sample.modelType)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition flex items-center gap-2.5"
                >
                  <Icon className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  <span className="truncate">{sample.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status CAS + variabel target */}
        <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-zinc-500 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === "online" ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="font-mono text-[10px]">
              {backendStatus === "online" ? "CAS SymPy Online" : "CAS Offline"}
            </span>
            <button onClick={checkHealth} title="Cek koneksi CAS" className="text-zinc-500 hover:text-white ml-0.5">
              <RotateCw className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">Var:</span>
            <input
              type="text"
              value={targetVar}
              onChange={(e) => setTargetVar(e.target.value.toLowerCase())}
              maxLength={2}
              className="w-5 text-center bg-white/[0.06] text-white rounded text-[10px] font-mono focus:outline-none border border-white/[0.08]"
            />
          </div>
        </div>

        {/* Profil pengguna */}
        <div className="p-2 border-t border-white/[0.06]">
          <GoogleAuthButton variant="sidebar-profile" onUserChange={setCurrentUser} />
        </div>
      </aside>

      {/* 2. AREA UTAMA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Header tipis */}
        <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-3 sm:px-4 z-20 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition flex-shrink-0"
                title="Buka menu navigasi"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            <span className="font-medium text-xs sm:text-sm text-zinc-100 truncate">Studio ZAP</span>
            <span className="text-[10px] text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 font-mono hidden md:inline-block flex-shrink-0">
              Zero-Answer Policy
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ModelPickerWithEffort
              variant="default"
              selectedModelId={selectedModel.id}
              onSelectModel={handleSelectModel}
              reasoningEffort={reasoningEffort}
              onChangeEffort={setReasoningEffort}
            />
            <button
              onClick={() => setShow3DCanvas(!show3DCanvas)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                show3DCanvas
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                  : "border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Papan Tulis</span>
            </button>
            <button
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              title="Mode Presentasi Proyektor"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                isProjectorMode
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : "border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Proyektor</span>
            </button>
            <GoogleAuthButton variant="avatar-only" onUserChange={setCurrentUser} />
          </div>
        </header>

        {/* Tab mobile saat papan aktif */}
        {show3DCanvas && (
          <div className="flex lg:hidden border-b border-white/[0.06] text-xs font-medium flex-shrink-0">
            <button
              onClick={() => setMobileTab("chat")}
              className={`flex-1 py-2 text-center transition ${
                mobileTab === "chat"
                  ? "border-b-2 border-blue-500 text-blue-400 font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Bimbingan Sokratik
            </button>
            <button
              onClick={() => setMobileTab("canvas")}
              className={`flex-1 py-2 text-center transition ${
                mobileTab === "canvas"
                  ? "border-b-2 border-blue-500 text-blue-400 font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Papan Tulis Virtual
            </button>
          </div>
        )}

        {/* Workspace: chat di tengah, papan tulis di kanan */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* KOLOM CHAT */}
          <div
            className={`flex flex-col h-full overflow-hidden transition-all duration-200 ${
              show3DCanvas
                ? mobileTab === "chat"
                  ? "w-full lg:w-[55%] lg:flex-none border-r border-white/[0.06]"
                  : "hidden lg:flex lg:w-[55%] lg:flex-none border-r border-white/[0.06]"
                : "w-full"
            }`}
          >
            {/* Aliran pesan */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className={`mx-auto w-full ${show3DCanvas ? "max-w-xl" : "max-w-2xl"}`}>
                {messages.length === 0 ? (
                  // EMPTY STATE: sapaan di tengah + saran eksplorasi
                  <div className="h-full flex flex-col items-center justify-center text-center px-2 py-10">
                    <ZLogo className="w-11 h-11 mb-3" />
                    <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1.5">
                      Mau membuktikan apa hari ini?
                    </h1>
                    <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
                      Tuliskan langkah aljabar penurunan rumusmu. ZAP membimbing penalaranmu
                      tanpa memberi contekan instan, dan memvisualisasikannya di papan tulis
                      virtual sebelah kanan.
                    </p>

                    <div className="w-full max-w-md space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 text-left px-1">
                        Coba Eksplorasi Cepat
                      </div>
                      {SUGGESTIONS.map((sug) => {
                        const Icon = sug.icon;
                        return (
                          <button
                            key={sug.id}
                            type="button"
                            onClick={() => handleSend(sug.steps, sug.modelType)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition text-left group"
                          >
                            <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-xs text-zinc-200 group-hover:text-white truncate">
                                {sug.title}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono truncate">
                                {sug.subtitle}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // DAFTAR PESAN AKTIF
                  <div className="space-y-4 pb-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="space-y-2.5">
                        {/* PESAN PENGGUNA */}
                        {msg.sender === "user" && (
                          <div className="flex justify-end">
                            <div className="max-w-lg bg-white/[0.06] border border-white/[0.08] text-zinc-100 rounded-2xl px-4 py-2.5 text-xs space-y-1.5">
                              <div className="text-[10px] uppercase font-mono text-zinc-500 flex items-center justify-between gap-3">
                                <span>Langkah Siswa</span>
                                <span>{msg.timestamp}</span>
                              </div>

                              {msg.steps ? (
                                <div className="space-y-1 font-mono pt-0.5">
                                  {msg.steps.map((st, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 bg-black/30 px-2.5 py-1 rounded-lg border border-white/[0.06]"
                                    >
                                      <span className="text-zinc-500 text-[10px] w-4">#{i + 1}</span>
                                      <div className="text-zinc-100 overflow-x-auto py-0.5">
                                        <MathView math={st} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : msg.rawText ? (
                                <p className="text-xs text-zinc-100 leading-relaxed font-sans">
                                  {msg.rawText}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {/* PESAN ASISTEN */}
                        {msg.sender === "assistant" && (
                          <div className="flex gap-2.5 items-start">
                            <ZLogo className="w-6 h-6 flex-shrink-0 mt-0.5" />

                            <div className="flex-1 space-y-2 max-w-lg min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-blue-300 font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 font-mono flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>{msg.modelName || selectedModel.name}</span>
                                </span>
                                <span className="text-[10px] text-zinc-600 font-mono">
                                  {msg.timestamp}
                                </span>
                              </div>

                              {msg.replyText && (
                                <div className="bg-[#131315] border border-white/[0.06] text-zinc-200 rounded-2xl px-4 py-3 text-xs leading-relaxed">
                                  <RichChatText content={msg.replyText} />
                                </div>
                              )}

                              {/* Laporan diagnosis SymPy lengkap */}
                              {msg.diagnosis && (
                                <div className="bg-[#131315] border border-white/[0.06] rounded-2xl p-3.5 space-y-2.5">
                                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
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
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      SymPy CAS
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    {msg.diagnosis.transcription.lines.map((line) => (
                                      <div
                                        key={line.line_number}
                                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg border text-xs font-mono transition ${
                                          line.is_valid
                                            ? "bg-black/30 border-white/[0.06] text-zinc-300"
                                            : "bg-amber-950/20 border-amber-500/40 text-amber-200"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 overflow-x-auto">
                                          <span className="text-zinc-500 text-[10px]">
                                            #{line.line_number}
                                          </span>
                                          <MathView math={line.raw_latex} />
                                        </div>
                                        <span
                                          className={`text-[9px] px-1.5 py-0.5 rounded font-sans uppercase font-bold ${
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

                                  {msg.diagnosis.diagnosis.has_fault && (
                                    <div className="space-y-2 pt-1">
                                      <p className="text-xs text-zinc-300 leading-relaxed">
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

                                  {msg.diagnosis.diagnosis.counter_example && (
                                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-1.5">
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="flex items-center gap-1 font-medium text-zinc-300">
                                          <FlaskConical className="w-3 h-3 text-zinc-500" />
                                          <span>Uji Kontra-Contoh:</span>
                                        </span>
                                        <span className="text-[9px] font-mono text-zinc-500">
                                          Substitusi
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-3 gap-1 text-center text-xs">
                                        <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06]">
                                          <div className="text-[8px] text-zinc-500">Variabel</div>
                                          <div className="font-bold text-white font-mono text-[11px]">
                                            {msg.diagnosis.diagnosis.counter_example.test_variable} ={" "}
                                            {msg.diagnosis.diagnosis.counter_example.test_value}
                                          </div>
                                        </div>
                                        <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06]">
                                          <div className="text-[8px] text-zinc-500">Rumus Asal</div>
                                          <div className="font-bold text-emerald-400 font-mono text-[11px]">
                                            {msg.diagnosis.diagnosis.counter_example.lhs_expected}
                                          </div>
                                        </div>
                                        <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06]">
                                          <div className="text-[8px] text-zinc-500">Hitunganmu</div>
                                          <div className="font-bold text-amber-400 font-mono text-[11px]">
                                            {msg.diagnosis.diagnosis.counter_example.rhs_calculated}
                                          </div>
                                        </div>
                                      </div>

                                      <p className="text-[10px] text-zinc-300 leading-normal">
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
                        <div className="bg-[#131315] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-zinc-400 flex items-center gap-2">
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

            {/* Composer di bawah kolom chat */}
            <div className="p-3 flex-shrink-0">
              <div className={`mx-auto w-full ${show3DCanvas ? "max-w-xl" : "max-w-2xl"}`}>
                <div className="w-full bg-[#17171a] border border-white/[0.08] focus-within:border-blue-500/60 rounded-2xl px-3 py-2 flex items-end gap-2 transition-all">
                  <button
                    type="button"
                    title="Langkah Aljabar"
                    className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0 mb-0.5"
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
                    className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none font-sans py-1.5 leading-normal max-h-28"
                  />

                  <div className="flex items-center gap-1.5 flex-shrink-0 mb-0.5">
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
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                        inputText.trim() && !loading
                          ? "bg-blue-600 text-white hover:bg-blue-500"
                          : "bg-white/[0.06] text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-600 text-center mt-1.5">
                  Enter untuk mendiagnosa, Shift+Enter untuk baris baru. Riwayat tersimpan otomatis di perangkat ini.
                </div>
              </div>
            </div>
          </div>

          {/* PANEL KANAN: PAPAN TULIS VIRTUAL */}
          {show3DCanvas && (
            <div
              className={`h-full bg-[#0c0c0d] ${
                mobileTab === "canvas" ? "w-full" : "hidden lg:block lg:flex-1 lg:min-w-0"
              }`}
            >
              <div ref={boardPanelRef} className="flex flex-col h-full w-full bg-[#0c0c0d]">
                <div className="h-11 flex items-center justify-between px-3 border-b border-white/[0.06] flex-shrink-0">
                  <span className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-blue-400" />
                    Papan Tulis Virtual 3D
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleBoardFullscreen}
                      title={boardFullscreen ? "Keluar layar penuh" : "Layar penuh"}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
                    >
                      {boardFullscreen ? (
                        <Minimize className="w-4 h-4" />
                      ) : (
                        <Maximize className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setShow3DCanvas(false)}
                      title="Tutup papan tulis"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative min-h-0">
                  <InteractiveCanvas3D
                    initialModel={active3DModel}
                    showComparisonFault={showFaultComparison}
                    onModelChange={setActive3DModel}
                    isProjectorMode={isProjectorMode}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
