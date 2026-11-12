import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dokumentasi ChatZAP - Cara kerja, algoritma, dan API",
  description:
    "Dokumentasi lengkap ChatZAP: Zero-Answer Policy, mesin CAS SymPy (CFL), Smartboard geometri yang belajar dari pola, ZAP Agent Skills, dan referensi API.",
};

const parserSnippet = String.raw`def parse_single_side(side_str: str) -> sp.Expr:
    """
    Mengurai satu sisi ekspresi matematika:
    1. Validasi Whitelist terlebih dahulu (plain algebra atau safe LaTeX).
    2. Jika lolos whitelist, periksa batas aman eksponen/struktur pangkat (Anti-DoS).
    3. Eksekusi penguraian simbolik.
    Catatan Arsitektur: parse_expr memanggil eval() internal SymPy, namun hanya
    dieksekusi pada input yang telah lolos validasi whitelist dan batas eksponen.
    """
    cleaned = side_str.strip()
    if not cleaned:
        raise ValueError("Ekspresi matematika tidak boleh kosong.")

    # 1. Jalur aljabar teks biasa: Whitelist diperiksa terlebih dahulu
    if _is_plain_algebra(cleaned):
        if _has_dangerous_exponents(cleaned):
            raise ValueError("Eksponen melebihi batas aman (maks 100) atau pangkat bertingkat")
        try:
            return parse_expr(cleaned, transformations=TRANSFORMATIONS)
        except AssertionError:
            raise  # Anti-Masking: AssertionError tidak boleh ditelan except generik
        except Exception as err:
            raise ValueError(f"Gagal mengurai aljabar '{side_str}': {err}")`;

const geometrySnippet = String.raw`// Urutan penalaran permintaan geometri di ChatZAP (satu arah, fail-closed):
// 1. Resolver deterministik (geometry-database.ts)
//    - extractPolygonSides: angka 1-3 digit, kata bilangan (tiga - dua belas),
//      nama poligon ID/EN. "persegi" dijaga agar tidak terbaca sebagai "segi".
//    - extractLabeledParams: sisi/rusuk -> s, tinggi -> t, jari-jari -> r,
//      diameter -> r/2, panjang -> p, lebar -> l.
//    - Prioritas keluarga: limas/piramida diperiksa SEBELUM prisma.
//    - Builder generik segi 3-12: limasPoligonResult, prismaPoligonResult,
//      poligon2DResult.
// 2. Pola yang sudah dipelajari (backend: tabel geometry_patterns)
//    - Pencocokan containment / overlap token >= 0,8 DENGAN penjaga angka:
//      himpunan angka pada frasa harus persis sama (segi 8 != segi 9).
// 3. LLM menalar GeometrySpec JSON terstruktur (bukan menggambar langsung):
//    { family: "prisma" | "limas" | "poligon" | "entity" | "none",
//      sides, entity_id, params, reason }
// 4. validateGeometrySpec memutuskan: poligon wajib sides integer 3-12,
//    entity wajib ID yang dikenal, parameter wajib finite, > 0, <= 100000.
// 5. Spec yang lolos dibangun dengan builder yang sama seperti langkah 1,
//    lalu disimpan sebagai pola baru. Spec yang gagal = klarifikasi jujur,
//    tidak ada bangun pengganti yang dikarang.`;

const harnessSnippet = String.raw`# ZAP Agent Skills - alur belajar harness (backend/data_engine/agent_harness.py)
# 1. Kandidat soal masuk dari percakapan pengguna atau impor korpus.
# 2. Kandidat WAJIB lolos verifikasi CAS (SymPy) sebelum dipromosikan:
#    langkah-langkah pengerjaan dicek satu per satu terhadap kebenaran aljabar.
# 3. Yang lolos naik tier (candidate -> verified) dan tersimpan di SQLite
#    zap_math_corpus.db; yang gagal tetap candidate dan tidak pernah
#    disajikan sebagai soal terverifikasi.
# 4. Endpoint belajar/pola bersifat secret-gated (header X-Harness-Secret)
#    dan fail-closed: tanpa secret yang benar server menjawab 503.
# 5. Statistik publik (GET /api/v1/harness/stats) hanya membaca agregat:
#    jumlah record, distribusi tier, dan jumlah pola geometri.`;

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden my-4">
      <div className="px-4 py-2 bg-zinc-100 dark:bg-white/[0.05] text-[11px] font-mono text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10">
        {title}
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed bg-[#0c0d10] text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 py-8 border-b border-zinc-200/70 dark:border-white/[0.07]">
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">{title}</h2>
      <div className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300 space-y-3">{children}</div>
    </section>
  );
}

const endpoints: Array<[string, string, string]> = [
  ["POST", "/api/v1/verify", "Verifikasi satu langkah pengerjaan siswa terhadap CAS. Mengembalikan status langkah dan diagnosis deterministik, tanpa jawaban akhir."],
  ["GET", "/api/v1/harness/stats", "Agregat korpus: jumlah record per tier dan jumlah pola geometri yang dipelajari."],
  ["POST", "/api/v1/harness/geometry-match", "Mencocokkan frasa permintaan geometri ke pola yang sudah dipelajari (dengan penjaga angka)."],
  ["POST", "/api/v1/harness/geometry-pattern", "Menyimpan pola geometri baru yang sudah lolos validator. Wajib header X-Harness-Secret."],
  ["GET", "/api/v1/harness/geometry-patterns", "Daftar pola geometri yang tersimpan."],
  ["WS", "/api/v1/board/{room}", "Kolaborasi papan tulis waktu-nyata: coretan, catatan rumus, state bangun, daftar hadir, dan kursor berwarna per pengguna. Kode ruang adalah kunci aksesnya."],
  ["POST", "/api/chat", "Rute percakapan utama (streaming). Seluruh keluaran melewati RobustZeroAnswerGuardrail sebelum dikirim ke pengguna."],
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0c0d10] text-zinc-800 dark:text-zinc-200">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#faf9f6]/85 dark:bg-[#0c0d10]/85 border-b border-zinc-200/70 dark:border-white/[0.07]">
        <div className="max-w-4xl mx-auto px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="w-7 h-7 rounded-lg bg-[#09090b] text-white flex items-center justify-center text-sm font-black">
              Z
            </span>
            <span>
              ChatZAP <span className="text-zinc-400 font-normal">/ Dokumentasi</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.06] transition-colors">
              Beranda
            </Link>
            <Link
              href="/chat"
              className="px-3.5 py-1.5 rounded-full bg-[#09090b] text-white dark:bg-white dark:text-zinc-900 font-medium"
            >
              Buka Chat
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 pb-20">
        <div className="pt-12 pb-4">
          <p className="text-[12px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
            Dokumentasi resmi - chatzap.web.id
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Cara ChatZAP bekerja, sampai ke algoritmanya
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-2xl">
            ChatZAP adalah tutor matematika dengan satu aturan yang tidak bisa ditawar: sistem tidak pernah
            memberikan jawaban akhir soal latihan siswa. Halaman ini menjelaskan arsitektur, algoritma inti,
            kode sumber kuncinya, dan referensi API secara terbuka - termasuk batas-batas yang diakui sistem.
          </p>
          <nav className="mt-6 flex flex-wrap gap-1.5 text-[12.5px]">
            {[
              ["#zap", "Zero-Answer Policy"],
              ["#arsitektur", "Arsitektur"],
              ["#cfl", "Algoritma CFL"],
              ["#smartboard", "Smartboard"],
              ["#skills", "ZAP Agent Skills"],
              ["#api", "Referensi API"],
              ["#keamanan", "Keamanan"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-amber-400/60 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <Section id="zap" title="1. Zero-Answer Policy (kebijakan tanpa jawaban)">
          <p>
            Setiap komponen ChatZAP - prompt LLM, rute chat, dan papan tulis - dilarang mengeluarkan solusi
            akhir dari soal latihan siswa. Yang diberikan sistem adalah pertanyaan Sokratik, petunjuk arah,
            dan diagnosis pada langkah yang sedang dikerjakan siswa.
          </p>
          <p>
            Penegakannya bukan sekadar instruksi di prompt. Seluruh keluaran percakapan melewati
            <strong> RobustZeroAnswerGuardrail.sanitize(..., final_solution=...)</strong>: bila teks keluaran
            mengandung solusi akhir yang diketahui CAS, teks itu disunting sebelum sampai ke pengguna. Uji
            ketat internal (12 skenario: permintaan jawaban langsung, jailbreak, role-play guru, borongan tiga
            soal, jebakan konfirmasi, dan lainnya) menunjukkan kebijakan ini bertahan di mode Standard dan
            Strict.
          </p>
        </Section>

        <Section id="arsitektur" title="2. Arsitektur: CAS memutuskan, LLM menerjemahkan">
          <p>
            ChatZAP memisahkan dua hal yang sering dicampur sistem lain:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Tier kebenaran (backend):</strong> SymPy Computer Algebra System di paket <em>cfl/</em>{" "}
              adalah satu-satunya penentu benar-salah aljabar: kesetaraan langkah, kekekalan akar, dan contoh
              penyangkal. Tidak ada LLM yang boleh memutuskan validitas langkah siswa.
            </li>
            <li>
              <strong>Tier percakapan (frontend/API):</strong> LLM hanya menerjemahkan temuan diagnosis
              deterministik menjadi pertanyaan Sokratik yang empatik, dalam Bahasa Indonesia.
            </li>
            <li>
              <strong>Smartboard:</strong> papan 2D/3D yang digambar dari resolver deterministik dan pola
              yang dipelajari, bukan dari gambar karangan model.
            </li>
          </ul>
        </Section>

        <Section id="cfl" title="3. Algoritma CFL: parser yang aman sebelum pintar">
          <p>
            Karena <em>parse_expr</em> SymPy memanggil <em>eval()</em> di dalamnya, urutan pemeriksaan pada
            parser CFL bersifat wajib dan tidak boleh dibalik:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Whitelist dulu: input harus lolos <em>_is_plain_algebra()</em> atau <em>_is_safe_latex()</em>.</li>
            <li>Batas eksponen: maksimal 100 dan tanpa pangkat bertingkat seperti (9^9)^9 (anti-DoS).</li>
            <li>Baru kemudian <em>parse_expr()</em> / <em>parse_latex()</em> dijalankan.</li>
            <li>
              <em>AssertionError</em> selalu di-raise ulang sebelum <em>except Exception</em> generik, agar
              kegagalan internal tidak tersamar menjadi lolos uji (aturan Anti-Masking).
            </li>
          </ol>
          <CodeBlock title="backend/cfl/parser.py - parse_single_side (kode asli, diringkas)" code={parserSnippet} />
          <p>
            Cakupan yang diakui: polinomial dan ekspresi rasional satu variabel. Di luar itu sistem menjawab
            dengan klarifikasi, bukan dengan tebakan.
          </p>
        </Section>

        <Section id="smartboard" title="4. Smartboard: chat diproses dulu, papan belakangan">
          <p>
            Permintaan seperti &quot;buatkan limas segienam sisi 6 tinggi 10&quot; tidak langsung menggambar.
            Pesan diproses berlapis: resolver deterministik, pola yang pernah dipelajari, penalaran LLM dalam
            bentuk spec JSON terstruktur, lalu validator deterministik yang memutuskan apakah bangun boleh
            dibuat. LLM mengusulkan, mesin memutuskan.
          </p>
          <CodeBlock title="frontend/data/geometry-database.ts + backend - alur resolver geometri" code={geometrySnippet} />
          <p>
            Di dalam papan, alat <strong>Tulis</strong> bersifat teks apa adanya: ketikan biasa tampil sebagai
            teks biasa, dan ketikan yang terbaca sebagai rumus otomatis dirender KaTeX. Catatan yang dipilih
            menawarkan konversi dua arah (Jadikan KaTeX / Teks biasa) serta transformasi ke grafik 2D, model
            3D, atau diagram jaring-jaring bila isinya memang menyebut bangun.
          </p>
          <p>
            Papan juga mendukung kolaborasi waktu-nyata: tombol Bagikan membuat ruang berkode 6 karakter;
            siapa pun yang membuka tautan ruang ikut menggambar dengan kursor berwarna dan namanya sendiri.
            Kode ruang adalah satu-satunya kunci akses, dan itu dinyatakan terbuka di antarmuka.
          </p>
        </Section>

        <Section id="skills" title="5. ZAP Agent Skills: korpus yang belajar, dengan gerbang CAS">
          <p>
            ZAP Agent Skills adalah lapisan keterampilan agen untuk melatih dan mengumpulkan sumber belajar
            secara berkelanjutan. Korpus soal dibangun dari sumber terbuka berlisensi jelas dan disimpan
            sebagai JSONL kanonik (12.428 record pada rilis dokumentasi ini):
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>OpenAI GSM8K (MIT) - 8.187 record</li>
            <li>MATH Dataset, Hendrycks et al. (MIT) - 2.796 record</li>
            <li>NuminaMath-CoT, Project Numina (Apache-2.0) - 1.323 record</li>
            <li>Sisanya: generated_local, GSM8K Reasoning, Wikimedia Mathematical Knowledge Graph, dan promosi self-learning terverifikasi</li>
          </ul>
          <p>
            Angka 12.428 juga tampil langsung di beranda dan kartu korpus aplikasi - diambil dari endpoint
            statistik yang sama, bukan angka salinan.
          </p>
          <CodeBlock title="backend/data_engine/agent_harness.py - kontrak alur belajar" code={harnessSnippet} />
        </Section>

        <Section id="api" title="6. Referensi API">
          <p>
            Basis API produksi berjalan di <strong>api.chatzap.web.id</strong>; pada demo publik, rute yang
            sama tersedia di bawah awalan <em>/cas</em>. Endpoint inti:
          </p>
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden my-4">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-zinc-100 dark:bg-white/[0.05] text-left">
                  <th className="px-4 py-2.5 font-semibold w-16">Metode</th>
                  <th className="px-4 py-2.5 font-semibold w-64">Jalur</th>
                  <th className="px-4 py-2.5 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map(([m, path, desc]) => (
                  <tr key={path} className="border-t border-zinc-200/70 dark:border-white/[0.06] align-top">
                    <td className="px-4 py-2.5 font-mono text-amber-700 dark:text-amber-300">{m}</td>
                    <td className="px-4 py-2.5 font-mono break-all">{path}</td>
                    <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-300">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Skema permintaan verifikasi menerima kunci ganda demi kompatibilitas: <em>confirmed_steps</em>{" "}
            (utama) atau <em>lines</em> (alias), dan <em>target_variable</em> (utama) atau{" "}
            <em>target_var</em> (alias) - keduanya default None agar nilai alias tidak tertimpa.
          </p>
        </Section>

        <Section id="keamanan" title="7. Keamanan: hasil audit yang sudah diperbaiki">
          <p>
            Audit menyeluruh pada November 2026 menemukan 49 temuan (8 kritis, 16 tinggi, 17 sedang, 8
            rendah). Yang kritis sudah ditutup, antara lain: sinkronisasi pengguna kini wajib token ID Google
            (sebelumnya tanpa autentikasi), kode pemulihan statis dan secret bawaan dihapus, endpoint belajar
            harness menjadi fail-closed dengan secret, serta label verifikasi di UI sekarang benar-benar
            berasal dari hasil CAS. Klaim keamanan di halaman ini dibatasi pada fakta terukur: 116 pengujian
            otomatis lulus pada rangkaian uji backend dan platform saat dokumentasi ini ditulis.
          </p>
        </Section>

        <Section id="faq" title="8. FAQ singkat">
          <p>
            <strong>Apakah ChatZAP bisa memberi jawaban kalau diminta baik-baik?</strong>
            <br />
            Tidak. Kebijakannya berlaku di semua mode dan ditegakkan juga oleh guardrail keluaran, bukan
            hanya oleh instruksi prompt.
          </p>
          <p>
            <strong>Dari mana angka jumlah soal di beranda berasal?</strong>
            <br />
            Dari GET /api/v1/harness/stats yang membaca database korpus yang sama dengan yang dipakai sesi
            belajar.
          </p>
          <p>
            <strong>Apakah kunci API saya (BYOK) dikirim ke server ChatZAP?</strong>
            <br />
            Konektor BYOK berjalan dari peramban pengguna ke penyedia model yang dipilihnya. Halaman Konektor
            menjelaskan alur datanya sebelum kunci disimpan.
          </p>
          <p>
            <strong>Dokumentasi ini tersedia di mana lagi?</strong>
            <br />
            Halaman yang sama disiapkan untuk subdomain <strong>docs.chatzap.web.id</strong>; penyiapan DNS
            subdomain berada di tangan pemilik domain.
          </p>
        </Section>

        <footer className="pt-10 text-[12.5px] text-zinc-400 dark:text-zinc-500 flex flex-wrap items-center justify-between gap-3">
          <span>ChatZAP - LOGICODIX 2026. Dokumentasi ditulis dari kode sumber yang berjalan.</span>
          <span className="flex gap-4">
            <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">Beranda</Link>
            <Link href="/chat" className="hover:text-zinc-700 dark:hover:text-zinc-200">Chat</Link>
            <Link href="/connector" className="hover:text-zinc-700 dark:hover:text-zinc-200">Konektor</Link>
          </span>
        </footer>
      </main>
    </div>
  );
}
