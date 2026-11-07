# ZAP (Zero Answer Policy) — Interactive 3D Canvas & Socratic Math Engine

[![Logicodix 2026](https://img.shields.io/badge/LOGICODIX-2026-1E3A8A?style=for-the-badge&logo=codeforces&logoColor=white)](https://github.com/[your-team]/zap)
[![Subtheme](https://img.shields.io/badge/Subtheme-Smart_%26_Fun_Education-0D9488?style=for-the-badge)](https://github.com/[your-team]/zap)
[![License: MIT](https://img.shields.io/badge/License-MIT-38BDF8?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web--First_(Projector_%26_Smartboard)-2563EB?style=for-the-badge)](https://github.com/[your-team]/zap)
[![Pytest Passing](https://img.shields.io/badge/Pytest-22%2F22_Passing-059669?style=for-the-badge)](backend/tests/)

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

## 🧪 Hasil Uji Otomatis (Pytest 22/22 Verified)

Rangkaian pengujian otomatis di [`backend/tests/`](backend/tests/) mencakup verifikasi logika simbolik dan integrasi API:

### A. Core Symbolic Reasoning (`test_cfl_engine.py` - 12 Tests)
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

### B. API Gateway & Endpoints (`test_api.py` - 10 Tests)
* ✅ **Health Check (`GET /health`):** Verifikasi status gateway online.
* ✅ **Diagnosa HTTP Patah Logika (`POST /api/v1/diagnose`):** Validasi penuh payload respons, kontra-contoh, dan masking Sokrates.
* ✅ **Diagnosa HTTP Langkah Valid:** Mengonfirmasi `status: ALL_STEPS_VALID`.
* ✅ **Validasi Payload Kosong (HTTP 422):** Menolak payload kosong `{}` maupun whitespace.
* ✅ **Penolakan HTTP Code Injection (HTTP 422):** Menolak payload berbahaya sebelum dievaluasi.
* ✅ **Kekebalan HTTP ConditionSet:** Menangani $\sin(x)=x$ tanpa memicu server crash (HTTP 500).
* ✅ **Fleksibilitas Payload Dual-Schema:** Menerima parameter `confirmed_steps` (primer) maupun `lines` (alias).
* ✅ **Penghormatan Alias `target_var`:** Memastikan variabel non-default (misal: `y`) dihormati dan tidak ter-overwrite oleh default `x`.
* ✅ **Penolakan HTTP LaTeX Non-Matematika (HTTP 422):** Menolak input LaTeX eksploitatif pada API publik.
* ✅ **Penolakan HTTP DoS Exponent (HTTP 422):** Menolak kiriman eksponen raksasa (`9^9^9`) secara instan.

```bash
$ cd backend
$ python -m pytest -v -p no:cacheprovider tests/
============================= 22 passed in 1.80s ==============================
```

---

## 📌 Cakupan & Batasan Sistem Saat Ini (Current Scope & Limitations)

> [!NOTE]
> **Transparansi Status Pengembangan:**  
> 1. **Cakupan Aljabar Simbolik Saat Ini:** Rangkaian 22 unit test backend mencakup verifikasi matematis deterministik pada **Aljabar Polinomial Univariat & Rasional** (persamaan linear, manipulasi ruas, pemfaktoran kuadrat, dan pembatasan derajat eksponen).  
> 2. **Integrasi 3D Canvas:** Rendering 3D WebGL (Three.js) beroperasi di layer frontend dengan menerima data JSON koordinat dan matriks bidang iris dari SymPy.  
> 3. **AI Provider:** Mendukung Google Gemini (OAuth 1-Click) sebagai baseline default, serta opsi integrasi ChatGPT (OpenAI) tanpa menurunkan model (*no downgrade*).

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
cd docs/frontend
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 📄 Berkas Blueprint Produk
Dokumen perancangan lengkap dan spesifikasi produk berstandar publikasi eksekutif:
* 📄 [ZAP_Product_Blueprint.pdf](ZAP_Product_Blueprint.pdf) *(PDF 4 Halaman, Light Mode Minimalis, 4 Diagram SVG Lengkap)*
* 🌐 [ZAP_Product_Blueprint.html](docs/ZAP_Product_Blueprint.html)
