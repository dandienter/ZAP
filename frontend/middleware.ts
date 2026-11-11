import { NextRequest, NextResponse } from "next/server";

// Tamu tanpa sesi yang membuka /chat langsung diarahkan server ke /login.
// Sebelumnya pengalihan ini terjadi di klien sesudah bundle chat (besar)
// dimuat dan dihidrasi, sehingga halaman terasa lambat dan LCP buruk.
// Keberadaan sesi dibaca dari cookie cermin zap_session yang disetel saat
// sesi lokal dibuat (lihat lib/session-cookie.ts). Cookie bukan kredensial;
// gerbang autentikasi di halaman chat tetap berjalan seperti biasa.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isChatPath = pathname === "/chat" || pathname.startsWith("/chat/");
  if (isChatPath && !req.cookies.get("zap_session")) {
    // Bangun URL publik dari header proksi: di belakang reverse proxy,
    // nextUrl bisa berisi alamat internal (localhost:port) yang tidak
    // bisa dibuka peramban pengguna.
    const host =
      req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
    const proto =
      req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "");
    return NextResponse.redirect(`${proto}://${host}/login`);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/chat", "/chat/:path*"],
};
