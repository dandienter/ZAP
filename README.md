# NalarAI — Cognitive Debugger for Student Scratchpads

[![Logicodix 2026](https://img.shields.io/badge/LOGICODIX-2026-6366F1?style=for-the-badge&logo=codeforces&logoColor=white)](https://github.com/[your-team]/nalar-ai)
[![Subtheme](https://img.shields.io/badge/Subtheme-Smart_%26_Fun_Education-10B981?style=for-the-badge)](https://github.com/[your-team]/nalar-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-38BDF8?style=for-the-badge)](LICENSE)
[![Localhost Ready](https://img.shields.io/badge/Localhost-Offline_Tested-F59E0B?style=for-the-badge)](https://github.com/[your-team]/nalar-ai)
[![Pytest Passing](https://img.shields.io/badge/Pytest-22%2F22_Passing-10B981?style=for-the-badge)](backend/tests/)

> **"Don't give them the answer. Debug how they think."**  
> NalarAI adalah sistem diagnostik kognitif yang membedah cacat logika berpikir siswa langsung dari foto kertas buram (orat-oretan tangan) mereka, memadukan Vision-Language Model dengan mesin aljabar simbolik deterministik (**SymPy**).

---

## 🌟 Mengapa NalarAI Berbeda?

| Fitur / Pendekatan | Answer Engines Umum (Photomath, ChatGPT) | NalarAI (Cognitive Debugger) |
| :--- | :--- | :--- |
| **Objek Input** | Foto soal bersih dari buku cetak | Foto kertas buram orat-oretan tangan siswa |
| **Keluaran Sistem** | Rumus jadi & jawaban akhir instan | Diagnosa titik patah logika & pertanyaan Sokrates |
| **Dampak Kognitif** | *Cognitive Bypassing* (Siswa pasif menyalin) | Melatih daya kritis & *Aha! moment* mandiri |
| **Validasi Hitung** | Rawan halusinasi komputasi numerik AI | Deterministik berbasis SymPy (`solveset` & `simplify`) |
| **Kebijakan Etika** | Membocorkan jawaban tugas sekolah | **Zero-Answer Policy Guardrail** |

---

## 🏗️ Arsitektur Sistem

NalarAI menggunakan arsitektur **Hybrid Perceptual-Symbolic Reasoning**:
1. **Perceptual Layer:** Multimodal Vision Model (Gemini 2.0 / Qwen2-VL lokal) membaca tulisan tangan menjadi urutan ekspresi LaTeX terstruktur.
2. **Human-in-the-Loop Safeguard:** Antarmuka konfirmasi cepat bagi siswa untuk memastikan simbol matematika terbaca presisi sebelum kalkulasi dijalankan.
3. **Deterministic Layer (`backend/cfl`):** Modul Python berbasis **SymPy** yang memverifikasi ekuivalensi aljabar deterministik, mendeteksi `ROOT_LOSS`, menangani kondisi `ConditionSet`, memblokir eksekusi di luar whitelist sebelum `parse_expr`, menolak perintah LaTeX non-matematika, serta mencegah serangan DoS eksponen raksasa (`9^9^9`).
4. **Socratic Scaffolding Layer:** Menghasilkan kontra-contoh konkret (*counter-examples*) dan pemicu pertanyaan refleksi kognitif tanpa membocorkan kunci jawaban.

```
[ Kertas Buram ] ➔ [ OpenCV Preprocessing ] ➔ [ VLM Transcription ] ➔ [ Konfirmasi Siswa ] ➔ [ SymPy CFL Engine ] ➔ [ Socratic Console ]
```

---

## 🧪 Hasil Uji Otomatis (Pytest 22/22 Verified)

Rangkaian pengujian otomatis di [`backend/tests/`](backend/tests/) mencakup verifikasi logika simbolik dan integrasi API:

### A. Core Symbolic Reasoning (`test_cfl_engine.py` - 12 Tests)
* ✅ **Ekspansi Kuadrat:** Mendeteksi hilangnya suku perkalian silang pada $(x+3)^2 - 4$ (kontra-contoh terhitung: $21 \neq 9$).
* ✅ **Persamaan Linear Valid:** Memvalidasi manipulasi ruas $2x + 3 = 7 \rightarrow 2x = 4 \rightarrow x = 2$.
* ✅ **Persamaan Linear Galat:** Mendeteksi kesalahan tanda saat pindah ruas $2x + 3 = 7 \rightarrow 2x = 10$.
* ✅ **Deteksi Kehilangan Akar:** Mendeteksi hilangnya akar negatif pada $x^2 = 4 \rightarrow x = 2$ (`ROOT_LOSS`).
* ✅ **Penanganan ConditionSet:** Menangani persamaan transendental $\sin(x) = x$ secara aman sebagai `UNDECIDABLE_STEP`.
* ✅ **Sanitasi Whitelist (Security):** `parse_expr` hanya dipanggil jika input lolos whitelist karakter dan identifier; payload injeksi Python (`__import__`, `eval`, `open`, `__builtins__`) ditolak sebelum dievaluasi.
* ✅ **Penolakan LaTeX Non-Matematika:** Jalur fallback `parse_latex` memblokir perintah sistem berbahaya seperti `\input{/etc/passwd}` dan `\write18{echo hi}`.
* ✅ **Pertahanan Anti-DoS (Exponential Limiter):** Menolak eksponen numerik > 100 dan rantai pangkat bertingkat ($9^{9^9}$, $(9^9)^9$, $2^{100000000000}$, $\sqrt[99999]{2}$) dalam sub-milidetik (< 1 ms).
* ✅ **Verifikasi Intersepsi Monkeypatch:** Membuktikan secara deterministik bahwa payload berbahaya ditolak pada tahap pra-parse dan sama sekali tidak pernah menyentuh fungsi parser `parse_expr` maupun `parse_latex` SymPy.
* ✅ **Regresi Guardrail:** Memastikan kalimat `"Jika x = 2"`, `"baris ke-2"`, dan `"Hasil dari substitusi adalah 25"` tidak tersensor.
* ✅ **Pencegahan Kebocoran Jawaban:** Menyaring pernyataan deklaratif `"jawaban akhirnya adalah x = 2"`.
* ✅ **Masking Kunci Eksplisit:** Menguji penyaringan pada `"Kunci adalah 5"` tanpa merusak frasa `"baris ke-5"`.

### B. API Gateway & Endpoints (`test_api.py` - 10 Tests)
* ✅ **Health Check (`GET /health`):** Verifikasi status gateway online.
* ✅ **Diagnosa HTTP Patah Logika (`POST /api/v1/diagnose`):** Validasi penuh payload respons, kontra-contoh, dan masking Sokrates.
* ✅ **Diagnosa HTTP Langkah Valid:** Mengonfirmasi `status: ALL_STEPS_VALID` dan seluruh baris berstatus valid.
* ✅ **Validasi Payload Kosong (HTTP 422):** Menolak payload kosong `{}` maupun daftar langkah kosong `[]` atau whitespace.
* ✅ **Penolakan HTTP Code Injection (HTTP 422):** Menolak payload berbahaya sebelum dievaluasi.
* ✅ **Kekebalan HTTP ConditionSet:** Menangani $\sin(x)=x$ tanpa memicu server crash (HTTP 500).
* ✅ **Fleksibilitas Payload (Backward-Compatibility):** Menerima field `confirmed_steps` maupun `lines`.
* ✅ **Penghormatan Alias `target_var`:** Memastikan variabel non-default (misal: `y`) benar-benar dihormati dan tidak ter-overwrite oleh default `x`.
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
> **Transparansi Status Pengembangan Prototipe:**  
> Rangkaian 22 unit & integration test yang ada mencakup verifikasi matematis deterministik pada **Parser Aljabar**, **CFL Engine** (deteksi breakpoint kesalahan, ekuivalensi aljabar, deteksi `ROOT_LOSS`, kontra-contoh konkret), **Robust Zero-Answer Guardrail**, dan **FastAPI Endpoint**.  
> **Hal-hal yang belum ada / belum didukung pada rilis saat ini:**
> 1. **Pipeline OCR / VLM:** Integrasi visual model untuk memindai foto kertas buram secara langsung belum diimplementasikan; input sistem saat ini merupakan teks matematika/LaTeX yang diketik pengguna atau dipilih melalui sampel orat-oretan terkurasi.
> 2. **Cakupan Domain:** Engine saat ini berfokus ketat pada **Aljabar Sekolah Menengah** (persamaan linear, manipulasi ruas, pemfaktoran, dan ekspansi kuadrat). Materi kalkulus tingkat lanjut (turunan, integral) dan formulasi fisika belum didukung.

---

## 🚀 Panduan Menjalankan di Localhost

### Lingkungan Runtime Python:
* **Runtime Terverifikasi:** Python **3.15.1** (Windows x86-64). Seluruh 22 tes otomatis dijalankan dan diverifikasi pada runtime ini.
* **Catatan Kompatibilitas:** Struktur paket di `requirements.txt` menggunakan pustaka standar yang umum didukung Python 3.11 dan 3.12 LTS, namun pengujian resmi di mesin lokal ini dijalankan khusus pada Python 3.15.1 sesuai ketersediaan environment.

### 1. Setup Backend & Menjalankan Unit Tests
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m pytest -v -p no:cacheprovider tests/ -W default

# Menjalankan FastAPI Server:
uvicorn main:app --reload --port 8000
# Dokumentasi Swagger UI: http://127.0.0.1:8000/docs
```

### 2. Setup Frontend (Next.js 14)
```bash
cd frontend
npm install
npm run dev
# Buka http://localhost:3000
```

---

## 📚 Dokumentasi Lengkap Proyek

* 📄 [Proposal Lengkap Hackathon (`docs/PROPOSAL.md`)](docs/PROPOSAL.md) — Krisis PISA, paradoks kertas buram, dan pemetaan rubrik Logicodix 2026.
* ⚙️ [Spesifikasi Arsitektur Sistem (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md) — Arsitektur hybrid, kontrak REST API, alur konfirmasi transkripsi, dan prinsip minimisasi data UU PDP.
* 🧮 [Algoritma Diagnostik & SymPy Engine (`docs/ALGORITHM.md`)](docs/ALGORITHM.md) — Pseudocode CFL Engine, pemisahan ekspresi vs persamaan, dan Robust Zero-Answer Guardrail.
* 🎨 [Design System "Cognitive Diff" (`docs/DESIGN_SYSTEM.md`)](docs/DESIGN_SYSTEM.md) — Desain non-hukuman, palet Amber/Slate, scaffolding bertingkat, dan KaTeX renderer.
* 🎤 [Naskah Pitching 7 Menit & Storyboard Video (`docs/PITCH_AND_DEMO_SCRIPT.md`)](docs/PITCH_AND_DEMO_SCRIPT.md) — Panduan presentasi panggung babak final dan contekan tanya-jawab juri.

---

## ⚖️ Privasi & Etika (UU PDP No. 27/2022)
* Mengadopsi prinsip minimisasi data (*data minimization*): bebas dari pengumpulan identitas pribadi siswa (Zero-PII).
* Citra kertas buram diproses secara lokal *in-memory* dan tidak disimpan permanen di peladen.
* Mengutamakan edukasi reflektif dan pemikiran kritis mandiri.

Didistribusikan di bawah Lisensi [MIT](LICENSE).
