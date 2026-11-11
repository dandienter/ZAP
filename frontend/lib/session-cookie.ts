// Cermin cookie ringan untuk keberadaan sesi lokal (localStorage
// "zap_authenticated_user"). Dipakai middleware agar tamu tanpa sesi yang
// membuka /chat langsung diarahkan server ke /login, tanpa menunggu bundle
// chat dimuat dan gerbang klien berjalan. Cookie ini BUKAN kredensial:
// isinya hanya penanda "1" dan tidak pernah dipakai untuk autentikasi API.
export function markSessionCookie(): void {
  if (typeof document !== "undefined") {
    document.cookie = "zap_session=1; path=/; max-age=2592000; samesite=lax";
  }
}

export function clearSessionCookie(): void {
  if (typeof document !== "undefined") {
    document.cookie = "zap_session=; path=/; max-age=0; samesite=lax";
  }
}
