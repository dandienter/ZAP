"use client";

import React, { Suspense } from "react";

// MathView (KaTeX) dimuat lazy: langkah coretan dan baris diagnosis hanya
// muncul sesudah interaksi pengguna, jadi chunk KaTeX tidak perlu ikut
// dalam muatan awal halaman chat.
const MathView = React.lazy(() => import("@/components/MathView"));

interface LazyMathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

export default function LazyMathView({ math, block = false, className = "" }: LazyMathViewProps) {
  return (
    <Suspense
      fallback={<span className={`font-mono text-sm ${className}`}>{math}</span>}
    >
      <MathView math={math} block={block} className={className} />
    </Suspense>
  );
}
