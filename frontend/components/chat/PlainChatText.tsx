"use client";

import React from "react";

interface PlainChatTextProps {
  content: string;
  className?: string;
}

/**
 * Renderer teks polos tanpa dependensi berat (tanpa KaTeX).
 *
 * Dipakai sebagai:
 * 1. Renderer final untuk pesan yang tidak mengandung markdown/rumus sama
 *    sekali, sehingga chunk KaTeX tidak perlu dimuat sama sekali.
 * 2. Fallback selama chunk RichChatText dimuat secara lazy; struktur blok
 *    dan metrik teksnya meniru RichChatText agar pergantian renderer tidak
 *    menggeser layout (CLS tetap 0).
 *
 * Penanda markdown sederhana (**tebal**, *miring*, $...$) dilepas dari
 * tampilan polos; isi teksnya sendiri dipertahankan apa adanya.
 */
function stripMarkers(text: string): string {
  return text
    .replace(/\*\*([^*]+?)\*\*/g, "$1")
    .replace(/\*([^*\n]+?)\*/g, "$1")
    .replace(/\$\$?/g, "");
}

export default function PlainChatText({ content, className = "" }: PlainChatTextProps) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className={`space-y-2.5 text-[15.5px] leading-relaxed text-slate-800 dark:text-zinc-200 break-words [overflow-wrap:anywhere] max-w-full ${className}`}>
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();

        if (!line) {
          return <div key={index} className="h-1.5" />;
        }

        if (line.startsWith("$$") && line.endsWith("$$") && line.length >= 4) {
          return (
            <div
              key={index}
              className="my-3 overflow-x-auto py-2 text-center text-slate-900 dark:text-white text-base"
            >
              {stripMarkers(line.slice(2, -2).trim())}
            </div>
          );
        }

        if (line.startsWith("### ")) {
          return (
            <h2
              key={index}
              className="text-base sm:text-[17px] font-semibold text-slate-900 dark:text-white pt-2.5 pb-0.5 tracking-tight"
            >
              {stripMarkers(line.replace(/^###\s+/, ""))}
            </h2>
          );
        }

        if (line.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-3 pb-1 tracking-tight"
            >
              {stripMarkers(line.replace(/^##\s+/, ""))}
            </h2>
          );
        }

        if (line.startsWith("# ")) {
          return (
            <h1
              key={index}
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-3.5 pb-1 tracking-tight"
            >
              {stripMarkers(line.replace(/^#\s+/, ""))}
            </h1>
          );
        }

        if (/^[-*]\s+/.test(line)) {
          return (
            <div key={index} className="flex items-start gap-2.5 pl-1 my-1">
              <span className="text-slate-400 dark:text-zinc-500 select-none text-base leading-relaxed shrink-0">•</span>
              <div className="flex-1 min-w-0">{stripMarkers(line.replace(/^[-*]\s+/, ""))}</div>
            </div>
          );
        }

        const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={index} className="flex items-start gap-2 pl-1 my-1">
              <span className="font-mono text-sm text-slate-500 dark:text-zinc-400 select-none w-5 pt-0.5 shrink-0">
                {numMatch[1]}.
              </span>
              <div className="flex-1 min-w-0">{stripMarkers(numMatch[2])}</div>
            </div>
          );
        }

        if (line.startsWith("💡") || line.startsWith("📌") || line.startsWith("⚠️")) {
          return (
            <div
              key={index}
              className="my-3 p-3.5 sm:p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 text-[15px] leading-relaxed shadow-sm"
            >
              {stripMarkers(line)}
            </div>
          );
        }

        return (
          <p key={index} className="leading-relaxed">
            {stripMarkers(line)}
          </p>
        );
      })}
    </div>
  );
}
