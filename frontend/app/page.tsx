"use client";

import React, { useState, useEffect, useRef } from "react";
import MathView from "@/components/MathView";
import RichChatText from "@/components/RichChatText";
import ModelPickerWithEffort, {
  AVAILABLE_MODELS,
  type AIModel,
  type ReasoningEffort,
} from "@/components/ModelPickerWithEffort";
import {
  Plus,
  ArrowUp,
  RotateCw,
  Menu,
  X,
  Lightbulb,
  Search,
  CheckCircle2,
  AlertCircle,
  MessageSquareQuote,
  FlaskConical,
  Cpu,
} from "lucide-react";

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
}

const PRESET_SAMPLES: PresetSample[] = [
  {
    id: "sample-1",
    title: "Ekspansi Kuadrat",
    subtitle: "(x + 3)^2 - 4 → x^2 + 9 - 4",
    icon: Lightbulb,
    steps: ["(x + 3)^2 - 4", "x^2 + 9 - 4", "x^2 + 5"],
    targetVar: "x",
  },
  {
    id: "sample-2",
    title: "Kehilangan Akar",
    subtitle: "x^2 = 4 → x = 2",
    icon: Search,
    steps: ["x^2 = 4", "x = 2"],
    targetVar: "x",
  },
  {
    id: "sample-3",
    title: "Penurunan Valid",
    subtitle: "2x + 3 = 7 → 2x = 4 → x = 2",
    icon: CheckCircle2,
    steps: ["2*x + 3 = 7", "2*x = 4", "x = 2"],
    targetVar: "x",
  },
];

export default function ChatGPTStyleNalarAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [targetVar, setTargetVar] = useState<string>("x");
  const [selectedModel, setSelectedModel] = useState<AIModel>(AVAILABLE_MODELS[0]);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>("medium");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("Menganalisis langkah aljabar...");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeProblemFirstStep, setActiveProblemFirstStep] = useState<string | null>(null);
  const [activeProblemContext, setActiveProblemContext] = useState<ActiveProblemContext | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const checkHealth = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/health", { method: "GET" });
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
    setSidebarOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSend = async (customSteps?: string[]) => {
    const rawInput = customSteps ? customSteps.join("\n") : inputText.trim();
    if (!rawInput && !customSteps) return;

    // Normalisasi shorthand penulisan siswa: x2 -> x^2 (kecuali sudah ada ^)
    const normalizeStep = (s: string) => {
      return s.replace(/([a-zA-Z])(\d+)/g, (match, v, d) => `${v}^${d}`);
    };

    const stepsArray = customSteps
      ? customSteps
      : rawInput
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

    if (stepsArray.length === 0) return;

    // Deteksi apakah input merupakan obrolan percakapan / pertanyaan konsep ke LLM
    const conversationalWordRegex = /\b(hai|halo|pagi|siang|malam|sore|mau|nanya|tanya|kenapa|mengapa|gimana|bagaimana|jelaskan|maksud|kok|lah|bantu|apa|bisa|dong|kak|min|siapa|kamu|tolong|solusi|bingung|caranya|rumus|help|why|how|what|explain|hello|hi)\b/i;

    const isConversational =
      !customSteps &&
      stepsArray.length === 1 &&
      (
        conversationalWordRegex.test(rawInput) ||
        rawInput.includes("?") ||
        !/[0-9+\-*/^=()\\]/.test(rawInput)
      );

    if (isConversational) {
      const userMsg: Message = {
        id: "msg_" + Date.now(),
        sender: "user",
        rawText: rawInput,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setLoading(true);
      setLoadingStatus("NalarAI sedang merancang bimbingan...");

      try {
        const storedKey = typeof window !== "undefined" ? localStorage.getItem("nalar_gemini_api_key") || "" : "";
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: rawInput,
            activeProblem: activeProblemContext,
            modelId: selectedModel.id,
            apiKey: storedKey,
          }),
        });

        if (!res.ok) {
          throw new Error(`Chat HTTP ${res.status}`);
        }

        const chatData = await res.json();
        const replyText = chatData.reply || "Maaf, respon tidak dapat diproses saat ini.";

        const assistantMsg: Message = {
          id: "msg_" + (Date.now() + 1),
          sender: "assistant",
          replyText: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error("Chat error:", err);
        const assistantMsg: Message = {
          id: "msg_" + (Date.now() + 1),
          sender: "assistant",
          replyText: "Terjadi gangguan saat menghubungkan ke asisten obrolan. Silakan coba kembali.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normalisasi notasi matematika
    const normalizedSteps = stepsArray.map((s) => normalizeStep(s));

    // Cek apakah ini koreksi 1 langkah terhadap problem aktif sebelumnya
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
    setSidebarOpen(false);
    setLoading(true);
    setLoadingStatus("Menganalisis konsistensi aljabar dengan SymPy CAS...");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/diagnose", {
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

      let customReplyText: string | undefined = undefined;
      if (!isCorrection && stepsToSend.length === 1) {
        setActiveProblemFirstStep(stepsToSend[0]);
        customReplyText = `Langkah awal "${stepsArray[0]}" tercatat. Masukkan baris penurunan berikutnya untuk menguji validitas aljabar langkahmu.`;
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

      // Perbarui konteks problem aktif untuk Sokratik AI Tutor
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
      setBackendStatus("online");
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan";
      
      let userFriendlyText = "";
      if (
        errText.includes("whitelist") ||
        errText.includes("Gagal mengurai") ||
        errText.includes("tidak valid")
      ) {
        userFriendlyText = `Input "${rawInput}" tidak dapat diurai sebagai rumus aljabar yang valid. Pastikan rumus menggunakan simbol matematika yang diizinkan (misal: +, -, *, /, ^, =).`;
      } else {
        userFriendlyText = `Gagal menganalisis: ${errText}. Pastikan server backend FastAPI berjalan di port 8000.`;
      }

      const assistantMsg: Message = {
        id: "msg_" + (Date.now() + 1),
        sender: "assistant",
        replyText: userFriendlyText,
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
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      
      {/* SIDEBAR OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR (MINIMALIST, POLOS, NO GRADIENTS) */}
      <aside
        className={`fixed sm:static inset-y-0 left-0 z-40 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        {/* New Chat Button */}
        <div className="p-3 flex items-center justify-between border-b border-zinc-800/80">
          <button
            onClick={startNewChat}
            className="flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700/80 text-xs font-medium text-zinc-200 transition"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-zinc-300" />
              <span>Diagnosa Baru</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Reset</span>
          </button>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 ml-2 text-zinc-400 hover:text-zinc-200 sm:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Sample Threads */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 px-2 py-1">
            Sampel Kertas Buram
          </div>

          {PRESET_SAMPLES.map((sample) => {
            const Icon = sample.icon;
            return (
              <button
                key={sample.id}
                onClick={() => handleSend(sample.steps)}
                className="w-full text-left p-2 rounded-lg hover:bg-zinc-800 transition flex items-center gap-2.5 text-xs text-zinc-300 hover:text-zinc-100 border border-transparent hover:border-zinc-700/50"
              >
                <Icon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{sample.title}</div>
                  <div className="text-[10px] text-zinc-400 truncate font-mono">
                    {sample.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-[11px]">Variabel aljabar:</span>
            <input
              type="text"
              value={targetVar}
              onChange={(e) => setTargetVar(e.target.value)}
              className="w-7 text-center text-xs font-mono bg-zinc-950 border border-zinc-700 rounded px-1 text-zinc-200 focus:outline-none focus:border-zinc-500"
              title="Target variable aljabar"
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === "online" ? "bg-emerald-400" : "bg-zinc-600"
                }`}
              />
              <span className="text-[11px] text-zinc-400 font-mono">
                {backendStatus === "online" ? "SymPy Engine" : "Offline"}
              </span>
            </div>
            <button
              onClick={checkHealth}
              title="Cek ulang koneksi"
              className="text-zinc-400 hover:text-zinc-200"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP NAVBAR (COMPACT, FLAT, NO OVERFLOW) */}
        <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-3 sm:px-4 bg-zinc-950 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition sm:hidden"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5 truncate">
              <span>NalarAI</span>
              <span className="text-[10px] text-zinc-400 px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 font-mono hidden xs:inline-block">
                2.2
              </span>
            </span>
          </div>

          {/* Model Picker with Effort (Responsive, Polos) */}
          <div className="flex items-center gap-2">
            <ModelPickerWithEffort
              selectedModelId={selectedModel.id}
              onSelectModel={setSelectedModel}
              reasoningEffort={reasoningEffort}
              onChangeEffort={setReasoningEffort}
            />
          </div>
        </header>

        {/* CHAT STREAM */}
        <div className="flex-1 overflow-y-auto px-3 py-4 sm:p-6 space-y-4">
          <div className="max-w-3xl mx-auto w-full space-y-4 pb-20">
            
            {/* EMPTY STATE */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-3 shadow-sm">
                  <Cpu className="w-5 h-5" />
                </div>

                <h1 className="text-lg sm:text-xl font-semibold text-zinc-100 mb-1">
                  Diagnostik Kognitif Aljabar
                </h1>
                <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
                  Tuliskan baris langkah hitungan matematika siswa. NalarAI melacak letak kesalahan tanpa membocorkan kunci jawaban.
                </p>

                {/* 3 Starter Cards - Flat & Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-xl text-left">
                  {PRESET_SAMPLES.map((sample) => {
                    const Icon = sample.icon;
                    return (
                      <button
                        key={sample.id}
                        onClick={() => handleSend(sample.steps)}
                        className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 transition flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-zinc-400" />
                          <span className="text-xs font-medium text-zinc-200">{sample.title}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono truncate w-full">
                          {sample.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MESSAGES LIST */}
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                
                {/* USER MESSAGE */}
                {msg.sender === "user" && (
                  <div className="flex justify-end">
                    <div className="max-w-xl bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl px-3.5 py-2.5 text-xs space-y-1.5 shadow-sm">
                      <div className="text-[10px] uppercase font-mono text-zinc-400 flex items-center justify-between gap-3">
                        <span>Langkah Siswa</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {msg.steps && (
                        <div className="space-y-1 font-mono pt-1">
                          {msg.steps.map((st, i) => (
                            <div key={i} className="flex items-center gap-2 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                              <span className="text-zinc-400 text-[11px] w-4">#{i + 1}</span>
                              <div className="text-zinc-200 overflow-x-auto py-0.5">
                                <MathView math={st} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.rawText && (
                        <p className="text-xs text-zinc-200 leading-relaxed font-mono">
                          {msg.rawText}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ASSISTANT MESSAGE */}
                {msg.sender === "assistant" && (
                  <div className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold flex-shrink-0 mt-0.5">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 space-y-3 max-w-xl min-w-0">
                      
                      {msg.replyText && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 leading-relaxed">
                          <RichChatText content={msg.replyText} />
                        </div>
                      )}

                      {msg.diagnosis && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-3 text-xs">
                          
                          {/* Status Header - Flat, Clear, No Gradients */}
                          {msg.diagnosis.diagnosis.has_fault ? (
                            <div className="p-3 rounded-lg bg-zinc-950 border-l-4 border-l-amber-500 border border-zinc-800">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <span className="font-semibold text-zinc-100 text-xs">
                                  Titik Patah: Baris ke-{msg.diagnosis.diagnosis.first_fault_line}
                                </span>
                                <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded">
                                  {msg.diagnosis.diagnosis.fault_type}
                                </span>
                              </div>
                              <p className="text-zinc-300 text-[11px] leading-relaxed">
                                {msg.diagnosis.diagnosis.human_explanation}
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-zinc-950 border-l-4 border-l-emerald-500 border border-zinc-800">
                              <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span className="font-semibold text-zinc-100 text-xs">
                                  Seluruh Langkah Penurunan Aljabar Valid
                                </span>
                              </div>
                              <p className="text-zinc-300 text-[11px] leading-relaxed">
                                {msg.diagnosis.diagnosis.human_explanation}
                              </p>
                            </div>
                          )}

                          {/* Line-by-Line Breakdown */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                              Verifikasi Langkah Simbolik:
                            </span>
                            <div className="space-y-1">
                              {msg.diagnosis.transcription.lines.map((ln) => {
                                const isFault = ln.line_number === msg.diagnosis?.diagnosis.first_fault_line;
                                return (
                                  <div
                                    key={ln.line_number}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono border ${
                                      isFault
                                        ? "bg-zinc-950 border-amber-500 text-zinc-100"
                                        : ln.is_valid
                                        ? "bg-zinc-950 border-zinc-800 text-zinc-300"
                                        : "bg-zinc-950/60 border-zinc-800/60 text-zinc-400"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 overflow-x-auto min-w-0 mr-2 py-0.5">
                                      <span className="text-zinc-400 text-[11px]">#{ln.line_number}</span>
                                      <MathView math={ln.raw_latex} />
                                    </div>
                                    <span className="text-[10px] font-sans font-medium flex-shrink-0">
                                      {isFault ? (
                                        <span className="text-amber-400 font-bold">Titik Galat</span>
                                      ) : ln.is_valid ? (
                                        <span className="text-emerald-400">Valid</span>
                                      ) : (
                                        <span className="text-zinc-400">Turunan</span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Socratic Card */}
                          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span className="flex items-center gap-1 font-medium text-zinc-300">
                                <MessageSquareQuote className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Petunjuk Sokrates:</span>
                              </span>
                              <span className="text-[9px] font-mono">Zero-Answer</span>
                            </div>
                            <blockquote className="text-xs text-zinc-200 italic leading-relaxed pl-2 border-l-2 border-zinc-600">
                              &ldquo;{msg.diagnosis.diagnosis.socratic_prompt}&rdquo;
                            </blockquote>
                          </div>

                          {/* Numerical Counter-Example */}
                          {msg.diagnosis.diagnosis.counter_example && (
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="flex items-center gap-1 font-medium text-zinc-300">
                                  <FlaskConical className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Uji Kontra-Contoh Konkret:</span>
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400">Substitusi</span>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                                <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                                  <div className="text-[9px] text-zinc-400">Variabel</div>
                                  <div className="font-bold text-zinc-200 font-mono text-xs">
                                    {msg.diagnosis.diagnosis.counter_example.test_variable} = {msg.diagnosis.diagnosis.counter_example.test_value}
                                  </div>
                                </div>
                                <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                                  <div className="text-[9px] text-zinc-400">Rumus Asal</div>
                                  <div className="font-bold text-emerald-400 font-mono text-xs">
                                    {msg.diagnosis.diagnosis.counter_example.lhs_expected}
                                  </div>
                                </div>
                                <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                                  <div className="text-[9px] text-zinc-400">Hitunganmu</div>
                                  <div className="font-bold text-amber-400 font-mono text-xs">
                                    {msg.diagnosis.diagnosis.counter_example.rhs_calculated}
                                  </div>
                                </div>
                              </div>

                              <p className="text-[11px] text-zinc-300 leading-normal">
                                <strong>Kontradiksi:</strong> {msg.diagnosis.diagnosis.counter_example.contradiction_statement}
                              </p>
                            </div>
                          )}

                          <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/80">
                            <span>ID: {msg.diagnosis.session_id}</span>
                            <span>Ketik perbaikanmu untuk menguji ulang</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                  <Cpu className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 flex items-center gap-2 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{loadingStatus}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* BOTTOM INPUT BAR (CLEAN, FLAT, NO OVERFLOW) */}
        <div className="border-t border-zinc-800 bg-zinc-950 p-2.5 sm:p-4">
          <div className="max-w-3xl mx-auto w-full">
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl focus-within:border-zinc-700 transition p-2 flex items-end gap-2 shadow-sm">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={inputText.split("\n").length > 3 ? 4 : Math.max(1, inputText.split("\n").length)}
                placeholder="Tuliskan langkah aljabar (Enter untuk baris baru)..."
                className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 px-1 py-1 focus:outline-none resize-none max-h-32 font-mono"
              />

              <button
                onClick={() => handleSend()}
                disabled={loading || !inputText.trim()}
                title="Kirim (Enter)"
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                  inputText.trim() && !loading
                    ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[10px] text-zinc-400 text-center mt-1.5 hidden sm:block">
              Tekan Enter untuk mendiagnosa • Shift+Enter untuk baris baru
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
