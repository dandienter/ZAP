"use client";

import React, { useState, useEffect } from "react";
import MathView from "@/components/MathView";

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

interface PresetSample {
  id: string;
  title: string;
  badge: string;
  desc: string;
  targetVar: string;
  steps: string[];
}

const PRESET_SAMPLES: PresetSample[] = [
  {
    id: "sample-1",
    title: "1. Miskonsepsi Kuadrat",
    badge: "Distributive Expansion",
    desc: "Siswa lupa suku tengah 2ab saat ekspansi (x+3)^2",
    targetVar: "x",
    steps: ["(x + 3)^2 - 4", "x^2 + 9 - 4", "x^2 + 5"],
  },
  {
    id: "sample-2",
    title: "2. Kehilangan Akar",
    badge: "Root Loss",
    desc: "Siswa menarik akar x^2 = 4 tanpa mempertimbangkan akar negatif",
    targetVar: "x",
    steps: ["x^2 = 4", "x = 2"],
  },
  {
    id: "sample-3",
    title: "3. Penurunan Valid",
    badge: "All Steps Valid",
    desc: "Siswa menyelesaikan 2x + 3 = 7 secara runtut dan presisi",
    targetVar: "x",
    steps: ["2*x + 3 = 7", "2*x = 4", "x = 2"],
  },
];

export default function NalarAIDemoPage() {
  const [steps, setSteps] = useState<string[]>(PRESET_SAMPLES[0].steps);
  const [targetVar, setTargetVar] = useState<string>("x");
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_SAMPLES[0].id);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [response, setResponse] = useState<DiagnoseResponse | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  const [reflectionText, setReflectionText] = useState<string>("");
  const [reflectionSubmitted, setReflectionSubmitted] = useState<boolean>(false);

  // Ping backend /health saat pertama dimuat
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/health", { method: "GET" });
      if (res.ok) {
        setBackendStatus("online");
      } else {
        setBackendStatus("offline");
      }
    } catch {
      setBackendStatus("offline");
    }
  };

  const handleSelectPreset = (preset: PresetSample) => {
    setSelectedPreset(preset.id);
    setSteps([...preset.steps]);
    setTargetVar(preset.targetVar);
    setResponse(null);
    setErrorMsg(null);
    setReflectionSubmitted(false);
    setReflectionText("");
  };

  const handleStepChange = (index: number, val: string) => {
    const updated = [...steps];
    updated[index] = val;
    setSteps(updated);
    setSelectedPreset("");
    setResponse(null);
  };

  const handleAddStep = () => {
    setSteps([...steps, ""]);
    setSelectedPreset("");
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
    setSelectedPreset("");
    setResponse(null);
  };

  const handleDiagnose = async () => {
    const cleanedSteps = steps.map((s) => s.trim()).filter((s) => s.length > 0);
    if (cleanedSteps.length === 0) {
      setErrorMsg("Mohon masukkan minimal satu baris langkah aljabar.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setReflectionSubmitted(false);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed_steps: cleanedSteps,
          target_variable: targetVar.trim() || "x",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Server mengembalikan status ${res.status}`);
      }

      const data: DiagnoseResponse = await res.json();
      setResponse(data);
      setBackendStatus("online");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan koneksi";
      setErrorMsg(`Gagal mendiagnosa: ${msg}. Pastikan backend berjalan di port 8000.`);
    } finally {
      setLoading(false);
    }
  };

  const firstFaultLine = response?.diagnosis.first_fault_line;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* TOP NAVBAR */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  NalarAI
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Logicodix 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Cognitive Debugger for Student Scratchpads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Status Badge */}
            <button
              onClick={checkHealth}
              title="Klik untuk ping ulang server backend"
              className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md border border-slate-800 bg-slate-900 hover:border-slate-700 transition"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : backendStatus === "checking"
                    ? "bg-amber-400"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-slate-300 font-mono text-[11px]">
                {backendStatus === "online"
                  ? "Backend: Online (8000)"
                  : backendStatus === "checking"
                  ? "Cek Koneksi..."
                  : "Backend: Offline"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* SUB-HEADER: PRESET SAMPLES BAR */}
      <section className="border-b border-slate-800/60 bg-slate-900/30 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="text-sky-400 font-semibold">⚡ Sampel Kertas Buram:</span>
            <span>Pilih salah satu kasus teruji untuk demo instan:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESET_SAMPLES.map((sample) => {
              const active = selectedPreset === sample.id;
              return (
                <button
                  key={sample.id}
                  onClick={() => handleSelectPreset(sample)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-2 ${
                    active
                      ? "bg-sky-500/20 border-sky-400/80 text-sky-200 shadow-sm shadow-sky-500/20"
                      : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80"
                  }`}
                >
                  <span className="font-medium">{sample.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      active
                        ? "bg-sky-400/20 text-sky-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {sample.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* MAIN DUAL-PANE WORKSPACE */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL KIRI: SCRATCHPAD INSPECTOR (CORETAN SISWA) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <h2 className="font-semibold text-slate-200 text-sm tracking-wide">
                  Scratchpad Inspector (Orat-Oretan Siswa)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Variabel:</label>
                <input
                  type="text"
                  value={targetVar}
                  onChange={(e) => setTargetVar(e.target.value)}
                  maxLength={4}
                  className="w-10 text-center text-xs font-mono bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-sky-400 focus:outline-none focus:border-sky-500"
                  title="Target variable aljabar (default: x)"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-3">
              Ketikkan baris langkah aljabar siswa (atau gunakan sampel di atas). KaTeX akan merender ekspresi secara presisi:
            </p>

            {/* Step Lines List */}
            <div className="flex-1 flex flex-col gap-3 min-h-[220px]">
              {steps.map((step, idx) => {
                const lineNum = idx + 1;
                const isFaultLine = firstFaultLine === lineNum;
                const lineInfo = response?.transcription?.lines?.find(
                  (l) => l.line_number === lineNum
                );

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isFaultLine
                        ? "bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40"
                        : lineInfo && lineInfo.is_valid
                        ? "bg-slate-950/80 border-emerald-500/40"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono px-2 py-0.5 rounded-full font-bold ${
                            isFaultLine
                              ? "bg-amber-500 text-slate-950"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          Baris {lineNum}
                        </span>

                        {isFaultLine && (
                          <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                            <span>⚠️ Titik Patah Kognitif</span>
                          </span>
                        )}

                        {lineInfo && lineInfo.is_valid && (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <span>✓ Langkah Valid</span>
                          </span>
                        )}
                      </div>

                      {steps.length > 1 && (
                        <button
                          onClick={() => handleRemoveStep(idx)}
                          title="Hapus baris ini"
                          className="text-slate-500 hover:text-rose-400 text-xs px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(idx, e.target.value)}
                      placeholder={`Contoh: (x + 3)^2 - 4`}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                    />

                    {/* KaTeX Live Math Preview */}
                    {step.trim() && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono text-slate-500">Render:</span>
                        <div className="text-slate-200 text-sm overflow-x-auto py-0.5">
                          <MathView math={step} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Line Button */}
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800/80">
              <button
                onClick={handleAddStep}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition flex items-center gap-1"
              >
                <span>+</span>
                <span>Tambah Baris Langkah</span>
              </button>

              <button
                onClick={() => {
                  setSteps([""]);
                  setSelectedPreset("");
                  setResponse(null);
                  setErrorMsg(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition"
              >
                Kosongkan
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* CTA DIAGNOSE BUTTON */}
            <button
              onClick={handleDiagnose}
              disabled={loading}
              className={`mt-4 w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                loading
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 text-white shadow-sky-500/20 active:scale-[0.99]"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Menganalisis Simbolik dengan SymPy...</span>
                </>
              ) : (
                <>
                  <span>Diagnosa Logika Aljabar</span>
                  <span className="text-sky-200">➔</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500 mt-2">
              🛡️ Kebijakan Nol Jawaban (Zero-Answer Policy): Kunci jawaban tidak pernah dibocorkan.
            </p>
          </div>
        </section>

        {/* PANEL KANAN: THE SOCRATIC CONSOLE (KONSOL REFLEKSI KOGNITIF) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                <h2 className="font-semibold text-slate-200 text-sm tracking-wide">
                  The Socratic Console (Cognitive Diff)
                </h2>
              </div>

              {response && (
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {response.session_id}
                </span>
              )}
            </div>

            {/* STATE 1: SEBELUM DIAGNOSA */}
            {!response && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-3xl mb-4 shadow-inner">
                  🔍
                </div>
                <h3 className="font-semibold text-slate-200 text-base mb-1">
                  Menunggu Diagnosa Aljabar
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6">
                  Pilih salah satu sampel di bagian atas atau tuliskan langkah hitungan siswa di panel kiri, lalu klik{" "}
                  <strong className="text-slate-200 font-semibold">&ldquo;Diagnosa Logika Aljabar&rdquo;</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md text-left">
                  <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/40">
                    <span className="text-sky-400 font-mono text-xs block font-bold mb-1">01. Parsing</span>
                    <span className="text-[11px] text-slate-400">Whitelist karakter aljabar aman & anti-DoS</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/40">
                    <span className="text-indigo-400 font-mono text-xs block font-bold mb-1">02. SymPy CFL</span>
                    <span className="text-[11px] text-slate-400">Isolasi breakpoint kesalahan deterministik</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/40">
                    <span className="text-amber-400 font-mono text-xs block font-bold mb-1">03. Sokrates</span>
                    <span className="text-[11px] text-slate-400">Kontra-contoh konkret tanpa bocoran jawaban</span>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 2: LOADING */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin mb-4" />
                <h3 className="font-semibold text-slate-200 text-sm mb-1">
                  Membedah Logika Matematika...
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Menjalankan solveset & simplify pada kernel SymPy
                </p>
              </div>
            )}

            {/* STATE 3: SETELAH DIAGNOSA SELESAI */}
            {response && !loading && (
              <div className="flex-1 flex flex-col gap-4 mt-2">
                
                {/* STATUS BANNER */}
                {response.diagnosis.has_fault ? (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="text-2xl mt-0.5">⚠️</span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-amber-300 text-sm">
                              Miskonsepsi Terdeteksi di Baris ke-{firstFaultLine}
                            </span>
                            <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                              {response.diagnosis.fault_type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {response.diagnosis.human_explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/40">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">✨</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-300 text-sm">
                            Seluruh Langkah Penurunan Aljabar Valid!
                          </span>
                          <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                            ALL_STEPS_VALID
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {response.diagnosis.human_explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* LEVEL 1: KARTU PERTANYAAN SOKRATES */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-sky-400">
                        💬 Petunjuk Sokrates (Level 1):
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Reflective Prompt
                    </span>
                  </div>
                  <blockquote className="border-l-2 border-sky-500/70 pl-3 py-1 text-xs text-slate-200 leading-relaxed italic bg-sky-500/5 rounded-r">
                    &ldquo;{response.diagnosis.socratic_prompt}&rdquo;
                  </blockquote>
                </div>

                {/* LEVEL 2: UJI ANGKA NYATA (KONTRA-CONTOH KONKRET) */}
                {response.diagnosis.counter_example && (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🧪</span>
                        <span className="text-xs font-semibold text-amber-300">
                          Uji Angka Nyata (Level 2 — Counter-Example):
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded">
                        Substitusi Bukti
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                          Nilai Variabel
                        </span>
                        <span className="text-sm font-bold text-sky-400 font-mono">
                          {response.diagnosis.counter_example.test_variable} = {response.diagnosis.counter_example.test_value}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                          Rumus Asal (Seharusnya)
                        </span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {response.diagnosis.counter_example.lhs_expected}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                          Hitungan Langkahmu
                        </span>
                        <span className="text-sm font-bold text-amber-400 font-mono">
                          {response.diagnosis.counter_example.rhs_calculated}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                      <strong>Kontradiksi:</strong>{" "}
                      {response.diagnosis.counter_example.contradiction_statement}
                    </div>
                  </div>
                )}

                {/* LEVEL 3: RUANG REFLEKSI SISWA */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <span>✍️</span>
                      <span>Ruang Refleksi Siswa (Level 3):</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Latih Metakognisi
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Berdasarkan petunjuk di atas, tuliskan menurut analisismu mengapa langkah pada baris tersebut berbeda:
                  </p>

                  <textarea
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    rows={2}
                    placeholder="Contoh: 'Ternyata saya lupa menjumlahkan 2*x*3 saat mengalikan suku di dalam kurung...'"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (reflectionText.trim()) {
                          setReflectionSubmitted(true);
                        }
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
                    >
                      Kirim Analisis Refleksi
                    </button>

                    {reflectionSubmitted && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <span>✓</span>
                        <span>Analisis kognitif tercatat! Bagus, kamu berhasil menemukan letak kekeliruanmu sendiri.</span>
                      </span>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 py-4 bg-slate-950 text-center text-xs text-slate-500">
        <p>
          NalarAI — LOGICODIX 2026 Hackathon (Subtema: Smart & Fun Education) • Powered by SymPy Symbolic Mathematics
        </p>
      </footer>
    </div>
  );
}
