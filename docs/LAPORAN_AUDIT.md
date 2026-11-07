# Laporan Audit & Pengembangan ZAP (Zero Answer Policy)

Tanggal: 7 November 2026
Ruang lingkup: clone repo publik wakhidpangestu/ZAP, audit frontend + backend, perbaikan UI, memory chat, canvas 3D, pembangunan backend platform, pengujian menyeluruh.
Status repo: semua perubahan masih di clone lokal, belum di-commit dan belum di-push (repo milik Wakhid, perlu koordinasi sebelum push).

## Ringkasan hasil

- Build frontend yang semula GAGAL total sekarang lolos bersih (compile, lint, type check).
- Backend: 64 dari 64 tes lolos dalam satu perintah gabungan (42 tes platform baru + 22 tes CFL asli).
- UI chat didesain ulang menjadi 3 panel simpel: sidebar sesi + riwayat, chat di tengah, papan tulis virtual 3D di kanan yang bisa layar penuh.
- Memory chat dibangun: percakapan tersimpan otomatis, bisa dibuka lagi, dan konteks ke model dibatasi 20 pesan terakhir.
- Canvas 3D ditingkatkan ala smartboard: galeri bangun ruang parametrik dengan rumus dan nilai hidup, penjelajah permukaan f(x,y), putar otomatis, target sentuh 48 px di mode proyektor.
- Backend platform baru (auth Google terverifikasi server, gateway multi-model, enkripsi AES-256-GCM, privasi + consent, pipa self-learning terkurasi) sudah jadi dan teruji dari sesi sebelumnya.

## Temuan audit dan perbaikan

### 1. Build frontend rusak (kritis) - DIPERBAIKI

`npm run build` gagal di tahap lint sehingga aplikasi tidak bisa di-deploy sama sekali. Penyebabnya 20 error lint yang menumpuk:

- app/connector/page.tsx: 5 impor ikon tidak terpakai (Key, XCircle, ShieldCheck, Layers, HelpCircle) dan 1 variabel state tidak terpakai (mistralKey).
- app/login/page.tsx: 3 impor tidak terpakai (ShieldCheck, Sparkles, Layers) dan variabel user tidak terpakai.
- app/page.tsx (landing): 6 impor tidak terpakai (Layers, GraduationCap, Users, SlidersHorizontal, EyeOff, Tv).
- components/ModelPickerWithEffort.tsx: 1 impor tidak terpakai (HelpCircle).
- app/api/chat/route.ts: 3 interface kosong yang setara supertype-nya dan 1 let yang seharusnya const.

Semua dibersihkan tanpa mengubah perilaku. Sekarang `npm run build` selesai dengan exit 0.

### 2. Memory chat tidak ada (mayor) - DIBANGUN

Sebelumnya pesan chat hanya hidup di state React. Refresh halaman berarti seluruh percakapan hilang, dan seluruh riwayat dikirim ke model tanpa batas.

Perbaikan (berkas baru frontend/utils/chat-memory.ts + integrasi di app/chat/page.tsx):

- Percakapan tersimpan otomatis ke localStorage setiap ada pesan baru, lengkap dengan konteks soal aktif dan variabel target.
- Saat halaman dibuka lagi, percakapan terakhir dipulihkan otomatis.
- Sidebar menampilkan daftar Riwayat Percakapan (judul dari pesan pertama, waktu relatif) yang bisa diklik untuk dibuka dan bisa dihapus per item.
- Batas aman: maks 30 percakapan, maks 200 pesan per percakapan, kegagalan kuota ditangani diam-diam.
- Konteks ke model dibatasi 20 pesan terakhir (windowing) agar token hemat dan fokus.

Catatan: ini memory kerja di perangkat pengguna. Penyimpanan otoritatif terenkripsi per pengguna sudah tersedia di backend platform (zapcore) dan siap dihubungkan pada tahap wiring berikutnya.

### 3. Klaim produk tidak akurat (mayor, menyangkut Invariant 5 proyek) - DIPERBAIKI

Beberapa teks di landing dan login mengklaim hal yang secara teknis salah:

- "Keamanan SHA-256" dan "enkripsi sisi klien (client-side encrypted storage)": SHA-256 adalah fungsi hash satu arah, bukan enkripsi, dan penyimpanan chat tidak terenkripsi di sisi klien. Teks diganti menjadi fakta yang benar: percakapan tersimpan terenkripsi AES-256-GCM di server platform, terkirim lewat TLS, integritas dijaga sidik jari SHA-256.
- "Login Google (Auto Gemini)": login Google tidak menyerahkan API key Gemini milik pengguna. Yang benar: Gemini disediakan dari server platform. Teks diganti "Login Google (Langsung Pakai)" dan "Gemini Platform".
- "Self-Training Flywheel" yang mengesankan sistem mengekstrak semua chat untuk melatih model: diganti penjelasan jujur bahwa hanya materi opt-in yang disaring, diverifikasi SymPy, dan dikelompokkan menjadi basis pengetahuan tutor.

### 4. UI chat ramai dan papan 3D tersembunyi (sedang) - DIREDESAIN

Mengikuti acuan tampilan simpel yang diminta pemilik proyek:

- Layout 3 panel: sidebar kiri (logo, tombol Sesi Baru, navigasi connector, model aktif, riwayat, simulasi cepat, status CAS, profil), area chat di tengah (sapaan + kartu saran saat kosong, composer membulat di bawah), dan panel kanan khusus Papan Tulis Virtual 3D.
- Papan tulis terbuka secara bawaan di layar lebar dan punya tombol layar penuh (Fullscreen API) untuk presentasi di kelas, plus tombol tutup.
- Palet disederhanakan ke nyaris hitam netral dengan aksen biru ZAP, mengurangi kebisingan visual.

### 5. Canvas 3D statis (sedang) - DITINGKATKAN

Komponen InteractiveCanvas3D sebelumnya hanya punya 5 model contoh dengan parameter terbatas. Sekarang:

- Model baru "Bangun Ruang": Kubus, Balok, Bola, Kerucut, Prisma Segitiga, Limas Segi Empat. Semua parametrik (slider sisi, jari-jari, tinggi, panjang) dengan garis tepi (edges) agar terbaca seperti di smartboard.
- Model baru "Permukaan f(x,y)": Paraboloid, Riak, Lonceng Gauss, Bidang Miring, dengan slider koefisien dan parameter.
- Panel Ukur melayang yang menampilkan rumus dan nilai yang dihitung hidup (volume dan luas permukaan berubah mengikuti slider), termasuk untuk Tabung yang sudah ada.
- Tombol Putar Otomatis untuk mode presentasi.
- Mode proyektor/papan: tombol tab dan aksi diperbesar ke target sentuh minimum 48 px sesuai design system proyek.
- Pembuangan resource GPU diperbaiki (traverse dispose termasuk garis tepi anak mesh).

### 6. Tabrakan nama berkas tes (minor) - DIPERBAIKI

backend/tests/test_api.py (suite CFL asli) dan backend/tests_platform/test_api.py (suite platform) bernama sama sehingga pytest gabungan gagal koleksi dengan "import file mismatch". Berkas platform diganti nama menjadi test_platform_api.py. Sekarang satu perintah `pytest tests_platform tests` menjalankan semua 64 tes.

### 7. Backend platform (dibangun sesi sebelumnya, diaudit ulang di sini)

Paket backend/zapcore/ + backend/platform_main.py:

- Auth: verifikasi ID token Google di server (aud, iss, exp, email_verified), sesi JWT HS256, peran siswa/mahasiswa/guru/dosen/umum dan jenjang SD sampai S3.
- Gateway AI: Gemini (kunci platform), plus connector BYOK terenkripsi AES-256-GCM untuk OpenAI, Anthropic, Mistral, DeepSeek, dan endpoint kustom kompatibel OpenAI. Keluaran tutor melewati guardrail CFL Zero Answer Policy.
- Penyimpanan SQLite: isi chat hanya ciphertext + hash SHA-256, kunci connector terenkripsi per pengguna.
- Privasi: consent berbagi versi bertanggal, ekspor data pemilik (terdekripsi untuk pemilik sendiri), hapus akun cascade, sapuan retensi, audit log pseudonim.
- Self-learning: kontribusi eksplisit (wajib consent aktif) masuk pipa sidik jari SHA-256 anti duplikat, saring PII (email dan telepon diredaksi, pola NIK ditolak), verifikasi SymPy untuk langkah aljabar atau kurasi LLM berlabel, klasifikasi topik + jenjang, terbit bila melewati ambang kualitas, dan dipakai tutor lewat retrieval.
- Dokumen: docs/BACKEND_SYSTEM.md, docs/PRIVACY_POLICY.md, docs/DATA_AND_LEARNING_POLICY.md, docs/TERMS_OF_SERVICE.md.

## Hasil pengujian

| Pemeriksaan | Hasil |
|---|---|
| npm run build (frontend) | Lolos, exit 0. Rute: / 105 kB, /chat 355 kB, /connector 112 kB, /login 106 kB (first load) |
| pytest backend (gabungan) | 64 lolos, 0 gagal (42 platform + 22 CFL) |
| Uji mutasi gerbang SymPy (sesi sebelumnya) | Gerbang dimatikan: tes langkah keliru gagal sesuai harapan. Dipulihkan: hijau lagi |
| Smoke server platform | GET /api/v1/system/health: ok, production_ready true. GET /providers: 6 provider. GET /me tanpa token: 401 dengan pesan sesi |
| Smoke frontend (next start) | /, /chat, /login semuanya HTTP 200 |
| Validasi konfigurasi | Server platform menolak start bila kunci master bukan 32 byte base64 (perilaku aman yang diharapkan) |

## Cara mencoba

Frontend:

```bash
cd frontend
npm install
npm run dev
# buka http://localhost:3000/chat
```

Backend CFL (diagnosis SymPy, port 8000):

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --port 8000
```

Backend platform (auth, gateway, privasi, learning, port 8001):

```bash
cd backend
# buat kunci master: python -c "import base64,os;print(base64.b64encode(os.urandom(32)).decode())"
export ZAP_MASTER_KEY=<hasil base64 32 byte>
export ZAP_JWT_SECRET=<rahasia acak panjang>
export ZAP_GOOGLE_CLIENT_ID=<client id Google OAuth>
export ZAP_GEMINI_API_KEY=<kunci Gemini platform>   # opsional, untuk jalur bawaan
uvicorn platform_main:app --port 8001
```

## Sisa pekerjaan yang jujur

- Halaman /chat dan /connector masih memakai route bawaan Next (/api/chat) dan kunci BYOK di localStorage. Backend platform zapcore sudah menyediakan endpoint pengganti yang terenkripsi di server, tetapi wiring frontend ke sana belum dikerjakan. Ini langkah lanjutan paling bernilai berikutnya.
- Login Google di frontend masih memverifikasi token di sisi klien untuk sesi UI. Verifikasi otoritatif sudah ada di backend platform dan akan mengambil alih saat wiring dilakukan.
- Belum ada deploy. Semua hasil masih di clone lokal dan belum di-commit, menunggu koordinasi dengan pemilik repo.
- Pemeriksaan visual halaman /chat dilakukan lewat build + HTTP smoke. Uji perangkat sentuh fisik (smartboard asli) belum dilakukan.

## Tiga koreksi teknis yang menjadi dasar desain

1. SHA-256 adalah hash satu arah, bukan enkripsi. Enkripsi chat memakai AES-256-GCM, dan SHA-256 dipakai untuk sidik jari, integritas, dan pseudonim.
2. Enkripsi end-to-end murni tidak kompatibel dengan tutor LLM di server dan self-learning, karena server harus membaca isi untuk memprosesnya. Yang diterapkan: TLS saat transit, AES-256-GCM saat tersimpan, consent eksplisit untuk pembelajaran.
3. Login Google tidak memberikan API key Gemini pengguna (tidak ada mekanisme publiknya). Pengalaman "login langsung bisa chat" dicapai dengan kunci platform di server, dan BYOK tetap tersedia sebagai connector.
