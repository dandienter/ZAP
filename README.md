# ZAP (Zero Answer Policy) — Interactive 3D Canvas & Socratic Math Engine

[![Logicodix 2026](https://img.shields.io/badge/LOGICODIX-2026-1E3A8A?style=for-the-badge&logo=codeforces&logoColor=white)](https://github.com/[your-team]/zap)
[![Subtheme](https://img.shields.io/badge/Subtheme-Smart_%26_Fun_Education-0D9488?style=for-the-badge)](https://github.com/[your-team]/zap)
[![License: MIT](https://img.shields.io/badge/License-MIT-38BDF8?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web--First_(Projector_%26_Smartboard)-2563EB?style=for-the-badge)](https://github.com/[your-team]/zap)
[![Pytest Passing](https://img.shields.io/badge/Pytest-65%2F65_Passing-059669?style=for-the-badge)](backend/tests/)

> **"Don't give them answers. Project the wonder to discover."**  
> ZAP adalah platform pembelajaran matematika *Web-First* yang mengubah rumus dan persamaan aljabar menjadi **bangun ruang 3D interaktif secara real-time** (Three.js/WebGL), dipandu oleh **Tutor Sokratik berpagar Zero Answer Policy**, dan diverifikasi kebenaran matematisnya secara deterministik oleh mesin aljabar simbolik (**SymPy**).

---

## 🌟 Mengapa ZAP Berbeda?

Terinspirasi dari teknologi *Interactive Smart Board* di Tiongkok yang memvisualisasikan kalkulus dan geometri secara instan, ZAP mendemokratisasikannya menjadi aplikasi web terbuka yang kompatibel dengan **proyektor gantung InFocus sekolah negeri** maupun **Smart Board layar sentuh interaktif**.

| Fitur / Pendekatan | Answer Engines Umum (Photomath, ChatGPT) | Papan Tulis Konvensional / GeoGebra | **ZAP (Zero Answer Policy)** |
| :--- | :--- | :--- | :--- |
| **Pedagogi** | Bocor jawaban instan (*Cognitive Bypassing*) | Alat pasif tanpa bimbingan | **Tutor Sokratik Murni (Zero Answer Policy)** |
| **Visualisasi Ruang** | Teks kaku 2D | Manual 2D / Formula statis | **Dynamic 3D Canvas Real-Time (Three.js)** |
| **Akurasi Hitung** | Rentan halusinasi angka/vektor | Tergantung input pengguna | **Deterministik via SymPy CAS Engine** |
| **Aksesibilitas Kelas** | Smartphone personal | Papan tulis manual | **Web-First (Proyektor Gantung &amp; Smart Board)** |
| **Model Integrasi AI** | Berlangganan API mahal terpusat | Tanpa AI | **1-Click Connect (Google SSO &amp; ChatGPT)** |

---

## 🏗️ Arsitektur Sistem 3-Tier

ZAP mengusung arsitektur **Strict Separation of Concerns** yang memisahkan ranah persepsi visual, ranah kebenaran matematika deterministik, dan ranah pedagogis Sokratik:

```
[ Siswa / Guru ] ──► [ Web Presentation Tier (Next.js 14 + Three.js 3D Canvas) ]
                               │                              │
         (Kueri Aljabar & Mesh)│                              │(1-Click Token SSO)
                               ▼                              ▼
               [ Deterministic Truth Tier ]          [ Pedagogical AI Tier ]
               (FastAPI + SymPy CAS Microservice)    (Gemini 3.6 Flash / 3.8 / 4 Argon / ChatGPT)
                               │                              │
                               └──► [ Zero-Answer Guardrail ] ◄──┘
                                              │
                                              ▼
                             [ Socratic Guidance & 3D Mesh ]
```

1. **Client Presentation Tier (Next.js 14 + Three.js / React Three Fiber):**
   * Merender aljabar, kalkulus, dan bangun ruang 3D secara *real-time*.
   * Mendukung mode ganda: **Mode Proyektor Gantung** (kendali mouse/keyboard/presenter clicker) dan **Mode Smart Board IFP** (*multi-touch gesture* & coretan stylus).
2. **Deterministic Truth Tier (`backend/cfl` - SymPy CAS Microservice):**
   * Arbiter tunggal kebenaran matematika: menyederhanakan aljabar, mendeteksi kehilangan akar (`ROOT_LOSS`), menghitung irisan bidang, dan menghasilkan koordinat *vertex/face* poligon 3D.
   * Melindungi model AI dari halusinasi: AI tidak dibebani komputasi angka.
3. **Pedagogical AI Layer (Google OAuth 1-Click SSO &amp; ChatGPT Connect):**
   * Pengguna cukup masuk dengan 1-klik akun Google mereka (otomatis mengaktifkan Google Gemini tanpa setup manual).
   * Menerjemahkan data diagnosa SymPy menjadi pertanyaan pemantik yang santun dan memicu penemuan mandiri (*Aha! Moment*).

---

## 📁 Struktur Repositori Terorganisir

```text
logicodix/
├── backend/                  # Layanan Backend FastAPI & Python
│   ├── cfl/                  # Cognitive Fault Localization & SymPy Engine
│   ├── data_engine/          # Pipeline Harvester & Kurikulum Matematika
│   ├── zapcore/              # Auth SSO, Enkripsi AES-256-GCM, Gateway AI & Privasi
│   ├── tests/                # Test suite verifikasi aljabar deterministik (23 tests)
│   ├── tests_platform/       # Test suite platform, enkripsi, dan API gateway (42 tests)
│   ├── main.py               # Entry point Microservice CFL (Port 8000)
│   ├── platform_main.py      # Entry point Platform Core (Port 8001)
│   └── requirements.txt      # Dependensi produksi backend
├── data/                     # Basis data geometri dan korpus matematika
├── docs/                     # Dokumentasi arsitektur, algoritma, dan blueprint
│   ├── README.md             # Indeks utama seluruh dokumentasi
│   ├── ARCHITECTURE.md       # Arsitektur sistem & diagram data flow
│   ├── ALGORITHM.md          # Spesifikasi matematika simbolik CFL
│   ├── BACKEND_SYSTEM.md     # Desain sistem backend platform
│   ├── DESIGN_SYSTEM.md      # UI/UX design tokens & dual-mode specs
│   ├── DATA_AND_LEARNING_POLICY.md # Kebijakan kurasi & data
│   ├── PRIVACY_POLICY.md     # Kebijakan privasi resmi
│   ├── TERMS_OF_SERVICE.md   # Ketentuan penggunaan layanan
│   ├── ZAP_Product_Blueprint.pdf   # Blueprint resmi produk (4 halaman)
│   └── ZAP_Product_Blueprint.html  # Versi web interaktif blueprint
├── frontend/                 # Aplikasi Web Next.js 14 + Tailwind CSS + Three.js
│   ├── app/                  # App Router (Chat, Connector, Login, Unban)
│   ├── components/           # Komponen UI & Canvas 3D Interaktif
│   └── utils/                # Sinkronisasi akun, chat memory & enkripsi
├── scripts/                  # Skrip otomasi, regenerasi data & blueprint
│   ├── fetch_math_data.py    # Generator & harvester korpus matematika
│   └── generate_blueprint_pdf.py # Generator PDF blueprint resmi
├── tests/                    # Forwarder pengujian root (pytest tests/)
├── trash/                    # Arsip lokal berkas usang & non-upload (diabaikan Git)
├── .gitignore                # Pengecualian berkas sistem, trash & environment
├── AGENTS.md                 # Kontrak operasional agen AI & memori teruji
└── README.md                 # Dokumentasi utama repositori
```

---

## 🧪 Hasil Uji Otomatis (Pytest 65/65 Verified)

Rangkaian pengujian otomatis mencakup verifikasi logika simbolik, mitigasi keamanan, enkripsi AES-256-GCM, dan integrasi API:

### A. Core Symbolic Reasoning (`backend/tests/` - 23 Tests)
* ✅ **Ekspansi Kuadrat:** Mendeteksi hilangnya suku perkalian silang pada $(x+3)^2 - 4$ (kontra-contoh terhitung: $21 \neq 9$).
* ✅ **Persamaan Linear Valid:** Memvalidasi manipulasi ruas $2x + 3 = 7 \rightarrow 2x = 4 \rightarrow x = 2$.
* ✅ **Persamaan Linear Galat:** Mendeteksi kesalahan tanda saat pindah ruas $2x + 3 = 7 \rightarrow 2x = 10$.
* ✅ **Deteksi Kehilangan Akar:** Mendeteksi hilangnya akar negatif pada $x^2 = 4 \rightarrow x = 2$ (`ROOT_LOSS`).
* ✅ **Penanganan ConditionSet:** Menangani persamaan transendental $\sin(x) = x$ secara aman sebagai `UNDECIDABLE_STEP`.
* ✅ **Sanitasi Whitelist (Anti-RCE Security):** `parse_expr` hanya dipanggil jika input lolos whitelist karakter dan identifier; payload injeksi Python (`__import__`, `eval`, `open`, `__builtins__`) ditolak sebelum dievaluasi.
* ✅ **Penolakan LaTeX Non-Matematika:** Jalur fallback `parse_latex` memblokir perintah sistem berbahaya seperti `\input{/etc/passwd}` dan `\write18{echo hi}`.
* ✅ **Pertahanan Anti-DoS (Exponential Limiter):** Menolak eksponen numerik > 100 dan rantai pangkat bertingkat ($9^{9^9}$, $(9^9)^9$, $2^{100000000000}$) dalam sub-milidetik (< 1 ms).
* ✅ **Verifikasi Intersepsi Monkeypatch:** Membuktikan secara deterministik bahwa payload berbahaya ditolak pada tahap pra-parse dan sama sekali tidak pernah menyentuh fungsi parser `parse_expr` maupun `parse_latex` SymPy.
* ✅ **Regresi Guardrail:** Memastikan kalimat edukatif seperti `"Jika x = 2"` dan `"baris ke-2"` tidak tersensor keliru.
* ✅ **Pencegahan Kebocoran Jawaban:** Menyaring pernyataan deklaratif jawaban final `"jawaban akhirnya adalah x = 2"`.
* ✅ **Masking Kunci Eksplisit:** Menguji penyaringan pada `"Kunci adalah 5"` tanpa merusak frasa kontekstual `"baris ke-5"`.
* ✅ **Penyaringan Diagonal Geometri:** Memastikan angka diagonal bidang/ruang kalkulasi disaring tanpa membocorkan jawaban akhir.

### B. Platform Security, Vault & Gateway (`backend/tests_platform/` - 42 Tests)
* ✅ **Autentikasi Google SSO Terverifikasi Server:** Validasi tokeninfo Google, audiens, issuer, dan masa berlaku JWT.
* ✅ **Enkripsi AES-256-GCM:** Verifikasi master vault roundtrip, isolasi per-pengguna, dan kestabilan pseudonim.
* ✅ **Gateway Multi-Model AI:** Penanganan fallback Google Gemini, OpenAI, dan Anthropic via BYOK.
* ✅ **Privasi & Ekspor Data:** Verifikasi ekspor data terenkripsi pengguna dan penghapusan menyeluruh (*right to be forgotten*).
* ✅ **Self-Learning Flywheel:** Pipa kurasi bertahap berpagar SymPy, filter PII NIK/Email, dan persetujuan eksplisit.

```powershell
# Jalankan seluruh rangkaian uji (65/65 lolos)
python -m pytest -v -p no:cacheprovider tests/
python -m pytest -v -p no:cacheprovider backend/tests_platform/
```

---

## 🚀 Panduan Menjalankan di Localhost

### Lingkungan Runtime:
* **Python Runtime:** Python **3.15.1** (Windows x86-64).
* **Node.js Runtime:** Node.js **v24.x** (Next.js 14).

### 1. Setup Backend (FastAPI + SymPy)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest -v -p no:cacheprovider tests/
uvicorn main:app --reload --port 8000
```

### 2. Setup Frontend (Next.js 14 + Three.js)
```powershell
cd frontend
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 📚 Indeks Dokumentasi & Blueprint Produk

Kunjungi folder [`docs/`](docs/) untuk membaca dokumentasi lengkap:
* 📖 [**Indeks Dokumentasi Lengkap**](docs/README.md)
* 🏛️ [**Arsitektur Sistem (ARCHITECTURE.md)**](docs/ARCHITECTURE.md)
* 📐 [**Algoritma Penalaran Simbolik (ALGORITHM.md)**](docs/ALGORITHM.md)
* 💻 [**Sistem Backend & Gateway (BACKEND_SYSTEM.md)**](docs/BACKEND_SYSTEM.md)
* 🎨 [**Design System & UI/UX (DESIGN_SYSTEM.md)**](docs/DESIGN_SYSTEM.md)
* 🔒 [**Kebijakan Privasi (PRIVACY_POLICY.md)**](docs/PRIVACY_POLICY.md)
* 📄 [**ZAP_Product_Blueprint.pdf**](docs/ZAP_Product_Blueprint.pdf) *(PDF 4 Halaman, Light Mode Minimalis)*
* 🌐 [**ZAP_Product_Blueprint.html**](docs/ZAP_Product_Blueprint.html) *(Edisi Web Interaktif)*
