"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Cpu,
  Layers,
  ChevronDown,
  Gauge,
  Coins,
  Zap,
  SlidersHorizontal,
  Check,
  Key,
  ExternalLink,
  Code2,
  Sparkles,
  Bot,
  Globe,
  Server,
  HelpCircle,
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
  // 1. OpenAI ChatGPT (Flagship Multimodal Tutor)
  {
    id: "gpt-4o",
    name: "GPT-4o Omni (ChatGPT OpenAI)",
    shortName: "GPT-4o",
    provider: "OpenAI (Omni Multimodal)",
    badge: "Flagship",
    costInput: "OpenAI Key / Akun",
    contextWindow: "128k tokens",
    latency: "~400ms",
    description: "Model multimodal cerdas OpenAI untuk pemahaman teks, penalaran aljabar, dan asistensi Sokrates bertahap.",
    icon: Bot,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini (ChatGPT Cepat)",
    shortName: "GPT-4o Mini",
    provider: "OpenAI (Lightweight)",
    badge: "Ultra Ringan",
    costInput: "OpenAI Key / Akun",
    contextWindow: "128k tokens",
    latency: "~200ms",
    description: "Model respons cepat dan hemat biaya dari OpenAI untuk tutoring kilat dan verifikasi langkah dasar.",
    icon: Bot,
  },

  // 2. Google Gemini (Default Auto Cloud)
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash (Auto Cloud)",
    shortName: "Gemini 2.0",
    provider: "Google DeepMind (Terhubung Otomatis)",
    badge: "Default Auto-Sync",
    costInput: "Gratis (Backend Pool)",
    contextWindow: "1M tokens",
    latency: "< 350ms",
    description: "Model default ZAP yang otomatis aktif saat login Google tanpa perlu konfigurasi API key manual.",
    icon: Zap,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro (Deep Math)",
    shortName: "Gemini 1.5 Pro",
    provider: "Google DeepMind (Penalaran Kompleks)",
    badge: "Analitis Tinggi",
    costInput: "Standard",
    contextWindow: "2M tokens",
    latency: "~1.2s",
    description: "Model dengan penalaran matematika paling mendalam untuk pembuktian konsep aljabar dan sains tingkat lanjut.",
    icon: Layers,
  },

  // 3. Anthropic Claude
  {
    id: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet (Hybrid Reasoning)",
    shortName: "Claude 3.7",
    provider: "Anthropic (Flagship)",
    badge: "Hybrid Thinking",
    costInput: "Anthropic Key",
    contextWindow: "200k tokens",
    latency: "~800ms",
    description: "Model flagship Anthropic dengan kemampuan coding dan penalaran matematika terunggul di dunia.",
    icon: Sparkles,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet (Coding & Logic)",
    shortName: "Claude 3.5",
    provider: "Anthropic (High IQ)",
    badge: "Top Logic",
    costInput: "Anthropic Key",
    contextWindow: "200k tokens",
    latency: "~600ms",
    description: "Model benchmark terfavorit untuk analisis kode, pemecahan masalah logika, dan deduksi matematika.",
    icon: Sparkles,
  },

  // 4. DeepSeek & BazaarLink Gateway
  {
    id: "bazaarlink-deepseek",
    name: "DeepSeek V4 Flash (BazaarLink)",
    shortName: "DeepSeek V4",
    provider: "BazaarLink Gateway (DeepSeek)",
    badge: "1M Konteks Gratis",
    costInput: "$0.00 Gratis",
    contextWindow: "1M tokens",
    latency: "< 300ms",
    description: "Model DeepSeek V4 Flash dengan jendela konteks 1 juta token melalui gateway gratis BazaarLink.",
    icon: Cpu,
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1 (Chain-of-Thought)",
    shortName: "DeepSeek R1",
    provider: "DeepSeek Reasoning AI",
    badge: "Deep Reasoning",
    costInput: "BazaarLink / DeepSeek Key",
    contextWindow: "128k tokens",
    latency: "~1.5s",
    description: "Model open-weights dengan penalaran bertahap (Chain-of-Thought) untuk pembuktian teorema matematika.",
    icon: Cpu,
  },

  // 5. Mistral AI & Codestral
  {
    id: "codestral-latest",
    name: "Codestral 22B (Mistral AI)",
    shortName: "Codestral 22B",
    provider: "Mistral AI (Ultra Cepat ~200ms)",
    badge: "22B Code Specialist",
    costInput: "Mistral Key",
    contextWindow: "256k tokens",
    latency: "< 250ms",
    description: "Model 22B spesialis kode dan aljabar logika ciptaan Mistral AI. Sangat kencang dan hemat token.",
    icon: Code2,
  },

  // 6. Custom Model API (OpenAI Compatible)
  {
    id: "custom-api",
    name: "Custom Model API (BYO-Endpoint)",
    shortName: "Custom API",
    provider: "Ollama / vLLM / LMStudio / Proxy",
    badge: "OpenAI-Compatible",
    costInput: "Custom URL",
    contextWindow: "Sesuai Host",
    latency: "Sesuai Host",
    description: "Hubungkan model AI lokal atau proxy sendiri menggunakan URL endpoint OpenAI-compatible apa pun.",
    icon: Server,
  },

  // 7. SymPy Deterministic Offline
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
  variant?: "default" | "pill";
  dropUp?: boolean;
}

export default function ModelPickerWithEffort({
  selectedModelId,
  onSelectModel,
  reasoningEffort,
  onChangeEffort,
  variant = "default",
  dropUp = false,
}: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Tab penyedia API: "gemini" | "claude" | "openai" | "deepseek" | "mistral" | "custom"
  const [activeTab, setActiveTab] = useState<
    "gemini" | "claude" | "openai" | "deepseek" | "mistral" | "custom"
  >("gemini");

  // State API Keys
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [bazaarKey, setBazaarKey] = useState("");
  const [mistralKey, setMistralKey] = useState("");

  // State Custom API
  const [customBaseUrl, setCustomBaseUrl] = useState("http://localhost:11434/v1");
  const [customModelName, setCustomModelName] = useState("llama3.3");
  const [customApiKey, setCustomApiKey] = useState("");

  const [toastMsg, setToastMsg] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setGeminiKey(localStorage.getItem("zap_gemini_api_key") || "");
      setClaudeKey(localStorage.getItem("zap_claude_api_key") || "");
      setOpenaiKey(localStorage.getItem("zap_openai_api_key") || "");
      setBazaarKey(localStorage.getItem("zap_bazaarlink_api_key") || "");
      setMistralKey(localStorage.getItem("zap_mistral_api_key") || "");

      setCustomBaseUrl(localStorage.getItem("zap_custom_base_url") || "http://localhost:11434/v1");
      setCustomModelName(localStorage.getItem("zap_custom_model_name") || "llama3.3");
      setCustomApiKey(localStorage.getItem("zap_custom_api_key") || "");
    }
  }, []);

  const saveKey = (storageKey: string, val: string, label: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, val.trim());
      setToastMsg(`${label} Tersimpan!`);
      setTimeout(() => setToastMsg(""), 2000);
    }
  };

  const saveCustomConfig = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zap_custom_base_url", customBaseUrl.trim());
      localStorage.setItem("zap_custom_model_name", customModelName.trim());
      localStorage.setItem("zap_custom_api_key", customApiKey.trim());
      setToastMsg("Custom API Tersimpan!");
      setTimeout(() => setToastMsg(""), 2000);
    }
  };

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const CurrentIcon = currentModel.icon;

  const handleSelectModel = (model: AIModel) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zap_selected_model_id", model.id);
    }
    onSelectModel(model);
    if (model.id.includes("claude")) setActiveTab("claude");
    else if (model.id.includes("gpt")) setActiveTab("openai");
    else if (model.id.includes("deepseek") || model.id.includes("bazaarlink")) setActiveTab("deepseek");
    else if (model.id.includes("mistral") || model.id.includes("codestral")) setActiveTab("mistral");
    else if (model.id.includes("custom")) setActiveTab("custom");
    else if (model.id.includes("gemini")) setActiveTab("gemini");
    setIsOpen(false);
  };

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
      {/* Trigger Button */}
      {variant === "pill" ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          title={`Model Tutor: ${currentModel.name}. Klik untuk mengganti ke ChatGPT atau model lain.`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all duration-150 focus:outline-none flex-shrink-0 shadow-sm cursor-pointer select-none ${
            isOpen
              ? "bg-blue-600/30 text-blue-200 border-blue-500/60 ring-2 ring-blue-500/20"
              : "bg-[#181d2a] hover:bg-[#22293b] border-white/[0.12] hover:border-blue-500/40 text-slate-200 hover:text-white"
          }`}
        >
          <CurrentIcon
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              currentModel.id.startsWith("gpt")
                ? "text-emerald-400"
                : currentModel.id.startsWith("claude")
                ? "text-amber-400"
                : currentModel.id.startsWith("deepseek") || currentModel.id.startsWith("bazaar")
                ? "text-cyan-400"
                : currentModel.id.startsWith("codestral")
                ? "text-orange-400"
                : "text-blue-400"
            }`}
          />
          <span className="font-semibold text-xs whitespace-nowrap">{currentModel.shortName}</span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-white" : ""
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          title={`Model Tutor: ${currentModel.name}`}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg bg-[#141721] hover:bg-[#1c202e] border border-white/[0.08] text-xs text-slate-200 transition focus:outline-none cursor-pointer"
        >
          <CurrentIcon
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              currentModel.id.startsWith("gpt")
                ? "text-emerald-400"
                : currentModel.id.startsWith("claude")
                ? "text-amber-400"
                : currentModel.id.startsWith("deepseek") || currentModel.id.startsWith("bazaar")
                ? "text-cyan-400"
                : currentModel.id.startsWith("codestral")
                ? "text-orange-400"
                : "text-blue-400"
            }`}
          />
          <span className="font-medium hidden sm:inline">{currentModel.name}</span>
          <span className="font-medium sm:hidden">{currentModel.shortName}</span>

          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 hidden xs:inline-block">
            {reasoningEffort}
          </span>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Floating Popover Connector Hub */}
      {isOpen && (
        <div
          className={`z-50 text-slate-200 bg-[#11141c] border border-white/[0.12] shadow-2xl p-3.5 sm:p-4 rounded-2xl backdrop-blur-2xl transition-all overflow-y-auto ${
            dropUp
              ? "fixed inset-x-3 bottom-20 max-h-[75vh] sm:absolute sm:inset-auto sm:right-0 sm:bottom-full sm:mb-2.5 sm:w-96 sm:max-h-[480px]"
              : "fixed inset-x-3 top-16 max-h-[75vh] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-h-[480px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.08]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Pilih Model Tutor ZAP</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                Hub 2026
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center text-xs ml-1"
                title="Tutup"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick 1-Click Flagship Pills (Terutama ChatGPT) */}
          <div className="grid grid-cols-4 gap-1.5 mb-2.5 p-1 rounded-xl bg-[#0a0c10] border border-white/[0.06]">
            {/* Quick ChatGPT GPT-4o */}
            <button
              type="button"
              onClick={() => {
                const target = AVAILABLE_MODELS.find((m) => m.id === "gpt-4o") || AVAILABLE_MODELS[0];
                handleSelectModel(target);
              }}
              className={`p-1.5 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                currentModel.id === "gpt-4o"
                  ? "bg-emerald-600 text-white font-semibold shadow-sm"
                  : "hover:bg-[#161a26] text-slate-300"
              }`}
            >
              <Bot className={`w-3.5 h-3.5 ${currentModel.id === "gpt-4o" ? "text-white" : "text-emerald-400"}`} />
              <span className="text-[10px] truncate w-full font-medium">GPT-4o</span>
            </button>

            {/* Quick ChatGPT GPT-4o Mini */}
            <button
              type="button"
              onClick={() => {
                const target = AVAILABLE_MODELS.find((m) => m.id === "gpt-4o-mini") || AVAILABLE_MODELS[1];
                handleSelectModel(target);
              }}
              className={`p-1.5 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                currentModel.id === "gpt-4o-mini"
                  ? "bg-emerald-600 text-white font-semibold shadow-sm"
                  : "hover:bg-[#161a26] text-slate-300"
              }`}
            >
              <Bot className={`w-3.5 h-3.5 ${currentModel.id === "gpt-4o-mini" ? "text-white" : "text-emerald-400"}`} />
              <span className="text-[10px] truncate w-full font-medium">GPT-Mini</span>
            </button>

            {/* Quick Gemini 2.0 */}
            <button
              type="button"
              onClick={() => {
                const target = AVAILABLE_MODELS.find((m) => m.id === "gemini-2.0-flash") || AVAILABLE_MODELS[2];
                handleSelectModel(target);
              }}
              className={`p-1.5 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                currentModel.id === "gemini-2.0-flash"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "hover:bg-[#161a26] text-slate-300"
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${currentModel.id === "gemini-2.0-flash" ? "text-white" : "text-blue-400"}`} />
              <span className="text-[10px] truncate w-full font-medium">Gemini</span>
            </button>

            {/* Quick DeepSeek V4 */}
            <button
              type="button"
              onClick={() => {
                const target = AVAILABLE_MODELS.find((m) => m.id === "bazaarlink-deepseek") || AVAILABLE_MODELS[3];
                handleSelectModel(target);
              }}
              className={`p-1.5 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                currentModel.id === "bazaarlink-deepseek"
                  ? "bg-cyan-600 text-white font-semibold shadow-sm"
                  : "hover:bg-[#161a26] text-slate-300"
              }`}
            >
              <Cpu className={`w-3.5 h-3.5 ${currentModel.id === "bazaarlink-deepseek" ? "text-white" : "text-cyan-400"}`} />
              <span className="text-[10px] truncate w-full font-medium">DeepSeek</span>
            </button>
          </div>

          {/* Model Options List */}
          <div className="space-y-1 mb-3 max-h-52 overflow-y-auto pr-1">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === currentModel.id;
              const Icon = model.icon;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelectModel(model)}
                  className={`w-full text-left p-2 rounded-xl border transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-blue-600/15 border-blue-500/40 text-white"
                      : "bg-[#161a26]/60 border-transparent hover:bg-[#1c2130] hover:border-white/[0.05] text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isSelected ? "text-blue-400" : "text-slate-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{model.name}</span>
                        {model.badge && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                              isSelected
                                ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                                : "bg-slate-800 border border-slate-700 text-slate-400"
                            }`}
                          >
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {model.provider}
                      </span>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Active Model Specs */}
          <div className="p-2.5 rounded-xl bg-[#0a0c10] border border-white/[0.06] space-y-1 mb-3 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Coins className="w-3 h-3 text-slate-400" />
                <span>Biaya API:</span>
              </span>
              <span className="font-mono text-slate-200">{currentModel.costInput}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-slate-400" />
                <span>Latensi:</span>
              </span>
              <span className="font-mono text-emerald-400">{currentModel.latency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-slate-400" />
                <span>Kapasitas Konteks:</span>
              </span>
              <span className="font-mono text-slate-300">{currentModel.contextWindow}</span>
            </div>
          </div>

          {/* Reasoning Effort Control */}
          <div className="pt-2 border-t border-white/[0.08] mb-3">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                <span>Reasoning Effort:</span>
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-300">
                {reasoningEffort}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#0a0c10] border border-white/[0.06]">
              {(["low", "medium", "high"] as ReasoningEffort[]).map((level) => {
                const isActive = reasoningEffort === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChangeEffort(level)}
                    className={`py-1 text-[11px] font-medium rounded capitalize transition ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {level === "low" ? "Low" : level === "medium" ? "Med" : "High"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONNECTOR PLUGIN CONFIGURATION */}
          <div className="pt-2.5 border-t border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Konfigurasi Plugin / Kunci:</span>
              </span>
              {toastMsg && (
                <span className="text-[10px] text-emerald-400 font-mono animate-pulse">
                  {toastMsg}
                </span>
              )}
            </div>

            {/* Provider Tabs Slider */}
            <div className="flex gap-1 overflow-x-auto pb-1.5 mb-2 scrollbar-none text-[10px]">
              {[
                { id: "gemini", label: "Gemini" },
                { id: "claude", label: "Claude" },
                { id: "openai", label: "ChatGPT" },
                { id: "deepseek", label: "DeepSeek" },
                { id: "mistral", label: "Mistral" },
                { id: "custom", label: "Custom API" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-[#141721] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: GOOGLE GEMINI */}
            {activeTab === "gemini" && (
              <div className="space-y-1.5 text-xs animate-fadeIn">
                <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[10px] text-blue-200 leading-relaxed">
                  ✨ <strong>Auto-Provisioning:</strong> Pengguna yang login via Google otomatis terhubung ke Gemini tanpa perlu memasukkan API key.
                </div>
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Kunci Sendiri (Opsional: AIzaSy...)"
                    className="flex-1 bg-[#0a0c10] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => saveKey("zap_gemini_api_key", geminiKey, "Gemini Key")}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {/* TAB: ANTHROPIC CLAUDE */}
            {activeTab === "claude" && (
              <div className="space-y-1.5 text-xs animate-fadeIn">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Anthropic API Key (Claude 3.7 / 3.5):</span>
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline inline-flex items-center gap-0.5 text-[9px]"
                  >
                    console.anthropic.com
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={claudeKey}
                    onChange={(e) => setClaudeKey(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="flex-1 bg-[#0a0c10] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => saveKey("zap_claude_api_key", claudeKey, "Claude Key")}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {/* TAB: OPENAI CHATGPT */}
            {activeTab === "openai" && (
              <div className="space-y-2 text-xs animate-fadeIn">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Akun / Kunci OpenAI ChatGPT</span>
                  </span>
                  <a
                    href="https://platform.openai.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline inline-flex items-center gap-0.5 text-[9px]"
                  >
                    platform.openai.com
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* 1-Click Connect Account Button */}
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-300 font-medium">Akses Cepat Akun ChatGPT:</span>
                    {openaiKey?.startsWith("sk-proj-chatgpt-account-") && (
                      <span className="text-emerald-400 font-mono text-[9px]">🟢 Terhubung</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const dummySession = `sk-proj-chatgpt-account-${Math.random().toString(36).substring(2, 10)}`;
                      setOpenaiKey(dummySession);
                      saveKey("zap_openai_api_key", dummySession, "Akun ChatGPT");
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Aktifkan Akses Akun ChatGPT (Instan)</span>
                  </button>
                </div>

                {/* Manual API Key Input */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block">Atau tempel OpenAI API Key resmi:</span>
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="flex-1 bg-[#0a0c10] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => saveKey("zap_openai_api_key", openaiKey, "OpenAI Key")}
                      className="px-2.5 py-1.5 text-[11px] font-medium bg-[#1e2536] hover:bg-[#283248] text-slate-200 hover:text-white rounded-lg transition border border-white/[0.08]"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DEEPSEEK & BAZAARLINK */}
            {activeTab === "deepseek" && (
              <div className="space-y-1.5 text-xs animate-fadeIn">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">BazaarLink / DeepSeek API Key:</span>
                  <a
                    href="https://bazaarlink.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-0.5 text-[9px]"
                  >
                    bazaarlink.ai
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={bazaarKey}
                    onChange={(e) => setBazaarKey(e.target.value)}
                    placeholder="sk-bl-... atau sk-..."
                    className="flex-1 bg-[#0a0c10] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => saveKey("zap_bazaarlink_api_key", bazaarKey, "BazaarLink Key")}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {/* TAB: MISTRAL AI */}
            {activeTab === "mistral" && (
              <div className="space-y-1.5 text-xs animate-fadeIn">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Mistral AI Key (Codestral 22B):</span>
                  <a
                    href="https://console.mistral.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-400 hover:underline inline-flex items-center gap-0.5 text-[9px]"
                  >
                    console.mistral.ai
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={mistralKey}
                    onChange={(e) => setMistralKey(e.target.value)}
                    placeholder="Masukkan Mistral API Key..."
                    className="flex-1 bg-[#0a0c10] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => saveKey("zap_mistral_api_key", mistralKey, "Mistral Key")}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {/* TAB: CUSTOM MODEL API (BYO-ENDPOINT) */}
            {activeTab === "custom" && (
              <div className="space-y-2 text-xs animate-fadeIn">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">
                    Base URL (OpenAI-Compatible):
                  </label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full bg-[#0a0c10] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Model Name:</label>
                    <input
                      type="text"
                      value={customModelName}
                      onChange={(e) => setCustomModelName(e.target.value)}
                      placeholder="llama3.3"
                      className="w-full bg-[#0a0c10] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">API Key (Opsional):</label>
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="Bearer token..."
                      className="w-full bg-[#0a0c10] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={saveCustomConfig}
                  className="w-full py-1.5 text-[11px] font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
                >
                  Simpan Konfigurasi Custom API
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
