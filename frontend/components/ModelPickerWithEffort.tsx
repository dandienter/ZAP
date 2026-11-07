"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Cpu,
  Layers,
  ShieldCheck,
  ChevronDown,
  Gauge,
  Coins,
  Zap,
  SlidersHorizontal,
  Check,
  Key,
} from "lucide-react";

export type ReasoningEffort = "low" | "medium" | "high";

export interface AIModel {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  badge?: string;
  costInput: string;
  contextWindow: string;
  latency: string;
  description: string;
  icon: React.ElementType;
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash (Frontier)",
    shortName: "Gemini 3.8",
    provider: "Google DeepMind (Generasi 3.8)",
    badge: "Paling Pintar & Kencang",
    costInput: "Ultra Fast",
    contextWindow: "1M tokens",
    latency: "< 250ms",
    description: "Model generasi 3.8 terbaru Google: penalaran cerdas tingkat tinggi, respons ultra-cepat, dan memori percakapan penuh.",
    icon: Zap,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash (Turbo)",
    shortName: "Gemini 2.0",
    provider: "Google DeepMind (Fast Production)",
    badge: "Stabil & Cepat",
    costInput: "Turbo",
    contextWindow: "1M tokens",
    latency: "< 350ms",
    description: "Model generasi 2.0 Google yang sangat kencang dan responsif untuk penalaran aljabar interaktif.",
    icon: Layers,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro (Deep Math)",
    shortName: "Gemini 1.5 Pro",
    provider: "Google DeepMind (Penalaran Mendalam)",
    badge: "Analitis Tinggi",
    costInput: "Standard",
    contextWindow: "2M tokens",
    latency: "~1.5s",
    description: "Model dengan penalaran matematika paling mendalam untuk pembuktian konsep aljabar dan sains tingkat lanjut.",
    icon: Layers,
  },
  {
    id: "sympy-cfl",
    name: "SymPy CFL Engine (Offline)",
    shortName: "SymPy 0ms",
    provider: "Deterministic Symbolic Kernel",
    badge: "Instant 0ms",
    costInput: "$0.00 (Offline)",
    contextWindow: "Unlimited Depth",
    latency: "< 2ms",
    description: "Evaluasi simbolik murni deterministik lokal tanpa cloud. 100% anti-halusinasi dan tanpa kuota API.",
    icon: Cpu,
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
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [keySavedToast, setKeySavedToast] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored =
        localStorage.getItem("logicomath_gemini_api_key") ||
        localStorage.getItem("nalar_gemini_api_key") ||
        "";
      setSavedKey(stored);
      setApiKeyInput(stored);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== "undefined") {
      const trimmed = apiKeyInput.trim();
      localStorage.setItem("logicomath_gemini_api_key", trimmed);
      localStorage.setItem("nalar_gemini_api_key", trimmed);
      setSavedKey(trimmed);
      setKeySavedToast(true);
      setTimeout(() => setKeySavedToast(false), 2000);
    }
  };

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const CurrentIcon = currentModel.icon;

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
      {/* Trigger Button - Polos, Flat, Mobile Safe */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 transition focus:outline-none"
      >
        <CurrentIcon className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" />
        <span className="font-medium hidden sm:inline">{currentModel.name}</span>
        <span className="font-medium sm:hidden">{currentModel.shortName}</span>

        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 hidden xs:inline-block">
          {reasoningEffort}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Popover - Fixed on mobile, Absolute on sm+ */}
      {isOpen && (
        <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl p-3 z-50 text-zinc-200 max-h-[85vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] font-medium text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-300" />
              <span>Model Reasoning</span>
            </span>
            <span className="font-mono text-[10px] text-zinc-400">LogicoMath 2.2</span>
          </div>

          {/* Model Options List */}
          <div className="space-y-1 mb-3">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === currentModel.id;
              const Icon = model.icon;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg border transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-zinc-800 border-zinc-700 text-white"
                      : "bg-zinc-950/40 border-transparent hover:bg-zinc-800/60 hover:border-zinc-800 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{model.name}</span>
                        {model.badge && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 block truncate">{model.provider}</span>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-zinc-200 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Metrics Row (Polos, Clean, No Gradients) */}
          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5 mb-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Coins className="w-3 h-3 text-zinc-400" />
                <span>Biaya:</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-200 font-medium">
                {currentModel.costInput}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-zinc-400" />
                <span>Latensi:</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-300">
                {currentModel.latency}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-zinc-400" />
                <span>Kapasitas:</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-300">
                {currentModel.contextWindow}
              </span>
            </div>
          </div>

          {/* Reasoning Effort Control */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
                <span>Reasoning Effort:</span>
              </span>
              <span className="text-[10px] font-mono uppercase text-zinc-300">
                {reasoningEffort}
              </span>
            </div>

            {/* 3-Way Flat Toggle */}
            <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
              {(["low", "medium", "high"] as ReasoningEffort[]).map((level) => {
                const isActive = reasoningEffort === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChangeEffort(level)}
                    className={`py-1 text-[11px] font-medium rounded capitalize transition ${
                      isActive
                        ? "bg-zinc-200 text-zinc-900 font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                  >
                    {level === "low" ? "Low" : level === "medium" ? "Med" : "High"}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-zinc-400 mt-2 leading-normal">
              {reasoningEffort === "low" && "Verifikasi cepat ekuivalensi baris dasar."}
              {reasoningEffort === "medium" && "Isolasi breakpoint & petunjuk Sokrates berimbang."}
              {reasoningEffort === "high" && "Pencarian kontra-contoh mendalam & pelacakan ROOT_LOSS."}
            </p>
          </div>

          {/* Gemini API Key Config (Opsional) */}
          <div className="pt-2.5 mt-2.5 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                <Key className="w-3 h-3 text-zinc-400" />
                <span>Google Gemini API Key:</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {savedKey ? (
                  <span className="text-emerald-400">Aktif</span>
                ) : (
                  <span className="text-zinc-500">Lokal Sokratik</span>
                )}
              </span>
            </div>

            <div className="flex gap-1.5">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... (Opsional)"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-2.5 py-1 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition"
              >
                {keySavedToast ? "Tersimpan" : "Simpan"}
              </button>
            </div>
            <p className="text-[9px] text-zinc-500 mt-1">
              Kosongkan untuk menggunakan mesin Sokratik bawaan tanpa kuota.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
