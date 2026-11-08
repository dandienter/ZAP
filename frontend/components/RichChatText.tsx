"use client";

import React from "react";
import katex from "katex";

interface RichChatTextProps {
  content: string;
  className?: string;
}

export default function RichChatText({ content, className = "" }: RichChatTextProps) {
  if (!content) return null;

  // Helper untuk memformat teks inline (Math KaTeX, Bold, Italic, Code)
  const formatInlineText = (text: string) => {
    // 1. Split berdasarkan inline math $...$
    const mathParts = text.split(/(\$[^$\n]+?\$)/g);

    return mathParts.map((mPart, mIdx) => {
      if (mPart.startsWith("$") && mPart.endsWith("$") && mPart.length > 2) {
        const mathContent = mPart.slice(1, -1).trim();
        try {
          const html = katex.renderToString(mathContent, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={`m_${mIdx}`}
              className="inline-block px-1 text-slate-900 dark:text-white font-medium align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <code key={`m_${mIdx}`} className="font-mono text-sm px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-800 dark:text-zinc-200">
              {mathContent}
            </code>
          );
        }
      }

      // 2. Split teks tebal **text**
      const boldParts = mPart.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={`b_${mIdx}`}>
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length >= 4) {
              const boldContent = bPart.slice(2, -2);
              return (
                <strong key={`bold_${bIdx}`} className="font-semibold text-slate-900 dark:text-white">
                  {boldContent}
                </strong>
              );
            }

            // 3. Split teks miring *text* (bukan bullet atau math)
            const italicParts = bPart.split(/(\*[^*\n]+\*)/g);
            return (
              <span key={`i_${bIdx}`}>
                {italicParts.map((iPart, iIdx) => {
                  if (iPart.startsWith("*") && iPart.endsWith("*") && iPart.length >= 2 && !iPart.startsWith("**")) {
                    return (
                      <em key={`em_${iIdx}`} className="italic text-slate-700 dark:text-zinc-300">
                        {iPart.slice(1, -1)}
                      </em>
                    );
                  }
                  return iPart;
                })}
              </span>
            );
          })}
        </span>
      );
    });
  };

  const lines = content.split("\n");

  return (
    <div className={`space-y-2 text-[15px] sm:text-base leading-relaxed text-slate-800 dark:text-zinc-200 ${className}`}>
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();

        // Baris kosong
        if (!line) {
          return <div key={index} className="h-2" />;
        }

        // Display math block: $$...$$
        if (line.startsWith("$$") && line.endsWith("$$")) {
          const mathContent = line.slice(2, -2).trim();
          try {
            const html = katex.renderToString(mathContent, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <div
                key={index}
                className="my-3 overflow-x-auto py-2 text-center text-slate-900 dark:text-white"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <div key={index} className="font-mono text-sm my-2 text-center text-slate-700 dark:text-zinc-300">
                {mathContent}
              </div>
            );
          }
        }

        // Heading 3: ### ...
        if (line.startsWith("### ")) {
          const headingText = line.replace(/^###\s+/, "");
          return (
            <h3
              key={index}
              className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white pt-2 pb-0.5 tracking-tight"
            >
              {formatInlineText(headingText)}
            </h3>
          );
        }

        // Heading 2: ## ...
        if (line.startsWith("## ")) {
          const headingText = line.replace(/^##\s+/, "");
          return (
            <h2
              key={index}
              className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-2.5 pb-1 tracking-tight"
            >
              {formatInlineText(headingText)}
            </h2>
          );
        }

        // Heading 1: # ...
        if (line.startsWith("# ")) {
          const headingText = line.replace(/^#\s+/, "");
          return (
            <h1
              key={index}
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-3 pb-1 tracking-tight"
            >
              {formatInlineText(headingText)}
            </h1>
          );
        }

        // Bullet lists: "- ", "* "
        if (/^[-*]\s+/.test(line)) {
          const bulletText = line.replace(/^[-*]\s+/, "");
          return (
            <div key={index} className="flex items-start gap-2.5 pl-1 my-1">
              <span className="text-slate-400 dark:text-zinc-500 select-none text-base leading-relaxed">•</span>
              <div className="flex-1 min-w-0">{formatInlineText(bulletText)}</div>
            </div>
          );
        }

        // Numbered list: "1. ", "2. ", etc.
        const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const itemText = numMatch[2];
          return (
            <div key={index} className="flex items-start gap-2 pl-1 my-1">
              <span className="font-mono text-sm text-slate-500 dark:text-zinc-400 select-none w-5 pt-0.5 shrink-0">
                {num}.
              </span>
              <div className="flex-1 min-w-0">{formatInlineText(itemText)}</div>
            </div>
          );
        }

        // Callout box if starts with 💡, 📌, ⚠️, 🎉
        if (line.startsWith("💡") || line.startsWith("📌") || line.startsWith("⚠️")) {
          return (
            <div
              key={index}
              className="my-3 p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 text-[14.5px] leading-relaxed shadow-sm"
            >
              {formatInlineText(line)}
            </div>
          );
        }

        // Regular paragraph line
        return (
          <p key={index} className="leading-relaxed">
            {formatInlineText(line)}
          </p>
        );
      })}
    </div>
  );
}
