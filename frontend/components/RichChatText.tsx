"use client";

import React from "react";
import katex from "katex";

interface RichChatTextProps {
  content: string;
  className?: string;
}

export default function RichChatText({ content, className = "" }: RichChatTextProps) {
  if (!content) return null;

  // Render KaTeX string safely
  const renderKatex = (math: string, displayMode: boolean, key: string | number) => {
    try {
      const html = katex.renderToString(math.trim(), {
        displayMode,
        throwOnError: false,
      });
      return (
        <span
          key={key}
          className={displayMode ? "inline-block px-1 font-medium text-slate-900 dark:text-white" : "inline-block px-0.5 font-medium text-slate-900 dark:text-white align-baseline"}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      return (
        <code key={key} className="font-mono text-sm px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-800 dark:text-zinc-200">
          {math}
        </code>
      );
    }
  };

  // Format text containing inline math $...$, bold **...**, and display math $$...$$
  const formatSegment = (text: string, baseKey: string | number): React.ReactNode => {
    if (!text) return null;

    // 1. Split by display math $$...$$ first (in case it appears inside a bullet or line)
    const dMathParts = text.split(/(\$\$[^$]+?\$\$)/g);

    return dMathParts.map((dmPart, dmIdx) => {
      const dmKey = `${baseKey}_dm_${dmIdx}`;
      if (dmPart.startsWith("$$") && dmPart.endsWith("$$") && dmPart.length >= 4) {
        return renderKatex(dmPart.slice(2, -2), false, dmKey);
      }

      // 2. Split by bold **...**
      const boldParts = dmPart.split(/(\*\*[^*]+?\*\*)/g);

      return boldParts.map((bPart, bIdx) => {
        const bKey = `${dmKey}_b_${bIdx}`;
        if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length >= 4) {
          const innerBold = bPart.slice(2, -2);
          // Inner bold may contain inline math $...$
          const innerMathParts = innerBold.split(/(\$[^$]+?\$)/g);
          return (
            <strong key={bKey} className="font-semibold text-slate-900 dark:text-white">
              {innerMathParts.map((imPart, imIdx) => {
                if (imPart.startsWith("$") && imPart.endsWith("$") && imPart.length >= 2) {
                  return renderKatex(imPart.slice(1, -1), false, `${bKey}_im_${imIdx}`);
                }
                return imPart;
              })}
            </strong>
          );
        }

        // 3. Regular text which may contain inline math $...$
        const inlineMathParts = bPart.split(/(\$[^$]+?\$)/g);
        return inlineMathParts.map((imPart, imIdx) => {
          const imKey = `${bKey}_im_${imIdx}`;
          if (imPart.startsWith("$") && imPart.endsWith("$") && imPart.length >= 2) {
            return renderKatex(imPart.slice(1, -1), false, imKey);
          }

          // 4. Split italic *...*
          const italicParts = imPart.split(/(\*[^*\n]+?\*)/g);
          return italicParts.map((itPart, itIdx) => {
            if (itPart.startsWith("*") && itPart.endsWith("*") && itPart.length >= 2) {
              return (
                <em key={`${imKey}_it_${itIdx}`} className="italic text-slate-700 dark:text-zinc-300">
                  {itPart.slice(1, -1)}
                </em>
              );
            }
            return itPart;
          });
        });
      });
    });
  };

  const lines = content.split("\n");

  return (
    <div className={`space-y-2.5 text-[15.5px] leading-relaxed text-slate-800 dark:text-zinc-200 break-words [overflow-wrap:anywhere] max-w-full ${className}`}>
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();

        // Empty line
        if (!line) {
          return <div key={index} className="h-1.5" />;
        }

        // Display math standalone block: $$...$$
        if (line.startsWith("$$") && line.endsWith("$$")) {
          const mathContent = line.slice(2, -2).trim();
          return (
            <div
              key={index}
              className="my-3 overflow-x-auto py-2 text-center text-slate-900 dark:text-white text-base"
            >
              {renderKatex(mathContent, true, `block_${index}`)}
            </div>
          );
        }

        // Heading 3: ### ...
        if (line.startsWith("### ")) {
          const headingText = line.replace(/^###\s+/, "");
          return (
            <h3
              key={index}
              className="text-base sm:text-[17px] font-semibold text-slate-900 dark:text-white pt-2.5 pb-0.5 tracking-tight"
            >
              {formatSegment(headingText, `h3_${index}`)}
            </h3>
          );
        }

        // Heading 2: ## ...
        if (line.startsWith("## ")) {
          const headingText = line.replace(/^##\s+/, "");
          return (
            <h2
              key={index}
              className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-3 pb-1 tracking-tight"
            >
              {formatSegment(headingText, `h2_${index}`)}
            </h2>
          );
        }

        // Heading 1: # ...
        if (line.startsWith("# ")) {
          const headingText = line.replace(/^#\s+/, "");
          return (
            <h1
              key={index}
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-3.5 pb-1 tracking-tight"
            >
              {formatSegment(headingText, `h1_${index}`)}
            </h1>
          );
        }

        // Bullet lists: "- ", "* "
        if (/^[-*]\s+/.test(line)) {
          const bulletText = line.replace(/^[-*]\s+/, "");
          return (
            <div key={index} className="flex items-start gap-2.5 pl-1 my-1">
              <span className="text-slate-400 dark:text-zinc-500 select-none text-base leading-relaxed shrink-0">•</span>
              <div className="flex-1 min-w-0">{formatSegment(bulletText, `li_${index}`)}</div>
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
              <div className="flex-1 min-w-0">{formatSegment(itemText, `ol_${index}`)}</div>
            </div>
          );
        }

        // Callout box if starts with 💡, 📌, ⚠️, 🎉
        if (line.startsWith("💡") || line.startsWith("📌") || line.startsWith("⚠️")) {
          return (
            <div
              key={index}
              className="my-3 p-3.5 sm:p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] backdrop-blur-md border border-slate-200/70 dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 text-[15px] leading-relaxed shadow-sm"
            >
              {formatSegment(line, `callout_${index}`)}
            </div>
          );
        }

        // Regular paragraph line
        return (
          <p key={index} className="leading-relaxed">
            {formatSegment(line, `p_${index}`)}
          </p>
        );
      })}
    </div>
  );
}
