"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  GeminiLogo,
  OpenAILogo,
  ClaudeLogo,
  DeepSeekLogo,
  NvidiaLogo,
  SymPyLogo,
  MistralLogo,
  OllamaLogo,
} from "@/components/CompanyLogos";
import { ZapLogo } from "@/components/ZapLogo";

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
  iconColor?: string;
}

export const AVAILABLE_MODELS: AIModel[] = [
  // 0. Auto-Agent (Router Cerdas Multi-Agent - Default 0 Setup)
  {
    id: "auto-agent",
    name: "Auto-Agent (Router Cerdas ZAP)",
    shortName: "Auto-Agent Cerdas",
    provider: "NVIDIA NIM / Cloud Auto",
    badge: "Default (0 Setup)",
    costInput: "Siap Pakai",
    contextWindow: "128k tokens",
    latency: "< 200ms",
    description: "Orkestrator pintar otomatis: mengarahkan ke Nemotron-3.5 Bolt (Sokrates kilat), Nemotron-3 Omni (Matematika), dan Nemotron-3.5 Super-VL (Geometri 3D).",
    icon: ZapLogo,
    iconColor: "text-amber-500 dark:text-amber-400",
  },

  // 1. NVIDIA NIM Specialized Agent Cluster (Verified Valid Key)
  {
    id: "nvidia-bolt",
    name: "Nemotron-3.5 Bolt (Tutor Sokrates)",
    shortName: "Nemotron Bolt",
    provider: "NVIDIA NIM Cloud",
    badge: "Chat Tutor <200ms",
    costInput: "NVIDIA Key Valid",
    contextWindow: "128k tokens",
    latency: "< 200ms",
    description: "Agent tutor percakapan Sokrates super cepat dengan respon instan dan empati pedagogis tinggi.",
    icon: NvidiaLogo,
    iconColor: "text-[#76B900]",
  },
  {
    id: "nvidia-math-reasoning",
    name: "Nemotron-3 Omni 30B (Penalaran Matematika)",
    shortName: "Nemotron Math 30B",
    provider: "NVIDIA NIM Cloud",
    badge: "CoT Math Reasoning",
    costInput: "NVIDIA Key Valid",
    contextWindow: "128k tokens",
    latency: "~450ms",
    description: "Agent spesialis penalaran matematis murni dengan Chain-of-Thought untuk pembuktian dan kontra-contoh.",
    icon: NvidiaLogo,
    iconColor: "text-[#76B900]",
  },
  {
    id: "nvidia-spatial-vl",
    name: "Nemotron-3.5 Super-VL 120B (Geometri 3D & Spasial)",
    shortName: "Nemotron 3D 120B",
    provider: "NVIDIA NIM Cloud",
    badge: "3D/2D Spatial 120B",
    costInput: "NVIDIA Key Valid",
    contextWindow: "128k tokens",
    latency: "~600ms",
    description: "Agent spesialis pemodelan geometri 3D, koordinat spasial, grafik kartesius, dan penampang bidang irisan.",
    icon: NvidiaLogo,
    iconColor: "text-[#76B900]",
  },
  {
    id: "nvidia-ultra-550b",
    name: "Nemotron-3 Ultra 550B (Olimpiade & Bukti Mendalam)",
    shortName: "Nemotron Ultra 550B",
    provider: "NVIDIA NIM Cloud",
    badge: "Frontier 550B MoE",
    costInput: "NVIDIA Key Valid",
    contextWindow: "128k tokens",
    latency: "~900ms",
    description: "Model frontier raksasa 550B untuk analisis aljabar tingkat lanjut, pembuktian teorema, dan soal olimpiade.",
    icon: NvidiaLogo,
    iconColor: "text-[#76B900]",
  },
  {
    id: "poolside-laguna",
    name: "Poolside Laguna XS (Sintesis Kode Three.js & Kanvas)",
    shortName: "Poolside Code",
    provider: "NVIDIA NIM Cloud",
    badge: "Code Synthesizer",
    costInput: "NVIDIA Key Valid",
    contextWindow: "64k tokens",
    latency: "< 250ms",
    description: "Agent sintesis kode cepat untuk scripting Three.js, visualisasi grafik SVG, dan matematika komputasi.",
    icon: NvidiaLogo,
    iconColor: "text-[#76B900]",
  },
  {
    id: "deepseek-v4.1-flash",
    name: "DeepSeek-V4.1-Flash (NVIDIA NIM)",
    shortName: "DeepSeek V4.1",
    provider: "DeepSeek / NVIDIA",
    badge: "552B MoE",
    costInput: "NVIDIA Key Valid",
    contextWindow: "128k tokens",
    latency: "~350ms",
    description: "Model MoE penalaran analitis mendalam dari DeepSeek yang diakselerasi di cloud NVIDIA NIM.",
    icon: DeepSeekLogo,
    iconColor: "text-[#1E88E5] dark:text-[#42A5F5]",
  },

  // 1. Google Gemini (Default Auto Cloud)
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    shortName: "Gemini 2.0",
    provider: "Google DeepMind",
    badge: "Default Auto-Sync",
    costInput: "Gratis (Backend Pool)",
    contextWindow: "1M tokens",
    latency: "< 350ms",
    description: "Model default ZAP yang otomatis aktif saat login Google tanpa perlu konfigurasi API key manual.",
    icon: GeminiLogo,
    iconColor: "text-[#4E8BF5]",
  },

  // 2. OpenAI ChatGPT
  {
    id: "gpt-4o",
    name: "GPT-4o Omni",
    shortName: "GPT-4o",
    provider: "OpenAI",
    badge: "Flagship",
    costInput: "OpenAI Key / Akun",
    contextWindow: "128k tokens",
    latency: "~400ms",
    description: "Model multimodal cerdas OpenAI untuk pemahaman teks dan asistensi Sokrates bertahap.",
    icon: OpenAILogo,
    iconColor: "text-[#10A37F]",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    shortName: "GPT-4o Mini",
    provider: "OpenAI",
    badge: "Ultra Ringan",
    costInput: "OpenAI Key / Akun",
    contextWindow: "128k tokens",
    latency: "~200ms",
    description: "Model respons cepat dan hemat biaya dari OpenAI untuk tutoring kilat.",
    icon: OpenAILogo,
    iconColor: "text-[#10A37F]",
  },

  // 3. Anthropic Claude
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    shortName: "Claude 3.5",
    provider: "Anthropic",
    badge: "Advanced Logic",
    costInput: "Claude Key",
    contextWindow: "200k tokens",
    latency: "~600ms",
    description: "Model reasoning dengan kekakuan logika dan kemampuan pemecahan soal terstruktur.",
    icon: ClaudeLogo,
    iconColor: "text-[#D97757]",
  },

  // 4. Mistral Codestral
  {
    id: "codestral-latest",
    name: "Codestral 22B",
    shortName: "Codestral 22B",
    provider: "Mistral AI",
    badge: "Fast Code/Math",
    costInput: "Mistral Key",
    contextWindow: "32k tokens",
    latency: "~220ms",
    description: "Model matematika dan komputasi cepat dari Mistral AI.",
    icon: MistralLogo,
    iconColor: "text-[#FF7000]",
  },

  // 5. SymPy Deterministic Engine (Offline 0ms)
  {
    id: "sympy-cfl",
    name: "SymPy CAS (Deterministic)",
    shortName: "SymPy CAS",
    provider: "ZAP Local Kernel",
    badge: "0ms Offline",
    costInput: "Offline Murni",
    contextWindow: "Infinity",
    latency: "0ms",
    description: "Mesin aljabar simbolik murni 100% deterministik tanpa inferensi LLM generatif.",
    icon: SymPyLogo,
    iconColor: "text-[#3B9C3F]",
  },

  // 6. Custom API Endpoint
  {
    id: "custom-api",
    name: "Custom Model (BYO-Endpoint)",
    shortName: "Custom Model",
    provider: "Self-Hosted / Proxy",
    badge: "Ollama/vLLM",
    costInput: "Local / Kustom",
    contextWindow: "Kustom",
    latency: "Kustom",
    description: "Hubungkan model lokal milikmu sendiri via Ollama, LM Studio, vLLM, atau OpenAI-compatible proxy.",
    icon: OllamaLogo,
    iconColor: "text-purple-400",
  },
];

interface ModelPickerProps {
  selectedModelId: string;
  onSelectModel: (model: AIModel) => void;
  reasoningEffort: ReasoningEffort;
  onChangeEffort: (effort: ReasoningEffort) => void;
  variant?: "default" | "pill" | "chatzap";
  dropUp?: boolean;
}

export default function ModelPickerWithEffort({
  selectedModelId,
  onSelectModel,
  reasoningEffort,
  onChangeEffort,
  dropUp = true,
}: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<"model" | "effort" | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  const handleSelectModel = (model: AIModel) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zap_selected_model_id", model.id);
    }
    onSelectModel(model);
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  const handleSelectEffort = (effort: ReasoningEffort) => {
    onChangeEffort(effort);
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatEffort = (eff: ReasoningEffort) => {
    if (eff === "high") return "High";
    if (eff === "medium") return "Medium";
    return "Low";
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button (Clean Harness Aesthetic) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => {
            const next = !prev;
            if (!next) setActiveSubmenu(null);
            return next;
          });
        }}
        title={`Model: ${currentModel.name} • Effort: ${formatEffort(reasoningEffort)}`}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer select-none"
      >
        <span className="font-medium text-xs text-slate-800 dark:text-zinc-200">
          {currentModel.id.includes("deepseek") ? "DeepSeek-V4.1-Flash" : currentModel.shortName}
        </span>
        <span className="text-slate-500 dark:text-zinc-400 text-xs">
          {formatEffort(reasoningEffort)}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-slate-900 dark:text-white" : ""
          }`}
        />
      </button>

      {/* Minimal Context Menu (Liquid Glass Drop Blur) */}
      {isOpen && (
        <div
          className={`absolute right-0 z-50 select-none animate-liquid-pop origin-bottom-right ${
            dropUp ? "bottom-full mb-2.5" : "top-full mt-2.5"
          }`}
        >
          {/* Main 2-Row Context Menu Card */}
          <div className="w-68 sm:w-72 liquid-glass-popup rounded-2xl p-1.5 relative text-slate-800 dark:text-zinc-200">
            {/* Row 1: Model */}
            <button
              type="button"
              onClick={() => setActiveSubmenu(activeSubmenu === "model" ? null : "model")}
              onMouseEnter={() => setActiveSubmenu("model")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition cursor-pointer ${
                activeSubmenu === "model"
                  ? "bg-slate-900/[0.08] dark:bg-white/[0.12] text-slate-950 dark:text-white font-medium"
                  : "text-slate-700 dark:text-zinc-300 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <span className="font-medium text-slate-800 dark:text-zinc-200">Model</span>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                <span className="truncate max-w-[140px] font-normal text-right">
                  {currentModel.id.includes("deepseek") ? "DeepSeek-V4.1-Flash" : currentModel.shortName}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
              </div>
            </button>

            {/* Row 2: Effort */}
            <button
              type="button"
              onClick={() => setActiveSubmenu(activeSubmenu === "effort" ? null : "effort")}
              onMouseEnter={() => setActiveSubmenu("effort")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition cursor-pointer ${
                activeSubmenu === "effort"
                  ? "bg-slate-900/[0.08] dark:bg-white/[0.12] text-slate-950 dark:text-white font-medium"
                  : "text-slate-700 dark:text-zinc-300 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <span className="font-medium text-slate-800 dark:text-zinc-200">Effort</span>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                <span className="font-normal text-right">
                  {formatEffort(reasoningEffort)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
              </div>
            </button>

            {/* Submenu 1: Model Selector (Flyout to left on sm:, in-place on xs:) */}
            {activeSubmenu === "model" && (
              <div
                className="fixed inset-x-3 bottom-24 sm:absolute sm:inset-auto sm:right-full sm:mr-2 sm:bottom-0 sm:w-80 liquid-glass-popup rounded-2xl p-1.5 z-50 animate-liquid-pop origin-bottom-right"
                onMouseEnter={() => setActiveSubmenu("model")}
              >
                <div className="px-3 py-2 text-[11px] font-mono text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] mb-1 font-bold">
                  <span>PILIH MODEL</span>
                  <button
                    type="button"
                    onClick={() => setActiveSubmenu(null)}
                    className="sm:hidden text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-0.5 max-h-80 overflow-y-auto px-0.5">
                  {AVAILABLE_MODELS.map((model) => {
                    const isSelected = model.id === currentModel.id;
                    const Icon = model.icon;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => handleSelectModel(model)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition cursor-pointer text-left ${
                          isSelected
                            ? "bg-slate-900/[0.08] dark:bg-white/[0.12] text-slate-950 dark:text-white font-semibold"
                            : "text-slate-800 dark:text-zinc-200 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${model.iconColor || "text-slate-500"}`} />
                          <span className="truncate">{model.name}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white flex-shrink-0 ml-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="my-1 border-t border-slate-200/60 dark:border-white/[0.08]" />
                <Link
                  href="/connector"
                  onClick={() => {
                    setIsOpen(false);
                    setActiveSubmenu(null);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] transition"
                >
                  <span>Kelola API Key &amp; Hub...</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                </Link>
              </div>
            )}

            {/* Submenu 2: Reasoning Effort Selector */}
            {activeSubmenu === "effort" && (
              <div
                className="fixed inset-x-3 bottom-24 sm:absolute sm:inset-auto sm:right-full sm:mr-2 sm:bottom-0 sm:w-44 liquid-glass-popup rounded-2xl p-1.5 z-50 animate-liquid-pop origin-bottom-right"
                onMouseEnter={() => setActiveSubmenu("effort")}
              >
                <div className="px-3 py-2 text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.08] mb-1 font-semibold">
                  <span>Effort</span>
                  <button
                    type="button"
                    onClick={() => setActiveSubmenu(null)}
                    className="sm:hidden text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-0.5">
                  {(["low", "medium", "high"] as ReasoningEffort[]).map((opt) => {
                    const isSelected = opt === reasoningEffort;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectEffort(opt)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition cursor-pointer text-left ${
                          isSelected
                            ? "bg-slate-100 dark:bg-white/[0.1] text-slate-900 dark:text-white font-medium"
                            : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100/70 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <span>{formatEffort(opt)}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
