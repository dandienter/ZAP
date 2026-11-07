"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Cpu,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Gauge,
  Coins,
  Layers,
  Zap,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export type ReasoningEffort = "low" | "medium" | "high";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  badge?: string;
  badgeColor?: string;
  costInput: string;
  costOutput: string;
  contextWindow: string;
  latency: string;
  description: string;
  icon: React.ElementType;
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "sympy-cfl",
    name: "SymPy CFL Engine",
    provider: "Deterministic Symbolic Kernel",
    badge: "Official Hackathon Spec",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    costInput: "$0.00 / 1K steps",
    costOutput: "$0.00 (Local CPU)",
    contextWindow: "Unlimited Algebraic Depth",
    latency: "< 2ms (Sub-millisecond)",
    description: "Evaluasi simbolik murni deterministik. 100% anti-halusinasi dengan isolasi breakpoint kesalahan & pembuktian kontra-contoh.",
    icon: Cpu,
  },
  {
    id: "gemini-hybrid",
    name: "Gemini 2.0 Flash + CFL",
    provider: "Google Multimodal + SymPy",
    badge: "Vision Hybrid",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    costInput: "$0.0001 / 1K tokens",
    costOutput: "$0.0004 / 1K tokens",
    contextWindow: "1,048,576 tokens",
    latency: "~1.2s",
    description: "Multimodal transcription untuk membaca foto kertas buram tulisan tangan siswa sebelum diverifikasi oleh kernel SymPy.",
    icon: Sparkles,
  },
  {
    id: "qwen-local",
    name: "Qwen2-VL 7B Local",
    provider: "On-Premise / Ollama NPU",
    badge: "Zero-Data Leak (UU PDP)",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    costInput: "$0.00 (Self-Hosted)",
    costOutput: "$0.00 (Offline)",
    contextWindow: "32,768 tokens",
    latency: "~2.4s",
    description: "Model vision-language lokal offline untuk perlindungan privasi data siswa maksimal tanpa internet.",
    icon: ShieldCheck,
  },
];

interface ModelPickerProps {
  selectedModelId: string;
  onSelectModel: (model: AIModel) => void;
  reasoningEffort: ReasoningEffort;
  onChangeEffort: (effort: ReasoningEffort) => void;
}

export default function ModelPickerWithEffort({
  selectedModelId,
  onSelectModel,
  reasoningEffort,
  onChangeEffort,
}: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button (persis tombol Model Picker AI Chat 9) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 text-xs text-slate-200 transition shadow-sm group focus:outline-none"
      >
        <currentModel.icon className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
        <span className="font-semibold tracking-tight">{currentModel.name}</span>

        {/* Effort pill badge */}
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Effort: {reasoningEffort.toUpperCase()}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Detail Card / Popover */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          
          {/* Section 1: Provider & Model Selector */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-sky-400" />
                <span>Pilih Model Reasoning:</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="space-y-1.5">
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = model.id === currentModel.id;
                const ModelIcon = model.icon;
                return (
                  <button
                    key={model.id}
                    onClick={() => onSelectModel(model)}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? "bg-sky-500/10 border-sky-500/60 text-slate-100 shadow-sm"
                        : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg ${isSelected ? "bg-sky-500/20 text-sky-300" : "bg-slate-800 text-slate-400"}`}>
                        <ModelIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate">{model.name}</span>
                          {model.badge && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${model.badgeColor}`}>
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{model.provider}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Model Metrics & Cost Details (AI Chat 9 Block) */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-3 space-y-2">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800/60">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Biaya Komputasi:</span>
              </span>
              <span className="font-mono text-emerald-400 text-[11px] font-semibold">
                {currentModel.costInput}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800/60">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>Latensi Inferensi:</span>
              </span>
              <span className="font-mono text-slate-300 text-[11px]">
                {currentModel.latency}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-purple-400" />
                <span>Kapasitas Kedalaman:</span>
              </span>
              <span className="font-mono text-slate-300 text-[11px] truncate max-w-[150px]">
                {currentModel.contextWindow}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 pt-1 leading-relaxed italic">
              {currentModel.description}
            </p>
          </div>

          {/* Section 3: Reasoning Effort Control (AI Chat 9 Effort Slider / Control) */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-indigo-400" />
                <span>Reasoning Effort Control:</span>
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  reasoningEffort === "high"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : reasoningEffort === "medium"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {reasoningEffort}
              </span>
            </div>

            {/* 3-Way Segmented Control */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
              {(["low", "medium", "high"] as ReasoningEffort[]).map((level) => {
                const isActive = reasoningEffort === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChangeEffort(level)}
                    className={`py-1.5 text-[11px] font-medium rounded-lg capitalize transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    {level === "low" ? "Low (Cepat)" : level === "medium" ? "Medium" : "High (Dalam)"}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              {reasoningEffort === "low" && "⚡ Evaluasi sintaks cepat & verifikasi ekuivalensi baris dasar."}
              {reasoningEffort === "medium" && "⚖️ Isolasi titik patah aljabar, deteksi miskonsepsi umum, dan petunjuk Sokrates berimbang."}
              {reasoningEffort === "high" && "🧠 Pencarian kontra-contoh mendalam, verifikasi domain menyeluruh, dan pelacakan akar hilang (ROOT_LOSS)."}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
