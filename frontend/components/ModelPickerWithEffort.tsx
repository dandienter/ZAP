"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ChevronDown,
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

  // 2. Google Gemini (Default Auto Cloud)
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

  // 3. OpenAI ChatGPT
  {
    id: "gpt-4o",
    name: "GPT-4o Omni",
    shortName: "GPT-4o",
    provider: "OpenAI",
    badge: "Flagship",
    costInput: "OpenAI Key / Akun",
    contextWindow: "128k tokens",
    latency: "~400ms",
    description: "Model multimodal tercanggih OpenAI untuk penalaran logika analitis.",
    icon: OpenAILogo,
    iconColor: "text-[#10A37F]",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    shortName: "GPT-4o Mini",
    provider: "OpenAI",
    badge: "Hemat & Cepat",
    costInput: "OpenAI Key / Akun",
    contextWindow: "128k tokens",
    latency: "< 200ms",
    description: "Model ringan super cepat untuk tanya-jawab sokrates instan.",
    icon: OpenAILogo,
    iconColor: "text-[#10A37F]",
  },

  // 4. Anthropic Claude
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    shortName: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    badge: "Frontier Math",
    costInput: "Anthropic Key / Akun",
    contextWindow: "200k tokens",
    latency: "~600ms",
    description: "Tutor Sokrates paling empatik dengan pemahaman pedagogis tertinggi.",
    icon: ClaudeLogo,
    iconColor: "text-[#D97706]",
  },

  // 5. Mistral AI
  {
    id: "codestral-latest",
    name: "Codestral 22B",
    shortName: "Codestral 22B",
    provider: "Mistral AI",
    badge: "Math Code",
    costInput: "Mistral Key / Akun",
    contextWindow: "32k tokens",
    latency: "~300ms",
    description: "Spesialis logika aljabar komputasi dan sintesis kurva SVG.",
    icon: MistralLogo,
    iconColor: "text-[#F54E00]",
  },

  // 6. SymPy CAS Local (Pure Deterministic - Tanpa LLM)
  {
    id: "sympy-cas-deterministic",
    name: "SymPy CAS (Deterministic)",
    shortName: "SymPy CAS Murni",
    provider: "Python Backend (FastAPI)",
    badge: "100% Deterministic",
    costInput: "Gratis (0 Biaya API)",
    contextWindow: "Tak Terbatas",
    latency: "< 50ms",
    description: "Engine kalkulasi simbolik deterministik tanpa halusinasi model generatif.",
    icon: SymPyLogo,
    iconColor: "text-[#3B82F6]",
  },

  // 7. BYO Custom Endpoint
  {
    id: "custom-byo",
    name: "Custom Model (BYO-Endpoint)",
    shortName: "Custom Model",
    provider: "Ollama / vLLM / LMStudio",
    badge: "Local Self-Hosted",
    costInput: "Sesuai Provider",
    contextWindow: "Konfigurasi Sendiri",
    latency: "Lokal",
    description: "Gunakan model open-source lokal via endpoint OpenAI-compatible.",
    icon: OllamaLogo,
    iconColor: "text-[#8B5CF6]",
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
}: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update trigger rect on open or resize
  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (containerRef.current) {
        setTriggerRect(containerRef.current.getBoundingClientRect());
      }
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const handleSelectModel = (model: AIModel) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zap_selected_model_id", model.id);
    }
    onSelectModel(model);
    setIsOpen(false);
  };

  const handleSelectEffort = (effort: ReasoningEffort) => {
    onChangeEffort(effort);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement | null;
        if (target && target.closest(".zap-model-portal")) {
          return;
        }
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const formatEffort = (eff: ReasoningEffort) => {
    if (eff === "high") return "High";
    if (eff === "medium") return "Medium";
    return "Low";
  };

  const handleMouseEnterContainer = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (containerRef.current) {
      setTriggerRect(containerRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  };

  const handleMouseLeaveContainer = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 280);
  };

  const handleMouseEnterPortal = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  // Dimensions & Coordinates - Single Unified Glass Popover
  const cardWidth = 308;
  const rightOffset = triggerRect
    ? Math.max(12, Math.min(window.innerWidth - cardWidth - 12, window.innerWidth - triggerRect.right))
    : 16;
  const bottomOffset = triggerRect ? Math.max(12, window.innerHeight - triggerRect.top + 6) : 56;
  const maxCardHeight = triggerRect ? Math.min(460, Math.max(260, triggerRect.top - 16)) : 380;

  return (
    <div
      className="relative inline-block text-left"
      ref={containerRef}
      onMouseEnter={handleMouseEnterContainer}
      onMouseLeave={handleMouseLeaveContainer}
    >
      {/* Trigger Button (Clean Harness Aesthetic) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (containerRef.current) {
            setTriggerRect(containerRef.current.getBoundingClientRect());
          }
          setIsOpen((prev) => !prev);
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

      {/* SINGLE UNIFIED GLASS POPOVER (Reasoning Effort + Model List) */}
      {mounted && isOpen && triggerRect && createPortal(
        <div
          className="zap-model-portal"
          onMouseEnter={handleMouseEnterPortal}
          onMouseLeave={handleMouseLeaveContainer}
        >
          <div
            style={{
              position: "fixed",
              bottom: `${bottomOffset}px`,
              right: `${rightOffset}px`,
              width: `${cardWidth}px`,
              maxHeight: `${maxCardHeight}px`,
              zIndex: 9999,
            }}
            className="liquid-glass-popup rounded-2xl text-slate-800 dark:text-zinc-200 shadow-2xl border border-slate-200/90 dark:border-white/10 backdrop-blur-2xl animate-liquid-pop origin-bottom-right flex flex-col overflow-hidden select-none"
          >
            {/* 1. TOP SECTION: REASONING EFFORT INLINE SEGMENTED CONTROLS */}
            <div className="p-2.5 pb-2 border-b border-slate-200/80 dark:border-white/[0.08] shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
                  REASONING EFFORT
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-semibold">
                  Hemat Token
                </span>
              </div>

              {/* 3-segment pill control */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/60 dark:bg-black/40 rounded-xl border border-slate-300/40 dark:border-white/[0.06]">
                {(["low", "medium", "high"] as ReasoningEffort[]).map((opt) => {
                  const isSelected = opt === reasoningEffort;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectEffort(opt);
                      }}
                      className={`py-1 px-1.5 rounded-lg text-xs transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-white dark:bg-white/15 text-slate-950 dark:text-white shadow-sm font-semibold"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <span>
                        {opt === "low" ? "⚡ Low" : opt === "medium" ? "⚖️ Med" : "🧠 High"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Effort Description Subtitle */}
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 px-0.5 leading-tight">
                {reasoningEffort === "high"
                  ? "🧠 Penalaran CoT bertingkat & pembuktian mendalam"
                  : reasoningEffort === "medium"
                  ? "⚖️ Keseimbangan kecepatan & kedalaman analisis"
                  : "⚡ Respon instan & sangat hemat kuota token"}
              </p>
            </div>

            {/* 2. MIDDLE SECTION: MODEL LIST HEADER */}
            <div className="px-3 pt-2 pb-1 flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] shrink-0">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
                PILIH MODEL AI
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                {AVAILABLE_MODELS.length} Model
              </span>
            </div>

            {/* 3. SCROLLABLE MODEL ITEMS */}
            <div className="space-y-0.5 overflow-y-auto p-1.5 no-scrollbar flex-1">
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = model.id === currentModel.id;
                const Icon = model.icon;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelectModel(model)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[12.5px] font-medium transition cursor-pointer text-left ${
                      isSelected
                        ? "bg-slate-900/[0.08] dark:bg-white/[0.14] text-slate-950 dark:text-white font-semibold"
                        : "text-slate-800 dark:text-zinc-200 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${model.iconColor || "text-slate-500"}`} />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{model.name}</span>
                          {model.badge && (
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-zinc-400 shrink-0">
                              {model.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 4. FOOTER: CONNECTOR LINK */}
            <div className="p-1.5 border-t border-slate-200/60 dark:border-white/[0.08] shrink-0 bg-slate-50/40 dark:bg-white/[0.01]">
              <Link
                href="/connector"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] transition"
              >
                <span>Kelola API Key &amp; Hub...</span>
                <ExternalLink className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
