// Kerangka muat server-rendered untuk /chat: tampil seketika dari HTML awal
// selagi bundle klien chat dimuat dan dihidrasi, sehingga cat pertama dan
// LCP tidak menunggu JavaScript. Struktur meniru cangkang aplikasi asli
// (bilah samping + area percakapan) agar tidak ada pergeseran tata letak.
export default function ChatLoading() {
  return (
    <div className="flex h-screen w-full bg-[#faf9f6] text-zinc-900" aria-busy="true" aria-label="Memuat ChatZAP">
      <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-zinc-200 bg-white/70 p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-serif font-black text-lg">
            Z
          </div>
          <div>
            <p className="font-serif font-bold leading-none">ChatZAP</p>
            <p className="text-[11px] text-zinc-500 mt-1">Tutor Penalaran Sokratik</p>
          </div>
        </div>
        <div className="mt-6 h-10 rounded-xl bg-zinc-900/90" />
        <div className="mt-6 space-y-2.5">
          <div className="h-4 rounded bg-zinc-200/80 w-3/4" />
          <div className="h-4 rounded bg-zinc-200/60 w-2/3" />
          <div className="h-4 rounded bg-zinc-200/60 w-4/5" />
          <div className="h-4 rounded bg-zinc-200/40 w-1/2" />
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-zinc-200 bg-white/70 flex items-center px-4 gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-serif font-black md:hidden">
            Z
          </div>
          <p className="font-serif font-bold">ChatZAP</p>
          <span className="text-xs text-zinc-500">Memuat ruang belajarmu…</span>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              Belajar matematika,
              <span className="block text-[#7d551f]">dipandu langkah demi langkah.</span>
            </h1>
            <p className="mt-4 text-sm text-zinc-600 leading-relaxed">
              Tutor Sokratik ZAP sedang disiapkan. Kamu akan dipandu menemukan jawabanmu sendiri, bukan diberi contekan.
            </p>
          </div>
        </div>
        <div className="p-4">
          <div className="max-w-3xl mx-auto h-14 rounded-2xl border border-zinc-200 bg-white shadow-sm" />
        </div>
      </main>
    </div>
  );
}
