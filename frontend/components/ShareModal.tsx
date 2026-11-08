"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  Loader2,
  ShieldCheck,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import ZapLogo from "@/components/ZapLogo";
import { type ZAPUser } from "@/components/GoogleAuthButton";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: {
    id: string;
    title: string;
    messages: any[];
    createdAt?: number;
    updatedAt?: number;
    targetVar?: string;
  } | null;
  currentUser: ZAPUser | null;
  active3DModel?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  conversation,
  currentUser,
  active3DModel,
}: ShareModalProps) {
  const [includeAuthor, setIncludeAuthor] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !conversation) return;

    let isMounted = true;
    async function createShareLink() {
      setIsGenerating(true);
      setError(null);
      setCopied(false);

      try {
        const res = await fetch("/api/chat/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversation?.id,
            title: conversation?.title || "Percakapan ChatZAP",
            messages: conversation?.messages || [],
            authorName: currentUser?.name || "Pengguna ChatZAP",
            authorEmail: currentUser?.email,
            includeAuthor,
            targetVar: conversation?.targetVar || "x",
            active3DModel,
          }),
        });

        const json = await res.json();
        if (json.success && json.sharePath) {
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          if (isMounted) {
            setShareUrl(`${origin}${json.sharePath}`);
          }
        } else {
          throw new Error(json.error || "Gagal membuat tautan percakapan");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Terjadi kesalahan saat membagikan percakapan.");
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          setShareUrl(`${origin}/a/chat/s/${conversation?.id || "conv"}`);
        }
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    }

    createShareLink();

    return () => {
      isMounted = false;
    };
  }, [isOpen, conversation, includeAuthor, currentUser, active3DModel]);

  if (!isOpen || !conversation) return null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenExternal = () => {
    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#16181d] border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 text-slate-900 dark:text-zinc-100 flex flex-col gap-5 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Bagikan Tautan ke Percakapan
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Siapa pun yang memiliki tautan publik ini dapat melihat cuplikan chat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot Summary Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shrink-0 mt-0.5">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
              {conversation.title || "Percakapan ChatZAP"}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>{conversation.messages.length} pesan</span>
              <span>•</span>
              <span>
                {includeAuthor && currentUser?.name
                  ? `Dibagikan oleh ${currentUser.name}`
                  : "Dibagikan secara Anonim"}
              </span>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between text-xs px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={includeAuthor}
              onChange={(e) => setIncludeAuthor(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-0 bg-white dark:bg-zinc-800 cursor-pointer"
            />
            <span>Sertakan nama akun saya ({currentUser?.name || "Pengguna"})</span>
          </label>

          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            API Key & Data Pribadi Aman
          </span>
        </div>

        {/* URL Input Box */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            Tautan Percakapan Publik
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                readOnly
                value={isGenerating ? "Membuat tautan..." : shareUrl}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700/80 text-xs font-mono text-slate-800 dark:text-zinc-200 select-all focus:outline-none"
              />
              {isGenerating && (
                <div className="absolute right-3">
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={isGenerating || !shareUrl}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-sky-500 hover:bg-sky-400 text-zinc-950 disabled:opacity-50"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Disalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin Tautan
                </>
              )}
            </button>
          </div>
          {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleOpenExternal}
            disabled={!shareUrl || isGenerating}
            className="text-xs text-sky-500 hover:text-sky-400 font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>Buka di tab baru</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
