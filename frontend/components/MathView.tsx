"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

export default function MathView({ math, block = false, className = "" }: MathViewProps) {
  const html = useMemo(() => {
    if (!math || !math.trim()) return "";
    try {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: block,
      });
    } catch {
      return "";
    }
  }, [math, block]);

  if (!html) {
    return <span className={`font-mono text-sm ${className}`}>{math}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
