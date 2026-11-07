"use client";

import React, { useState, useEffect, useRef } from "react";
import MathView from "@/components/MathView";
import ModelPickerWithEffort, {
  AVAILABLE_MODELS,
  type AIModel,
  type ReasoningEffort,
} from "@/components/ModelPickerWithEffort";

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

interface PresetSample {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  steps: string[];
  targetVar: string;
}

const PRESET_SAMPLES: PresetSample[] = [
  {
    id: "sample-1",
    title: "Ekspansi Kuadrat",
    subtitle: "(x + 3)^2 - 4 → x^2 + 9 - 4",
    icon: "💡",
    steps: ["(x + 3)^2 - 4", "x^2 + 9 - 4", "x^2 + 5"],
    targetVar: "x",
  },
  {
    id: "sample-2",
    title: "Kehilangan Akar",
    subtitle: "x^2 = 4 → x = 2",
    icon: "🔍",
    steps: ["x^2 = 4", "x = 2"],
    targetVar: "x",
  },
  {
    id: "sample-3",
    title: "Penurunan Valid",
    subtitle: "2x + 3 = 7 → 2x = 4 → x = 2",
    icon: "✨",
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
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cek backend health
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
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSend = async (customSteps?: string[]) => {
    const rawInput = customSteps ? customSteps.join("\n") : inputText.trim();
    if (!rawInput && !customSteps) return;

    // Pisahkan baris input menjadi langkah-langkah
    const stepsArray = customSteps
      ? customSteps
      : rawInput
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

    if (stepsArray.length === 0) return;

    // Jika pesan sebelumnya sudah ada diagnosa dan user hanya mengetik 1 baris teks biasa (jawaban refleksi)
    const lastMsg = messages[messages.length - 1];
    const isFollowUp = !customSteps && lastMsg && lastMsg.sender === "assistant" && stepsArray.length === 1 && !stepsArray[0].includes("=");

    if (isFollowUp) {
      const userFollowUp: Message = {
        id: "msg_" + Date.now(),
        sender: "user",
        rawText: stepsArray[0],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userFollowUp]);
      setInputText("");
      setLoading(true);

      setTimeout(() => {
        const assistantReply: Message = {
          id: "msg_" + (Date.now() + 1),
          sender: "assistant",
          replyText: `Analisis yang sangat bagus! Menyadari bahwa "${stepsArray[0]}" adalah kunci untuk memahami alur berpikir matematika yang utuh. Melalui refleksi mandiri seperti ini, pemahaman konsepmu menjadi jauh lebih melekat daripada sekadar menyalin rumus jadi.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantReply]);
        setLoading(false);
      }, 700);
      return;
    }

    // Alur diagnosa aljabar baru
    const userMsg: Message = {
      id: "msg_" + Date.now(),
      sender: "user",
      steps: stepsArray,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed_steps: stepsArray,
          target_variable: targetVar.trim() || "x",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || `Error HTTP ${res.status}`);
      }

      const data: DiagnoseResponse = await res.json();
      const assistantMsg: Message = {
        id: "msg_" + (Date.now() + 1),
        sender: "assistant",
        diagnosis: data,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setBackendStatus("online");
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan";
      const assistantMsg: Message = {
        id: "msg_" + (Date.now() + 1),
        sender: "assistant",
        replyText: `⚠️ Gagal menganalisis langkah: ${errText}. Pastikan server backend FastAPI berjalan di port 8000.`,
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-slate-800">
      
      {/* SIDEBAR (CHATGPT STYLE) */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-800/80 flex flex-col z-30 overflow-hidden flex-shrink-0`}
      >
        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-200 transition shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">＋</span>
              <span>Diagnosa Baru</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Ctrl+K</span>
          </button>
        </div>

        {/* Preset Sample Threads */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            Sampel Kertas Buram
          </div>

          {PRESET_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSend(sample.steps)}
              className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800/80 transition group flex items-start gap-2.5 text-xs border border-transparent hover:border-slate-800"
            >
              <span className="text-sm mt-0.5">{sample.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-300 group-hover:text-sky-300 truncate">
                  {sample.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono">
                  {sample.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 flex flex-col gap-2 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Variabel target:</span>
            <input
              type="text"
              value={targetVar}
              onChange={(e) => setTargetVar(e.target.value)}
              className="w-8 text-center text-xs font-mono bg-slate-950 border border-slate-800 rounded px-1 text-sky-400 focus:outline-none focus:border-sky-500"
              title="Target variable aljabar"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-[11px] text-slate-400 font-mono">
                {backendStatus === "online" ? "SymPy Engine Online" : "Backend Offline"}
              </span>
            </div>
            <button
              onClick={checkHealth}
              title="Cek ulang koneksi"
              className="text-slate-400 hover:text-slate-300 text-[11px]"
            >
              ↻
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT CANVAS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP BAR */}
        <header className="h-14 border-b border-slate-800/60 flex items-center justify-between px-4 bg-slate-950/80 backdrop-blur z-20 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
              title="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-sm text-slate-200 flex items-center gap-2">
              <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent font-bold">
                NalarAI
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 font-normal px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                Cognitive Debugger 2.2
              </span>
            </span>
          </div>

          {/* Model Picker with Cost and Effort Control (AI Chat 9) */}
          <div className="flex items-center gap-3">
            <ModelPickerWithEffort
              selectedModelId={selectedModel.id}
              onSelectModel={setSelectedModel}
              reasoningEffort={reasoningEffort}
              onChangeEffort={setReasoningEffort}
            />
            <div className="hidden lg:block text-[11px] text-slate-400 border-l border-slate-800 pl-3">
              Zero-Answer Policy
            </div>
          </div>
        </header>

        {/* CHAT MESSAGES STREAM */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-3xl mx-auto w-full space-y-6 pb-24">
            
            {/* EMPTY STATE (SEPERTI CHATGPT SAAT BARU BUKA) */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-sky-500/10 mb-4">
                  N
                </div>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-2">
                  Bagaimana jalan pikiran matematikamu?
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
                  Tuliskan langkah-langkah aljabarmu satu per satu di bawah. NalarAI akan melacak titik patah logika tanpa membocorkan kunci jawaban.
                </p>

                {/* 3 Quick Starter Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl text-left">
                  {PRESET_SAMPLES.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => handleSend(sample.steps)}
                      className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="text-base mb-1.5">{sample.icon}</div>
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300">
                          {sample.title}
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-2 truncate">
                        {sample.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGE LIST */}
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-4">
                
                {/* USER BUBBLE */}
                {msg.sender === "user" && (
                  <div className="flex justify-end">
                    <div className="max-w-2xl bg-slate-800 text-slate-100 rounded-2xl rounded-tr-sm px-4 py-3 shadow-md border border-slate-700/60 space-y-2">
                      <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center justify-between gap-4">
                        <span>Orat-Oretan Kertas Buram</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Display steps if available */}
                      {msg.steps && (
                        <div className="space-y-1.5 font-mono text-sm pt-1">
                          {msg.steps.map((st, i) => (
                            <div key={i} className="flex items-center gap-2.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                              <span className="text-slate-400 text-xs w-4">#{i + 1}</span>
                              <div className="text-slate-200">
                                <MathView math={st} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Plain text if follow up */}
                      {msg.rawText && (
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {msg.rawText}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ASSISTANT BUBBLE */}
                {msg.sender === "assistant" && (
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                      N
                    </div>

                    <div className="flex-1 space-y-4 max-w-2xl">
                      
                      {/* Conversational Text Reply */}
                      {msg.replyText && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-200 leading-relaxed shadow-sm">
                          {msg.replyText}
                        </div>
                      )}

                      {/* Full Cognitive Diagnostic Response */}
                      {msg.diagnosis && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-sm p-5 space-y-4 shadow-sm">
                          
                          {/* Top Status Header */}
                          {msg.diagnosis.diagnosis.has_fault ? (
                            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                              <span className="text-2xl mt-0.5">⚠️</span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-amber-300 text-sm">
                                    Titik Patah Kognitif: Baris ke-{msg.diagnosis.diagnosis.first_fault_line}
                                  </span>
                                  <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                    {msg.diagnosis.diagnosis.fault_type}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                  {msg.diagnosis.diagnosis.human_explanation}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                              <span className="text-2xl mt-0.5">✨</span>
                              <div>
                                <span className="font-bold text-emerald-300 text-sm">
                                  Seluruh Langkah Penurunan Aljabar Valid!
                                </span>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                  {msg.diagnosis.diagnosis.human_explanation}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Line-by-Line Verification Card */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Verifikasi Langkah Simbolik:
                            </span>
                            <div className="space-y-1">
                              {msg.diagnosis.transcription.lines.map((ln) => {
                                const isFault = ln.line_number === msg.diagnosis?.diagnosis.first_fault_line;
                                return (
                                  <div
                                    key={ln.line_number}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono border ${
                                      isFault
                                        ? "bg-amber-500/15 border-amber-500/50 text-amber-200"
                                        : ln.is_valid
                                        ? "bg-slate-950/70 border-slate-800 text-slate-200"
                                        : "bg-slate-950/40 border-slate-800/60 text-slate-400"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400">#{ln.line_number}</span>
                                      <MathView math={ln.raw_latex} />
                                    </div>
                                    <span className="text-[11px] font-sans font-medium">
                                      {isFault ? (
                                        <span className="text-amber-400 font-bold">⚠️ Titik Galat</span>
                                      ) : ln.is_valid ? (
                                        <span className="text-emerald-400">✓ Valid</span>
                                      ) : (
                                        <span className="text-slate-400">Mewarisi Galat</span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Socratic Question Card */}
                          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
                              <span>💬 Pertanyaan Sokrates:</span>
                              <span className="text-[10px] font-normal text-slate-400 font-mono">Zero-Answer Policy</span>
                            </div>
                            <blockquote className="text-xs text-slate-200 italic leading-relaxed pl-2.5 border-l-2 border-sky-400">
                              &ldquo;{msg.diagnosis.diagnosis.socratic_prompt}&rdquo;
                            </blockquote>
                          </div>

                          {/* Numerical Counter-Example */}
                          {msg.diagnosis.diagnosis.counter_example && (
                            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2.5">
                              <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                                <span>🧪 Bukti Kontra-Contoh Konkret:</span>
                                <span className="text-[10px] font-mono text-amber-400/80">Substitusi Nyata</span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                  <div className="text-[10px] text-slate-400">Nilai Uji</div>
                                  <div className="font-bold text-sky-400 font-mono">
                                    {msg.diagnosis.diagnosis.counter_example.test_variable} = {msg.diagnosis.diagnosis.counter_example.test_value}
                                  </div>
                                </div>
                                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                  <div className="text-[10px] text-slate-400">Rumus Awal</div>
                                  <div className="font-bold text-emerald-400 font-mono">
                                    {msg.diagnosis.diagnosis.counter_example.lhs_expected}
                                  </div>
                                </div>
                                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                  <div className="text-[10px] text-slate-400">Langkahmu</div>
                                  <div className="font-bold text-amber-400 font-mono">
                                    {msg.diagnosis.diagnosis.counter_example.rhs_calculated}
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-amber-200/90 leading-relaxed">
                                <strong>Kontradiksi:</strong> {msg.diagnosis.diagnosis.counter_example.contradiction_statement}
                              </p>
                            </div>
                          )}

                          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                            <span>Sesi: {msg.diagnosis.session_id}</span>
                            <span>Ketik refleksimu di bawah untuk melanjutkan ➔</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* LOADING STATE BUBBLE */}
            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold animate-pulse">
                  N
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  <span>Sedang memverifikasi simbolik aljabar dengan SymPy...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* BOTTOM INPUT BAR (CHATGPT FLOATING PROMPT BOX) */}
        <div className="border-t border-slate-800/80 bg-slate-950 p-4">
          <div className="max-w-3xl mx-auto w-full">
            <div className="relative bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl focus-within:border-sky-500/80 focus-within:ring-1 focus-within:ring-sky-500/50 transition-all p-2.5 flex flex-col gap-2">
              
              {/* Composer Model & Reasoning Control Info Bar (AI Chat 9) */}
              <div className="flex items-center justify-between px-1.5 pb-1 text-xs border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Engine:</span>
                  <span className="text-[11px] font-semibold text-sky-300 font-mono flex items-center gap-1.5">
                    <span>{selectedModel.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {selectedModel.costInput}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span>Effort:</span>
                  <span className="text-indigo-300 uppercase font-semibold px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {reasoningEffort}
                  </span>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={inputText.split("\n").length > 3 ? 4 : Math.max(1, inputText.split("\n").length)}
                  placeholder="Tuliskan langkah aljabar (gunakan Enter untuk baris baru)..."
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 px-2 py-1 focus:outline-none resize-none max-h-36 font-mono"
                />

                <button
                  onClick={() => handleSend()}
                  disabled={loading || !inputText.trim()}
                  title="Kirim (Enter)"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    inputText.trim() && !loading
                      ? "bg-slate-100 text-slate-900 hover:bg-white shadow-md active:scale-95"
                      : "bg-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-3">
              <span>Tekan <strong>Enter</strong> untuk mendiagnosa • <strong>Shift+Enter</strong> untuk baris baru</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
