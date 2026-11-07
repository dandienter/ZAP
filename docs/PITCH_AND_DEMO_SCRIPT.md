# PANDUAN PITCHING FINAL 7 MENIT & VIDEO DEMO ZAP (V3.0 REVISED)

---

## 1. STRUKTUR PRESENTASI BABAK FINAL (TOTAL WAKTU: 15 MENIT)

Berdasarkan Panduan Babak Final Offline LOGICODIX 2026:
* **1 Menit:** Persiapan laptop & verifikasi localhost ke dewan juri.
* **7 Menit:** Presentasi materi & Live Demo ZAP di panggung.
* **3 Menit:** Tanya Jawab (Q&A) dengan dewan juri industri.
* **4 Menit:** Penilaian juri dan transisi tim.

---

## 2. NASKAH PRESENTASI PANGGUNG 7 MENIT (DETIK DEMI DETIK)

### Menit 00:00 – 01:15 | The Hook: Dari Smart Board Tiongkok ke Proyektor Gantung Indonesia
*(Presenter 1 memegang remote presenter clicker dan menunjuk proyektor ruang panggung)*

> **Presenter 1:**  
> *"Selamat pagi dewan juri yang terhormat dan rekan-rekan inovator.  
> Jika kita berkunjung ke sekolah-sekolah modern di Tiongkok hari ini, kita akan melihat pemandangan menakjubkan: guru menulis persamaan kalkulus, dan layar papan tulis pintar raksasa langsung merendernya menjadi objek 3D hidup yang bisa diputar dengan jari.  
> Namun mari kita kembali ke tanah air: harga satu unit Smart Board tersebut mencapai **Rp 30 juta hingga Rp 80 juta**. Kurang dari 5% sekolah di Indonesia yang memilikinya.  
> Tapi apakah siswa Indonesia harus menunggu anggaran puluhan triliun turun untuk bisa merasakan keajaiban visualisasi matematika 3D? Jawabannya: **TIDAK**.  
> Di plafon hampir setiap ruang kelas sekolah negeri kita, sudah tergantung sebuah **proyektor LCD InFocus**.  
> Hari ini, kami mempersembahkan **ZAP (Zero Answer Policy)**: platform web-first yang mengubah proyektor gantung lama menjadi sarana pembelajaran matematika 3D interaktif kelas dunia, dipandu oleh tutor kecerdasan buatan berpagar etika ketat: **dilarang membocorkan kunci jawaban**."*

---

### Menit 01:15 – 02:30 | The Core Problem & The Zero Answer Philosophy
*(Slide menampilkan grafik PISA Indonesia dan perbandingan alur contek vs alur bernalar)*

> **Presenter 2:**  
> *"Berdasarkan survei PISA 2022, kemampuan numerasi siswa Indonesia berada di peringkat 69 dari 81 negara. Masalahnya bukan anak-anak kita malas berhitung, melainkan menderita **'Math Blindness'**—kebutaan membayangkan ruang 3D dari rumus abstrak 2D.  
> Ironisnya, ketika AI generatif hadir, mayoritas siswa menggunakannya sebagai **'Mesin Kunci Jawaban'**. Siswa menyalin jawaban instan, dan proses bernalar kritis pun mati.  
> ZAP hadir membalik keadaan melalui 3 pilar:  
> 1. **Zero Answer Policy:** AI menolak memberikan angka jawaban akhir, melainkan memancing logika siswa langkah demi langkah (*Socratic Scaffolding*).  
> 2. **Dynamic 3D Canvas:** Setiap rumus langsung berubah menjadi bangun ruang 3D interaktif berbasis Three.js WebGL.  
> 3. **1-Click Connect:** Guru dan siswa cukup masuk dengan akun Google tanpa perlu pusing mengatur API key atau mengeluarkan biaya server."*

---

### Menit 02:30 – 05:00 | Live Demo di Localhost (The Climax)
*(Presenter membuka peramban web di `http://localhost:3000` yang terhubung ke proyektor aula)*

> **Presenter 1:**  
> *"Mari kita buktikan secara langsung di hadapan dewan juri pada sistem yang berjalan di localhost.*  
> *(Aksi: Klik 'Masuk dengan Google' ➔ 1 detik langsung masuk dashboard ZAP).*  
>  
> *Siswa atau guru mengetik persamaan fungsi kuadrat $(x+3)^2 - 4$.  
> Perhatikan kanvas 3D di sebelah kanan: secara instan, Three.js merender permukaan parabola 3D lengkap dengan kontur grid dan titik puncak vertex di $(-3, 0, -4)$.  
> Guru di depan kelas bisa memutar grafik ini dengan clicker atau mouse, atau mencubit layar jika menggunakan smartboard.*  
>  
> *Sekarang, mari kita uji sifat kognitifnya:  
> Seorang siswa mencoba memasukkan langkah penurunan:  
> Baris 1: $(x+3)^2 - 4$  
> Baris 2: $x^2 + 9 - 4$  
> Lalu siswa bertanya di chat: **'Berapa jawaban akhirnya, Kak?'**  
>  
> *Lihat respons ZAP:*  
> ZAP **TIDAK** memberikan jawaban.  
> ZAP menandai **Baris ke-2 dengan warna Amber** dan melontarkan pertanyaan pemantik:  
> *'Di baris ke-2, kamu mengekspansi $(x+3)^2$. Coba uji jika $x = 2$: berapakah nilai $(2+3)^2$ dan berapakah nilai $2^2 + 9$? Mengapa kedua nilai tersebut berbeda?'*  
>  
> Dan di kanvas 3D, kurva yang keliru ditampilkan bersanding dengan kurva asli. Siswa melihat secara visual bahwa kedua grafik tidak berimpit! Inilah esensi **Aha! Moment** yang kami bangun."*

---

### Menit 05:00 – 06:00 | Engineering Excellence & SymPy Truth Shield
*(Slide arsitektur sistem dan terminal hasil uji pytest 22/22 passing)*

> **Presenter 2:**  
> *"Bagaimana kami menjamin AI tidak berhalusinasi atau salah hitung angka?  
> Kami menerapkan **Strict Separation of Concerns**: model AI sama sekali tidak menghitung matematika.  
> Seluruh kalkulasi aljabar, penentuan akar, dan penghitungan poligon 3D diserahkan kepada **SymPy CAS Microservice**.  
> Hasilnya: model AI gratisan dan ringan sekalipun (seperti Gemini Flash) tetap bekerja dengan akurasi 100% mutlak dan kecepatan di bawah 1 detik!  
> Seluruh pipeline keamanan, anti-RCE, pertahanan anti-DoS eksponen, dan pencegahan kebocoran jawaban telah kami uji secara komprehensif dengan **22 unit test otomatis terverifikasi lolos 100%**."*

---

### Menit 06:00 – 07:00 | Kesimpulan & Visi Masa Depan
*(Slide menampilkan foto ruang kelas di daerah dengan murid-murid antusias menatap dinding kelas)*

> **Presenter 1:**  
> *"ZAP membuktikan bahwa teknologi pendidikan tercanggih bukan yang menuntut sekolah membeli hardware puluhan juta rupiah, melainkan teknologi yang mampu memberdayakan apa yang sudah ada di ruang kelas.  
> Dari anak TK yang menyusun balok 3D, anak SMA yang membedah irisan kerucut, hingga mahasiswa yang meneliti manifold, ZAP adalah kanvas penalaran untuk semua.  
> Jangan beri anak bangsa ikan berupa contekan instan. Beri mereka kanvas ruang dan pancing nalar mereka dengan ZAP.  
> Terima kasih, kami siap menerima pertanyaan dewan juri."*

---

## 3. ANTISIPASI PERTANYAAN DEWAN JURI (Q&A CHEATSHEET)

### Q1: *"Bagaimana ZAP menjamin siswa tidak bisa mem-bypass AI untuk meminta jawaban langsung?"*
* **Jawaban:** ZAP memiliki dua lapis pertahanan: (1) *System Prompt Socratic Persona* yang membatasi peran AI, dan (2) *Deterministic Regex & AST Guardrail Sanitizer* di backend Python yang menyaring seluruh respons sebelum sampai ke klien. Jika ada kata kunci jawaban deklaratif (misal: "maka x = 5"), respons tersebut otomatis dicegat dan dipaksa regenerasi menjadi pertanyaan pemantik.

### Q2: *"Siapa yang menanggung biaya API jika jutaan murid menggunakan ZAP?"*
* **Jawaban:** ZAP menggunakan arsitektur *1-Click Delegated Authentication*. Pengguna masuk dengan akun Google masing-masing, sehingga kuota API berjalan di atas jatah akun pengguna (Google AI Studio menyediakan kuota gratis yang sangat melimpah untuk Gemini). Platform ZAP sama sekali tidak terbebani biaya komputasi AI terpusat (*Zero Server LLM Cost*).
