"use client";

import React, { Suspense } from "react";
import PlainChatText from "./PlainChatText";

// Chunk RichChatText (termasuk KaTeX) hanya dimuat saat benar-benar ada
// pesan yang mengandung markdown/rumus. Halaman chat yang baru dibuka
// (belum ada pesan) tidak membayar biaya muat + parse chunk ini sama sekali.
const RichChatText = React.lazy(() => import("@/components/RichChatText"));

// Penanda yang membuat RichChatText memberi hasil berbeda dari teks polos:
// rumus $...$, tebal **...**, heading, daftar berpoin, dan daftar bernomor.
const RICH_PATTERN = /\$|\*\*|^\s{0,3}#{1,3}\s|^\s*[-*]\s|^\s*\d+\.\s/m;

interface LazyRichTextProps {
  content: string;
  className?: string;
}

export default function LazyRichText({ content, className = "" }: LazyRichTextProps) {
  if (!content) return null;

  // Pesan teks biasa tampil seketika dari renderer polos, tanpa memuat
  // chunk KaTeX sama sekali.
  if (!RICH_PATTERN.test(content)) {
    return <PlainChatText content={content} className={className} />;
  }

  return (
    <Suspense fallback={<PlainChatText content={content} className={className} />}>
      <RichChatText content={content} className={className} />
    </Suspense>
  );
}
