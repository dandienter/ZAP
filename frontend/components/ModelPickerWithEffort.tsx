"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [activeSubmenu, setActiveSubmenu] = useState<"model" | "effort" | null>("model");
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
        // Also check if click is inside portal
        const target = event.target as HTMLElement | null;
        if (target && target.closest(".zap-model-portal")) {
          return;
        }
        setIsOpen(false);
        setActiveSubmenu(null);
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
    setActiveSubmenu("model");
  };

  const handleMouseLeaveContainer = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveSubmenu(null);
    }, 280);
  };

  const handleMouseEnterPortal = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  // Dimensions & Coordinates
  const mainWidth = 232;
  const submenuWidth = activeSubmenu === "effort" ? 220 : 288;
  const rightOffset = triggerRect ? Math.max(12, window.innerWidth - triggerRect.right) : 16;
  const bottomOffset = triggerRect ? Math.max(12, window.innerHeight - triggerRect.top + 6) : 56;

  // Submenu left alignment with auto-clamping to screen edge
  const mainCardLeft = triggerRect ? triggerRect.right - mainWidth : 300;
  let submenuLeft = mainCardLeft - 8 - submenuWidth;
  if (submenuLeft < 12) {
    submenuLeft = 12;
  }

  // Maximum submenu height to prevent top viewport clipping
  const maxSubmenuHeight = triggerRect ? Math.min(380, Math.max(220, triggerRect.top - 20)) : 340;

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
          setIsOpen((prev) => {
            const next = !prev;
            if (next) setActiveSubmenu("model");
            else setActiveSubmenu(null);
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

      {/* Flyout Cascading Menus Rendered via Portal (Immune to parent overflow-hidden & screen clipping) */}
      {mounted && isOpen && triggerRect && createPortal(
        <div
          className="zap-model-portal"
          onMouseEnter={handleMouseEnterPortal}
          onMouseLeave={handleMouseLeaveContainer}
        >
          {/* CARD 1: PRIMARY 2-ROW CONTEXT MENU (Model & Effort) */}
          <div
            style={{
              position: "fixed",
              bottom: `${bottomOffset}px`,
              right: `${rightOffset}px`,
              width: `${mainWidth}px`,
              zIndex: 9999,
            }}
            className="liquid-glass-popup rounded-2xl p-1.5 text-slate-800 dark:text-zinc-200 shadow-2xl border border-slate-200/90 dark:border-white/10 backdrop-blur-2xl animate-liquid-pop origin-bottom-right select-none"
          >
            {/* Row 1: Model */}
            <div
              onMouseEnter={() => setActiveSubmenu("model")}
              onClick={() => setActiveSubmenu("model")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition cursor-pointer ${
                activeSubmenu === "model"
                  ? "bg-slate-900/[0.08] dark:bg-white/[0.12] text-slate-950 dark:text-white font-semibold"
                  : "text-slate-700 dark:text-zinc-300 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <span>Model</span>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                <span className="truncate max-w-[105px] text-xs font-normal text-right">
                  {currentModel.id.includes("deepseek") ? "DeepSeek V4.1" : currentModel.shortName}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
              </div>
            </div>

            {/* Row 2: Effort */}
            <div
              onMouseEnter={() => setActiveSubmenu("effort")}
              onClick={() => setActiveSubmenu("effort")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition cursor-pointer ${
                activeSubmenu === "effort"
                  ? "bg-slate-900/[0.08] dark:bg-white/[0.12] text-slate-950 dark:text-white font-semibold"
                  : "text-slate-700 dark:text-zinc-300 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <span>Effort</span>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                <span className="text-xs font-normal text-right">
                  {formatEffort(reasoningEffort)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
              </div>
            </div>
          </div>

          {/* CARD 2A: MODEL SELECTION SUBMENU (Opens to the left of the main card with zero clipping) */}
          {activeSubmenu === "model" && (
            <div
              style={{
                position: "fixed",
                bottom: `${bottomOffset}px`,
                left: `${submenuLeft}px`,
                width: `${submenuWidth}px`,
                maxHeight: `${maxSubmenuHeight}px`,
                zIndex: 9999,
              }}
              className="liquid-glass-popup rounded-2xl p-2 text-slate-800 dark:text-zinc-200 shadow-2xl border border-slate-200/90 dark:border-white/10 backdrop-blur-2xl animate-liquid-pop origin-bottom-right flex flex-col overflow-hidden select-none"
            >
              <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] shrink-0 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
                  PILIH MODEL
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                  {AVAILABLE_MODELS.length} Model
                </span>
              </div>

              <div className="space-y-0.5 overflow-y-auto px-0.5 no-scrollbar flex-1">
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
                        <span className="truncate">{model.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-white/[0.08] shrink-0">
                <Link
                  href="/connector"
                  onClick={() => {
                    setIsOpen(false);
                    setActiveSubmenu(null);
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11.5px] font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] transition"
                >
                  <span>Kelola API Key &amp; Hub...</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                </Link>
              </div>
            </div>
          )}

          {/* CARD 2B: REASONING EFFORT SUBMENU (Opens to the left of the main card with zero clipping) */}
          {activeSubmenu === "effort" && (
            <div
              style={{
                position: "fixed",
                bottom: `${bottomOffset}px`,
                left: `${submenuLeft}px`,
                width: `${submenuWidth}px`,
                zIndex: 9999,
              }}
              className="liquid-glass-popup rounded-2xl p-2 text-slate-800 dark:text-zinc-200 shadow-2xl border border-slate-200/90 dark:border-white/10 backdrop-blur-2xl animate-liquid-pop origin-bottom-right select-none"
            >
              <div className="px-2.5 py-1.5 border-b border-slate-200/80 dark:border-white/[0.08] mb-1 flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
                  REASONING EFFORT
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-semibold">
                  Hemat Token
                </span>
              </div>

              <div className="space-y-1 px-0.5">
                {(["low", "medium", "high"] as ReasoningEffort[]).map((opt) => {
                  const isSelected = opt === reasoningEffort;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectEffort(opt)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                        isSelected
                          ? "bg-slate-900/[0.08] dark:bg-white/[0.14] text-slate-950 dark:text-white font-semibold"
                          : "text-slate-800 dark:text-zinc-200 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {formatEffort(opt)}
                          </span>
                          {opt === "low" && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-medium">
                              Paling Irit
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight mt-0.5">
                          {opt === "high"
                            ? "Penalaran bertingkat & pembuktian mendalam"
                            : opt === "medium"
                            ? "Keseimbangan kecepatan dan analisis"
                            : "Respon instan & sangat hemat token"}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-slate-900 dark:text-white shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
