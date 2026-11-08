"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ZapLogo from "@/components/ZapLogo";
import RichChatText from "@/components/RichChatText";
import { useTheme } from "@/utils/theme";
import {
  Share2,
  Check,
  ArrowRight,
  Sparkles,
  User,
  Clock,
  Layers,
  Box,
  Copy,
  Sun,
  Moon,
  ExternalLink,
  MessageSquare,
  Lock,
} from "lucide-react";

interface ShareMessage {
  id: string;
  sender: "user" | "assistant";
  steps?: string[];
  rawText?: string;
  diagnosis?: any;
  replyText?: string;
  modelName?: string;
  timestamp: string;
  smartboardItem?: any;
  feedback?: "up" | "down" | null;
  attachedFiles?: Array<{ name: string; size: number; type: string }>;
}

interface SharedData {
  shareId: string;
  conversationId?: string;
  title: string;
  authorName?: string;
  sharedAt: number;
  messages: ShareMessage[];
  targetVar?: string;
  active3DModel?: string;
}

export default function SharedChatView({ shareId }: { shareId: string }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadShared() {
      try {
        setLoading(true);
        const res = await fetch(`/api/chat/share?id=${encodeURIComponent(shareId)}`);
        const json = await res.json();
        if (!res.ok) {
          if (res.status === 403 || json.isRevoked) {
            throw new Error("Tautan publik percakapan ini telah dinonaktifkan oleh pemiliknya.");
          }
          if (res.status === 404) {
            throw new Error("Percakapan yang dibagikan tidak ditemukan atau belum dipublikasikan oleh pemilik.");
          }
          throw new Error(json.error || "Gagal memuat percakapan dari server.");
        }
        if (json.exists && json.data) {
          if (isMounted) setData(json.data);
        } else {
          throw new Error(json.error || "Data percakapan tidak valid.");
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Terjadi kesalahan saat memuat tautan.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (shareId) {
      loadShared();
    }
    return () => {
      isMounted = false;
    };
  }, [shareId]);

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleContinueChat = () => {
    router.push(`/chat?import=${encodeURIComponent(shareId)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 animate-pulse">
          <ZapLogo className="w-6 h-6 text-sky-400" />
        </div>
        <p className="text-sm font-medium text-zinc-400 animate-pulse">
          Memuat riwayat percakapan...
        </p>
      </div>
    );
  }

  if (error || !data) {
    const isRevoked = error?.includes("dinonaktifkan");

    return (
      <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-5 ${
            isRevoked
              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
              : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
          }`}
        >
          {isRevoked ? <Lock className="w-8 h-8" /> : <Share2 className="w-8 h-8" />}
        </div>
        <h1 className="text-xl font-bold text-zinc-100 mb-2">
          {isRevoked ? "Akses Dibatasi: Tautan Dinonaktifkan" : "Percakapan Tidak Ditemukan"}
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          {isRevoked
            ? "Pemilik percakapan ini telah mengunci atau menonaktifkan tautan publik. Percakapan ini tidak lagi dapat diakses oleh publik demi menjaga privasi dan keamanan data."
            : error ||
              "Tautan yang Anda tuju mungkin salah, telah dihapus, atau belum dipublikasikan oleh pemiliknya."}
        </p>
        <div className="flex gap-3">
          <Link
            href="/chat"
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-sm transition-colors shadow-lg shadow-sky-500/20 inline-flex items-center gap-2"
          >
            Mulai Chat di ChatZAP
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(data.sharedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0d0f12]/80 border-b border-zinc-800/60 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
              <ZapLogo className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white group-hover:text-sky-400 transition-colors">
              ChatZAP
            </span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
            <Share2 className="w-3 h-3 text-sky-400" />
            Shared Chat
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={handleCopyLink}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
              copied
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Tautan Disalin!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Salin Tautan
              </>
            )}
          </button>

          <button
            onClick={handleContinueChat}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
          >
            <span>Buka di ChatZAP</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 pb-32">
        {/* Title Header */}
        <div className="mb-8 pb-6 border-b border-zinc-800/60">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            {data.title || "Percakapan Tanpa Judul"}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-zinc-300">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              {data.authorName || "Anonim"}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              {formattedDate}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
              {data.messages.length} pesan
            </span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="space-y-6">
          {data.messages.map((msg, index) => {
            const isUser = msg.sender === "user";

            if (isUser) {
              return (
                <div key={msg.id || index} className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 pr-1">
                    <span>{data.authorName || "Pengguna"}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className="max-w-[85%] rounded-2xl px-5 py-3.5 bg-zinc-800 text-zinc-100 text-sm leading-relaxed border border-zinc-700/50 shadow-sm">
                    {msg.steps && msg.steps.length > 0 ? (
                      <div className="space-y-1">
                        {msg.steps.map((st, i) => (
                          <div key={i} className="font-mono text-xs">
                            {st}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.rawText || ""}</div>
                    )}
                  </div>
                </div>
              );
            }

            // Assistant Reply
            return (
              <div key={msg.id || index} className="flex gap-3.5 sm:gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <ZapLogo className="w-4 h-4 text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 text-xs">
                    <span className="font-semibold text-sky-400">ChatZAP Socratic</span>
                    {msg.modelName && (
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {msg.modelName}
                      </span>
                    )}
                  </div>

                  <div className="rounded-2xl p-5 bg-[#14171c]/90 border border-zinc-800/80 shadow-sm space-y-4">
                    {msg.replyText && (
                      <RichChatText
                        content={msg.replyText}
                        className="text-sm text-zinc-200 leading-relaxed"
                      />
                    )}

                    {/* 3D Smartboard card preview if present */}
                    {msg.smartboardItem && (
                      <div className="mt-4 p-4 rounded-xl bg-zinc-900/90 border border-sky-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                            <Box className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                              Papan Tulis Virtual 3D
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-mono">
                                {msg.smartboardItem.solidKind || msg.smartboardItem.model || "Geometri 3D"}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Model geometri interaktif tersedia di Smartboard ChatZAP
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleContinueChat}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-medium transition-colors inline-flex items-center gap-1.5 self-end sm:self-auto"
                        >
                          Lihat 3D di ZAP
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/95 to-transparent pt-6 pb-6 px-4">
        <div className="max-w-2xl mx-auto rounded-2xl bg-zinc-900/90 border border-zinc-800/90 shadow-2xl backdrop-blur-xl p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">
                Lanjutkan percakapan ini
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                Eksplorasi langkah matematika & visualisasi 3D sendiri di ChatZAP
              </p>
            </div>
          </div>

          <button
            onClick={handleContinueChat}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-sky-500/25 shrink-0 flex items-center gap-2"
          >
            <span>Lanjutkan di ZAP</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
