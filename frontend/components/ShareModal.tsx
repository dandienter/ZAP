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
  Lock,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { type ZAPUser } from "@/components/GoogleAuthButton";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: {
    id: string;
    title: string;
    messages: Array<unknown>;
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
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [shareId, setShareId] = useState<string>("");
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
            isPublic: true,
            targetVar: conversation?.targetVar || "x",
            active3DModel,
          }),
        });

        const json = await res.json();
        if (json.success && json.sharePath) {
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          if (isMounted) {
            setShareId(json.shareId);
            setShareUrl(`${origin}${json.sharePath}`);
            setIsPublic(true);
          }
        } else {
          throw new Error(json.error || "Gagal membuat tautan percakapan");
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat membagikan percakapan.";
          setError(msg);
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

  const handleTogglePublic = async (nextState: boolean) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareId,
          conversationId: conversation.id,
          title: conversation.title,
          messages: conversation.messages,
          authorName: currentUser?.name || "Pengguna ZAP",
          authorEmail: currentUser?.email,
          includeAuthor,
          isPublic: nextState,
          targetVar: conversation.targetVar,
          active3DModel,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsPublic(nextState);
      } else {
        throw new Error(json.error || "Gagal memperbarui status publik tautan.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status publik tautan.";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl || !isPublic) return;
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
    if (shareUrl && isPublic) {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl liquid-glass-popup p-6 text-slate-900 dark:text-zinc-100 flex flex-col gap-5 relative animate-liquid-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] shadow-sm">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Bagikan Tautan ke Percakapan
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Kontrol akses publik dan privasi obrolan Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal bagikan"
            title="Tutup"
            className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot Summary Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-700 dark:text-zinc-300 shrink-0 mt-0.5">
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

        {/* Security & Public Access Control Toggle */}
        <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-200/80 dark:bg-white/[0.08] border border-slate-300 dark:border-white/[0.1] flex items-center justify-center text-slate-700 dark:text-zinc-300 shrink-0">
              {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>{isPublic ? "Akses Publik Aktif" : "Akses Publik Dinonaktifkan (Privat)"}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-200 dark:bg-white/[0.1] text-slate-800 dark:text-zinc-200">
                  {isPublic ? "Bisa Dilihat" : "Terkunci"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                {isPublic
                  ? "Siapa pun yang memiliki tautan dapat membaca percakapan ini."
                  : "Hanya Anda yang dapat melihat percakapan ini di akun Anda."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => handleTogglePublic(!isPublic)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              isPublic
                ? "bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.1] dark:hover:bg-white/[0.16] text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-white/[0.1]"
                : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200 shadow-sm"
            }`}
          >
            {isPublic ? "Kunci / Matikan" : "Aktifkan Publik"}
          </button>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between text-xs px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={includeAuthor}
              onChange={(e) => setIncludeAuthor(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-slate-500 focus:ring-offset-0 bg-white dark:bg-zinc-800 cursor-pointer"
            />
            <span>Sertakan nama akun saya ({currentUser?.name || "Pengguna"})</span>
          </label>

          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            API Key & Sesi Privat Aman
          </span>
        </div>

        {/* URL Input Box */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Tautan Percakapan Publik</span>
            {!isPublic && (
              <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Tautan saat ini tidak aktif
              </span>
            )}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                readOnly
                aria-label="Tautan Percakapan Publik"
                value={
                  isGenerating
                    ? "Memproses..."
                    : isPublic
                    ? shareUrl
                    : "(Tautan dinonaktifkan oleh pemilik)"
                }
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border text-xs font-mono select-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                  isPublic
                    ? "border-slate-300 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-200"
                    : "border-slate-300 dark:border-zinc-700/80 text-slate-500 dark:text-zinc-400 line-through"
                }`}
              />
              {isGenerating && (
                <div className="absolute right-3">
                  <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={isGenerating || !shareUrl || !isPublic}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer ${
                copied
                  ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                  : isPublic
                  ? "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200 disabled:opacity-50"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
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
            disabled={!shareUrl || isGenerating || !isPublic}
            className="text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-medium inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <span>Buka pratinjau publik</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
