"use client";

import React from "react";
import katex from "katex";

interface RichChatTextProps {
  content: string;
  className?: string;
}

export default function RichChatText({ content, className = "" }: RichChatTextProps) {
  if (!content) return null;

  const renderFormattedLine = (line: string) => {
    // 1. Tangani block math $$...$$ jika ada di baris tersebut
    if (line.trim().startsWith("$$") && line.trim().endsWith("$$")) {
      const mathContent = line.trim().slice(2, -2).trim();
      try {
        const html = katex.renderToString(mathContent, {
          displayMode: true,
          throwOnError: false,
        });
        return (
          <div
            className="my-2 overflow-x-auto py-1 text-center"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        return <div className="font-mono text-xs">{mathContent}</div>;
      }
    }

    // 2. Tangani inline math $...$
    const parts = line.split(/(\$[^$\n]+?\$)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const mathContent = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(mathContent, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={idx}
              className="inline-block px-0.5 text-zinc-100 font-medium"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <code key={idx} className="font-mono text-xs text-zinc-300">
              {mathContent}
            </code>
          );
        }
      }

      // 3. Tangani teks tebal **text**
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={idx}>
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length > 4) {
              return (
                <strong key={bIdx} className="font-semibold text-zinc-100">
                  {bPart.slice(2, -2)}
                </strong>
              );
            }
            return bPart;
          })}
        </span>
      );
    });
  };

  const lines = content.split("\n");

  return (
    <div className={`space-y-1.5 leading-relaxed text-xs text-zinc-200 ${className}`}>
      {lines.map((ln, i) => {
        if (!ln.trim()) {
          return <div key={i} className="h-1.5" />;
        }
        return <div key={i}>{renderFormattedLine(ln)}</div>;
      })}
    </div>
  );
}
