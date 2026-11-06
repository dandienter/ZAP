# PANDUAN PITCHING FINAL 7 MENIT & VIDEO DEMO (V2.0 REVISED)

---

## 1. STRUKTUR PRESENTASI BABAK FINAL (TOTAL WAKTU: 15 MENIT)

Berdasarkan Panduan Babak Final Offline LOGICODIX 2026:
* **1 Menit:** Persiapan laptop & verifikasi localhost ke dewan juri.
* **7 Menit:** Presentasi materi & Live Demo aplikasi di panggung.
* **3 Menit:** Tanya Jawab (Q&A) dengan dewan juri industri.
* **4 Menit:** Penilaian juri dan transisi tim.

---

## 2. NASKAH PRESENTASI PANGGUNG 7 MENIT (DETIK DEMI DETIK)

### Menit 00:00 – 01:00 | The Hook & Properti Fisik Panggung
*(Presenter 1 memegang selembar kertas buram kusut yang penuh orat-oretan coretan tangan)*

> **Presenter 1:**  
> *"Selamat pagi dewan juri dan hadirin sekalian.  
> Coba perhatikan benda di tangan saya ini. Ini adalah selembar kertas buram. Di jutaan meja belajar siswa di Indonesia, kertas ini dianggap sampah tak berharga setelah ujian selesai.  
> Namun faktanya: di atas kertas inilah proses bernalar anak bangsa sebenarnya berjuang. Di sini ada keraguan, ada coretan silang, dan ada penurunan rumus mereka.  
> Sayangnya, ketika kecerdasan buatan masuk ke dunia pendidikan, aplikasi seperti Photomath dan ChatGPT kerap menjadi mesin kunci jawaban instan yang melewati proses berpikir kritis siswa.  
> Hari ini, kami memperkenalkan **NalarAI**: sistem diagnostik kognitif yang memprioritaskan proses belajar dengan menolak memberikan kunci jawaban, melainkan membedah di mana letak cacat logika berpikir siswa langsung dari kertas buram mereka."*

---

### Menit 01:00 – 02:15 | The Problem & Pedagogical Paradigm Shift
*(Slide menampilkan grafik PISA Indonesia vs OECD, lalu alur perbandingan "Answer Engine vs NalarAI")*

> **Presenter 2:**  
> *"Peringkat PISA matematika Indonesia berada di peringkat 69 dari 81 negara bukan karena anak-anak kita malas berhitung, melainkan karena memiliki cacat model mental (*conceptual misconception*).  
> Selama ini, guru di kelas tidak memiliki waktu memeriksa puluhan kertas buram muridnya. Siswa pun terdorong mengambil jalan pintas dengan menyalin jawaban dari AI.  
> NalarAI hadir sebagai pembalik paradigma. Kami membangun sistem yang melacak invarian logika aljabar dari baris ke baris, menemukan titik patah logika pertama, dan membimbing siswa dengan metode pertanyaan Sokrates agar mereka mengalami 'Aha! Moment' secara mandiri."*

---

### Menit 02:15 – 04:30 | Live Demo di Localhost (The Climax)
*(Presenter meletakkan kertas buram di depan kamera laptop yang terhubung ke proyektor)*

> **Presenter 1:**  
> *"Mari kita uji secara langsung di hadapan dewan juri pada sistem yang berjalan di localhost laptop kami.*  
> *(Aksi: Klik tombol 'Scan Scratchpad' ➔ Sistem membaca tulisan tangan).*  
> *Siswa ini sedang mencoba menyederhanakan ekspansi kuadrat $(x+3)^2 - 4$.  
> Pertama, perhatikan fitur konfirmasi ini: sistem menampilkan formula terbaca agar siswa dapat memastikan simbol terbaca presisi sebelum kalkulasi dijalankan.*  
> *(Klik 'Mulai Diagnosa' ➔ Layar menampilkan dual-pane workspace).*  
>  
> *Lihat: NalarAI **TIDAK** membocorkan jawaban akhir.  
> NalarAI menyorot **Baris ke-2 dengan warna Amber**:  
> Siswa menulis $(x+3)^2 = x^2 + 9$.  
> Sistem mendiagnosis: **Ilusi Ekspansi Distributif**—suku perkalian silang hilang.  
>  
> Dan di konsol kanan, NalarAI menyajikan uji angka nyata:  
> *'Jika $x = 2$, hitung $(2+3)^2 = 25$. Mengapa langkahmu menghasilkan $2^2 + 9 = 13$? Mengapa 25 tidak sama dengan 13?'*  
> Siswa ditantang memeriksa kembali pemikirannya, bukan menyalin jawaban."*

---

### Menit 04:30 – 05:45 | Software Engineering & Deterministic SymPy Engine
*(Slide menampilkan diagram arsitektur Hybrid VLM + SymPy)*

> **Presenter 2:**  
> *"Bagaimana kami menjamin akurasi evaluasi ini?  
> Kami tidak menyerahkan validasi kebenaran aljabar pada tebakan LLM murni. NalarAI menggunakan **Arsitektur Hybrid**:  
> 1. Model Vision bertugas membaca tulisan tangan menjadi notasi LaTeX terstruktur.  
> 2. Verifikasi logika transisi baris dilakukan 100% secara deterministik oleh mesin aljabar simbolik **SymPy** di backend Python kami. Baik untuk ekspansi aljabar maupun pengujian himpunan solusi persamaan.  
> 3. Dari sisi **Etika & UU PDP**: pemrosesan data kertas buram bersifat anonim tanpa data biometrik, dan sistem mendukung mode luring lokal via Ollama."*

---

### Menit 05:45 – 07:00 | Kesimpulan & Penutup

> **Presenter 1:**  
> *"Teknologi seharusnya tidak menggantikan nalar manusia. Teknologi harus membantu manusia melatih cara berpikirnya.  
> NalarAI: Don't give them the answer. Debug how they think.  
> Terima kasih!"*

---

## 3. CONTEKAN TANYA-JAWAB DEWAN JURI (Q&A CHEAT SHEET)

### Pertanyaan Juri 1:
> *"Kenapa siswa tidak pakai ChatGPT saja yang sekarang juga bisa membaca foto?"*
* **Jawaban Tim:**  
  *"ChatGPT dirancang untuk menyelesaikan tugas secepat mungkin, sehingga secara alami selalu memberikan jawaban akhir dan memotong proses berpikir siswa. NalarAI memiliki **Zero-Answer Architectural Guardrail** yang menyaring bocoran jawaban, serta menggunakan verifikasi deterministik SymPy yang menjamin evaluasi langkah konsisten tanpa halusinasi numerik."*

### Pertanyaan Juri 2:
> *"Bagaimana jika tulisan tangan siswa salah dibaca oleh Vision AI?"*
* **Jawaban Tim:**  
  *"Kami menerapkan arsitektur *Human-in-the-Loop*. Begitu tulisan tangan diekstrak, antarmuka menyediakan tahap tinjauan cepat (2–3 detik) di mana siswa dapat mengonfirmasi atau mengedit karakter yang keliru sebelum mesin kalkulasi dijalankan. Hal ini mencegah kesalahan diagnosa sekaligus mendidik siswa memeriksa ulang pekerjaannya."*

### Pertanyaan Juri 3:
> *"Apakah sistem ini mendukung fisika atau kalkulus rumit?"*
* **Jawaban Tim:**  
  *"Untuk lingkup MVP 1 minggu kompetisi ini, kami secara disiplin mengunci scope pada **domain Aljabar (ekspansi polinomial dan persamaan linear/kuadrat)** demi memastikan akurasi dan stabilitas sistem. Dukungan domain kalkulus lanjut dan fisika mekanika menjadi bagian dari roadmap pengembangan fase berikutnya dengan modul verifikasi khusus."*

---

## 4. KEPATUHAN VIDEO DEMO (3–5 MENIT TANPA NARASI)
* Demonstrasi fungsional murni pada layar laptop/HP.
* Musik latar instrumental tanpa narasi suara peserta.
* Teks overlay besar yang menjelaskan setiap tahap: *1. Pindai Kertas Buram*, *2. Konfirmasi Transkripsi*, *3. Deteksi Titik Galat Baris 2*, *4. Refleksi Sokrates*.
