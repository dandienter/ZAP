# PROPOSAL INOVASI DIGITAL HACKATHON LOGICODIX 2026 (V2.0 REVISED)

---

## **NalarAI**
### *The Autonomous Cognitive Diagnostics Engine for Student Scratchpads*
> **"Don't give them the answer. Debug how they think."**

* **Subtema:** Smart & Fun Education  
* **Kategori Karya:** Minimum Viable Product (MVP) Web Application  
* **Target Kompetisi:** LOGICODIX Hackathon 2026  
* **Repositori Resmi:** `https://github.com/[your-team]/nalar-ai`  

---

## RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)

Dalam beberapa tahun terakhir, sebagian besar adopsi kecerdasan buatan dalam bidang pendidikan (EdTech) berfokus pada penyelesaian tugas secara instan. Aplikasi seperti Photomath, Qanda, dan chatbot generatif umum beroperasi sebagai **"Answer Engines" (Mesin Kunci Jawaban)**. Ketika siswa buntu menyelesaikan soal matematika, aplikasi ini menyodorkan solusi instan yang memicu *Cognitive Bypassing*—kondisi di mana proses berpikir reflektif siswa terlewati. Berdasarkan survei PISA 2022, kemampuan numerasi dan penalaran matematika siswa Indonesia berada pada peringkat 69 dari 81 negara (skor 366 vs rata-rata OECD 472). Siswa kerap bukan tidak mampu berhitung, melainkan mengalami kegagalan model mental (*conceptual misconception*).

**NalarAI** hadir dengan paradigma pembelajaran reflektif (*formative reflection*). NalarAI adalah sistem diagnostik kognitif yang memprioritaskan proses bernalar siswa dengan menerapkan **Zero-Answer Policy**. Alih-alih memindai soal bersih di buku, siswa memindai **kertas buram (orat-oretan tangan)** tempat pergulatan logika mereka terjadi.

Menggabungkan **Vision-Language Model (VLM)** dengan mesin matematika simbolik deterministik (**SymPy**), NalarAI mengisolasi titik patah logika pertama (*First Fault Breakpoint*) pada coretan siswa. Sistem kemudian menghasilkan pertanyaan Sokrates (*Socratic Scaffolding*) dan simulasi tandingan interaktif yang membimbing siswa menemukan sendiri kesesatan logikanya (*Aha! moment*).

---

## BAB I: LATAR BELAKANG & ANALISIS MASALAH STRUKTURAL

### 1.1 Krisis Kognitif: PISA dan Ketergantungan AI Instan
Dalam kurikulum pendidikan di Indonesia, evaluasi pembelajaran kerap terpaku pada produk akhir (*summative output*), yakni sekadar apakah jawaban akhir siswa bernilai benar atau salah. Pola evaluasi ini mengabaikan proses pembentukan pemikiran (*formative reasoning*). 

Ketika teknologi AI generatif semakin mudah diakses, tantangan pedagogis baru muncul:
1. Siswa mengambil foto soal ujian/tugas.
2. AI menghasilkan langkah pengerjaan terperinci beserta jawaban akhir.
3. Siswa menyalin teks tanpa memproses struktur logika di baliknya.
4. **Hasilnya:** Terjadi *Illusion of Explanatory Depth*—siswa merasa telah menguasai materi hanya karena membaca teks jawaban yang disajikan, namun kesulitan ketika dihadapkan pada variasi soal baru tanpa bantuan gawai.

### 1.2 "Kertas Buram": Jejak Otak yang Terabaikan
Kertas buram (*scratchpad*) adalah artefak kognitif paling autentik dalam pembelajaran sains dan matematika. Pada lembaran inilah terlihat:
* Asumsi awal yang dibangun siswa.
* Coretan penghapusan yang mencerminkan keraguan (*epistemic hesitation*).
* Lompatan logika (*deductive leaps*) yang keliru.

Di ruang kelas dengan rasio guru dan murid yang tinggi, pendidik memiliki keterbatasan waktu untuk memeriksa lembar orat-oretan tiap murid demi mendiagnosis di baris mana pola pikir mereka mulai tersesat. Akibatnya, kertas buram berakhir dibuang, dan evaluasi hanya terfokus pada angka akhir.

### 1.3 Landasan Teori Pedagogis & Psikologi Kognitif
NalarAI dibangun di atas tiga pilar teori pendidikan teruji:
1. **Teori Ekuilibrasi Kognitif (Jean Piaget):** Pembelajaran mendalam terjadi ketika individu mengalami ketidakseimbangan kognitif (*cognitive disequilibrium*)—kondisi ketika realitas membantah asumsi awal mereka, mendorong otak melakukan akomodasi skema berpikir baru.
2. **Zone of Proximal Development & Scaffolding (Lev Vygotsky):** Bantuan terbaik bukan menyelesaikan pekerjaan untuk siswa, melainkan memberikan perancah (*scaffold*) terkecil yang memungkinkan siswa mengatasi kebuntuan logika secara mandiri.
3. **Cognitive Load Theory (John Sweller):** Menghindari beban kognitif berlebih (*extraneous load*) dengan membedah satu titik kekeliruan spesifik alih-alih membongkar ulang seluruh bab dari awal.

---

## BAB II: VALUE PROPOSITION & PARADIGMA SOLUSI

| Dimensi | Answer Engines Umum | NalarAI (Cognitive Debugger) |
| :--- | :--- | :--- |
| **Input Data** | Teks/Foto Soal Bersih di Buku | Foto Kertas Buram Coretan Tangan Siswa |
| **Tujuan Sistem** | Menyelesaikan soal secepat mungkin | Membimbing siswa memeriksa alur berpikirnya |
| **Output Utama** | Langkah pengerjaan & Jawaban Final | Diagnosa Titik Galat & Pertanyaan Sokrates |
| **Keterlibatan Siswa** | Pasif (Menyalin hasil) | Aktif (Mengevaluasi asumsi pribadi) |
| **Verifikasi Hitung** | Rawan halusinasi komputasi numerik | Deterministik berbasis SymPy (Computer Algebra) |

### Kebijakan Mutlak: The "Zero-Answer Policy"
NalarAI menerapkan batas etis perangkat lunak (*architectural guardrail*): sistem secara programatis memfilter keluaran agar tidak menyajikan jawaban numerik/simbolik akhir dari soal yang sedang dikerjakan. NalarAI berfungsi sebagai *debugger* yang menunjuk lokasi galat logika dan memberikan pemicu refleksi kognitif.

---

## BAB III: RUANG LINGKUP & MATRIKS FITUR MVP

Untuk pelaksanaan kompetisi LOGICODIX 2026 (7–14 November 2026), ruang lingkup MVP **dikunci pada domain Aljabar (Ekspansi Polinomial dan Persamaan Linear/Kuadrat)** guna memastikan keandalan eksekusi dan akurasi tinggi:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         CORE PRODUCT MATRIX                            │
├─────────────────────┬──────────────────────────────────────────────────┤
│ Fitur 1:            │ • Upload foto / capture kamera langsung          │
│ Scratchpad Ingestion│ • Automatic image binarization & contrast tuning │
│                     │ • Fitur Tinjau & Konfirmasi Pembacaan Teks       │
├─────────────────────┼──────────────────────────────────────────────────┤
│ Fitur 2:            │ • Ekstraksi multimodal tulisan tangan ke LaTeX   │
│ Step-by-Step Parser │ • Rekonstruksi garis alur penalaran kronologis   │
│                     │ • Deteksi otomatis tipe ekspresi vs persamaan    │
├─────────────────────┼──────────────────────────────────────────────────┤
│ Fitur 3:            │ • SymPy mathematical engine validation           │
│ Symbolic Verifier   │ • Uji ekuivalensi bentuk aljabar & himpunan sol  │
│                     │ • Isolasi First Fault Breakpoint (baris galat)   │
├─────────────────────┼──────────────────────────────────────────────────┤
│ Fitur 4:            │ • Klasifikasi miskonsepsi (Ekspansi & Pindah Ruas│
│ Socratic Console    │ • Counter-example generator (substitusi angka)   │
│                     │ • Robust Zero-Answer Guardrail filter            │
└─────────────────────┴──────────────────────────────────────────────────┘
```

---

## BAB IV: PEMETAAN TERHADAP INDIKATOR PENILAIAN LOGICODIX 2026

Rancangan proyek ini dipetakan secara terukur terhadap buku panduan resmi LOGICODIX 2026:

### 1. Problem-Solution Fit (Bobot: 25%)
* **Ketajaman Masalah:** Menyasar akar kemunduran numerasi dan fenomena *cheating* AI yang kontraproduktif.
* **Kesesuaian Solusi:** Tidak menciptakan friksi baru; siswa tetap berhitung di kertas buram seperti biasa, kemudian menggunakan NalarAI saat mengalami kebuntuan logika.

### 2. Inovasi & Implementasi Teknologi (Bobot: 25%)
* **Bukan Sekadar Wrapper Chatbot:** Mengintegrasikan Vision-Language Model untuk transkripsi perseptual dengan Computer Algebra System deterministik (**SymPy**) di backend.
* **Human-in-the-Loop Safeguard:** Dilengkapi fitur peninjauan hasil transkripsi sebelum kalkulasi dijalankan demi menjamin integritas data masukan.

### 3. Rekayasa Perangkat Lunak / Software Engineering (Bobot: 25%)
* **Kode Bersih, Modular & Teruji:** Dilengkapi pengujian unit otomatis (`pytest`) yang mencakup uji ekspansi polinomial, pemecahan persamaan, dan keandalan guardrail.
* **Localhost Compatibility:** Arsitektur siap dijalankan secara mandiri di *localhost* dengan dukungan kontainer Docker Compose dan fallback model VLM lokal (Qwen2-VL).

### 4. Desain & Pengalaman Pengguna / UI/UX (Bobot: 15%)
* **Paradigma "Cognitive Diff":** Visualisasi antarmuka memperlihatkan dengan jelas di mana alur berpikir siswa menyimpang dari konsistensi aljabar.
* **Non-Punitive Visual Language:** Menghilangkan warna merah tanda salah yang mengintimidasi, digantikan dengan warna Amber (*Epistemic Friction*) yang memicu rasa ingin tahu.

### 5. Prinsip Khusus: Green IT & Ethics (Bobot: 10%)
* **Efisiensi Komputasi (Green IT):** Inferensi VLM berukuran besar hanya dipanggil 1 kali saat ekstraksi teks. Verifikasi baris ke baris diserahkan ke mesin aljabar simbolik yang hemat daya komputasi.
* **Kepatuhan Privasi & UU PDP:** Mendukung pemrosesan data luring (*air-gapped*) yang aman bagi data siswa di bawah umur, tanpa penyimpanan permanen dokumen kertas buram di peladen.

---

## BAB V: MODEL KEBERLANJUTAN & RENCANA ADOPSI

1. **B2C (Direct to Students):** Membantu persiapan ujian seleksi masuk perguruan tinggi (UTBK/SNBT) di mana pemahaman konseptual matematika penalaran menjadi penentu kelulusan utama.
2. **B2B SaaS (Institutional Analytics untuk Sekolah):** Menyediakan dashboard analitik bagi sekolah untuk memetakan distribusi miskonsepsi per kelas.
   *(Ilustrasi kasus: Guru dapat melihat laporan bahwa sejumlah siswa di kelas tertentu mengalami kendala pada aturan pemangkatan aljabar).*
3. **Data Flywheel:** Mengembangkan korpus anonim tentang pola miskonsepsi aljabar pelajar Indonesia guna mendukung penyempurnaan bahan ajar guru.
