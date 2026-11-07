# PROPOSAL INOVASI DIGITAL HACKATHON LOGICODIX 2026 (V3.0 ZAP REVISED)

---

## **ZAP (Zero Answer Policy)**
### *Platform Web-First Transformasi Rumus ke 3D Interaktif Berbasis Dialog Sokratik untuk Seluruh Jenjang (TK – S3)*
> **"Don't give them answers. Project the wonder to discover."**

* **Subtema:** Smart & Fun Education  
* **Kategori Karya:** Minimum Viable Product (MVP) Web Application  
* **Target Kompetisi:** LOGICODIX Hackathon 2026  
* **Repositori Resmi:** `https://github.com/[your-team]/zap`  
* **Dokumen Blueprint Resmi:** [`ZAP_Product_Blueprint.pdf`](../ZAP_Product_Blueprint.pdf)

---

## RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)

Sebagian besar adopsi kecerdasan buatan dalam pendidikan (EdTech) saat ini beroperasi sebagai **"Answer Engines" (Mesin Kunci Jawaban)**. Siswa memotret atau menyalin tugas matematika ke aplikasi AI generatif publik, lalu sistem menyodorkan jawaban akhir dalam hitungan detik. Dampaknya sangat merusak: terjadi *Cognitive Bypassing*—kondisi di mana proses berpikir reflektif terlewati, memicu penurunan daya nalar kritis siswa. Berdasarkan survei PISA 2022, kemampuan numerasi dan penalaran matematika siswa Indonesia berada pada peringkat 69 dari 81 negara (skor 366 vs rata-rata OECD 472). 

Di sisi lain, sekolah-sekolah di negara maju seperti Tiongkok telah mengadopsi *Interactive Smart Board* yang mampu mengubah formula matematika menjadi objek 3D hidup di depan kelas. Namun, perangkat tersebut sangat mahal (**Rp 30 juta – Rp 80 juta per unit**), sehingga kurang dari 5% sekolah di Indonesia yang memilikinya.

**ZAP (Zero Answer Policy)** hadir sebagai pembalik paradigma yang mendemokratisasikan teknologi papan tulis interaktif tersebut ke dalam format **Web-First & Device-Agnostic**:
1. **Zero Answer Policy (Pedagogi Sokratik Murni):** AI bertindak sebagai guru pembimbing yang diharamkan membocorkan jawaban akhir. AI memandu dengan pertanyaan pemantik bertahap agar siswa menemukan jawabannya sendiri (*Aha! Moment*).
2. **Dynamic 3D Interactive Canvas:** Berbasis WebGL/Three.js, mengonversi persamaan aljabar, irisan bidang, dan kalkulus menjadi bangun ruang 3D hidup secara *real-time*.
3. **Inklusif untuk Ruang Kelas Indonesia:** Berjalan mulus di **laptop guru yang tersambung ke proyektor gantung InFocus di plafon** (sekolah biasa), maupun di **Smart Board layar sentuh interaktif** (sekolah modern).
4. **SymPy Computational Shield:** Menghitung matematika dan koordinat 3D secara deterministik bebas halusinasi, sehingga model AI gratisan/ringan sekalipun tetap bekerja 100% akurat.
5. **1-Click Universal Connect:** Siswa dan guru cukup masuk dengan 1-klik akun Google (otomatis mengaktifkan Gemini) atau menghubungkan ChatGPT tanpa konfigurasi API key yang rumit.

---

## BAB I: LATAR BELAKANG & ANALISIS MASALAH RUANG KELAS

### 1.1 The Educational Trilemma di Indonesia

Pembelajaran matematika di Indonesia menghadapi tiga kebuntuan struktural:
1. **Kesenjangan Perangkat (Hardware Gap):** Papan tulis pintar interaktif (*Smart Board*) terbukti meningkatkan daya tangkap spasial siswa secara signifikan. Namun harganya yang mencapai puluhan juta rupiah menjadikannya kemewahan yang sulit dijangkau sekolah negeri di daerah. Di sisi lain, hampir setiap sekolah memiliki aset terpendam: **proyektor LCD gantung di plafon kelas**.
2. **"Math Blindness" & Keterbatasan Papan Tulis 2D:** Menggambar irisan kerucut, turunan multivariabel, atau jaring-jaring bangun ruang di papan tulis kapur/spidol sangat terbatas. Siswa kesulitan memproyeksikan konsep 3D dari gambar 2D yang kaku.
3. **Degenerasi Nalar akibat AI Instan:** Kemudahan siswa mengakses chatbot generatif membuat mereka terbiasa menyalin hasil akhir tanpa proses berpikir mendalam (*Illusion of Explanatory Depth*).

### 1.2 Landasan Teori Pedagogis

ZAP dibangun di atas tiga pilar psikologi kognitif teruji:
1. **Teori Ekuilibrasi Kognitif (Jean Piaget):** Pembelajaran sejati terjadi saat siswa mengalami ketidakseimbangan kognitif (*cognitive disequilibrium*)—kondisi ketika hasil observasi di kanvas 3D membantah tebakan awal mereka, memaksa otak membentuk skema pemahaman baru.
2. **Zone of Proximal Development & Scaffolding (Lev Vygotsky):** Bantuan terbaik bukan memberikan kunci jawaban, melainkan memberikan perancah (*scaffold*) terkecil berupa pertanyaan Sokratik yang memandu siswa melewati rintangan nalar.
3. **Concrete-Pictorial-Abstract (Metode CPA Jerome Bruner):** Memfasilitasi pembelajaran bertahap dari manipulasi objek visual konkret di kanvas 3D menuju simbol aljabar abstrak.

---

## BAB II: VALUE PROPOSITION & PERBANDINGAN PARADIGMA

| Dimensi | Answer Engines Umum (Photomath / Chatbot) | Papan Tulis Manual / GeoGebra Pasif | **ZAP (Zero Answer Policy)** |
| :--- | :--- | :--- | :--- |
| **Tujuan Sistem** | Menyelesaikan soal secepat mungkin | Menggambar grafik secara manual | **Membimbing proses penalaran spasial & konsep** |
| **Keluaran Utama** | Angka jawaban akhir & langkah jadi | Kurva 2D statis tanpa tutor | **Kanvas 3D Interaktif + Pertanyaan Sokratik** |
| **Resiko Halusinasi** | Tinggi (AI salah hitung angka/vektor) | Nol (kalkulasi manual) | **Nol (Diverifikasi Deterministik oleh SymPy CAS)** |
| **Akses Perangkat** | Gawai personal siswa | Papan tulis fisik | **Web-First (Proyektor Gantung & Smart Board)** |
| **Keterlibatan Siswa** | Pasif (Menyalin hasil) | Pasif (Melihat guru menggambar) | **Aktif (Memanipulasi kanvas 3D & bernalar)** |
| **Hambatan Akses** | Harus bayar langganan / API key | Terbatas kapur/spidol | **1-Click Google Login (Zero Setup)** |

---

## BAB III: MATRIKS CAKUPAN KURIKULUM (TK HINGGA S3)

Karena ZAP menyediakan wadah kanvas 3D dan kebijakan penjaga (*guardrail policy*), sementara model kecerdasan buatan mengelola kurikulum, ZAP mampu mendukung spektrum belajar tanpa batas:

1. **Pendidikan Anak Usia Dini & SD Awal (TK – Kelas 2):**
   * *Materi:* Pengenalan bentuk ruang dasar, simetri, agregasi penjumlahan konkret.
   * *Visualisasi 3D:* Balok hitung warna-warni (*Cuisenaire*), buah apel 3D yang dapat ditarik, kubus yang bisa dibuka jaring-jaringnya.
   * *Dialog ZAP:* *"Ada 3 balok biru di layar. Kalau kamu tarik 2 balok merah ke dekatnya, coba hitung bersama kelinci ada berapa sekarang?"*
2. **SD Akhir – SMP (Kelas 3 – 9):**
   * *Materi:* Pecahan ruang, volume bangun ruang (tabung, prisma, kerucut), koordinat Kartesius, fungsi linear.
   * *Visualisasi 3D:* Tabung transparan yang dapat diisi zat cair dinamis, kurva linear dengan slider gradien (m) dan intersep (c).
   * *Dialog ZAP:* *"Saat kemiringan tangga (m) diubah jadi angka minus, ke arah mana tangga di layar condong bersandar?"*
3. **Sekolah Menengah Atas (SMA / SMK):**
   * *Materi:* Irisan kerucut (elips, parabola, hiperbola), trigonometri ruang 3D, integral volume benda putar 360°.
   * *Visualisasi 3D:* Bidang potong dinamis (*slicer*) pada kerucut ganda, kurva 2D yang diputar terhadap sumbu putar.
   * *Dialog ZAP:* *"Perhatikan cincin tipis di irisan kurva ini. Bagaimana hubungan jari-jari cincin dengan nilai fungsi f(x)?"*
4. **Perguruan Tinggi (Sarjana / S1):**
   * *Materi:* Kalkulus Multivariabel, Aljabar Linear (Vektor Ruang & Nilai Eigen), Persamaan Diferensial.
   * *Visualisasi 3D:* Permukaan saddle (*paraboloid pelana*), bidang singgung ruang 3D, visualisasi peregangan ruang oleh transformasi matriks eigen.
   * *Dialog ZAP:* *"Mengapa turunan parsial terhadap x bernilai nol di titik pelana ini, namun ia bukan titik ekstrim lokal?"*
5. **Pascasarjana & Riset (Magister & Doktoral / S2 – S3):**
   * *Materi:* Geometri Diferensial, Manifold Riemannian, Topologi Aljabar, Analisis Tensor.
   * *Visualisasi 3D:* Manifold non-Euclidean, Möbius strip, medan vektor 3D dengan visualisasi densitas curl dan divergensi ruang.
   * *Dialog ZAP:* *"Bagaimana tensor kelengkungan Riemann bertransformasi saat metrik ruang mendekati singularitas?"*

---

## BAB IV: ARSITEKTUR TEKNIS & EFISIENSI SISTEM

ZAP dirancang dengan prinsip modularitas tinggi:
* **Frontend WebGL (Next.js 14 + Three.js / React Three Fiber):** Bertanggung jawab merender jaring poligon 3D dengan performa 60 FPS pada peramban web standar tanpa instalasi plugin.
* **Deterministic Math Tier (FastAPI + SymPy CAS Microservice):** Arbiter kebenaran matematis mutlak. SymPy mengevaluasi aljabar, mengisolasi titik patah logika, dan menghitung koordinat titik potong 3D sebelum diteruskan ke Three.js.
* **Zero-Answer Policy Guardrail:** Filter penyaring berbasis regex deterministik dan analisis AST yang memblokir kebocoran formula jawaban akhir dari respons AI.
* **1-Click Universal Connect:** Mengeliminasi beban biaya server AI terpusat (*zero server-side LLM cost*) dengan memanfaatkan token OAuth akun Google atau ChatGPT pengguna.

---

## BAB V: ROADMAP PENGEMBANGAN & DAMPAK SOSIAL

* **Q4 2026 (MVP Hackathon Logicodix):** Web-First Canvas 3D, SymPy CAS Ground Truth, Zero-Answer Guardrail V1, dan 1-Click Google SSO.
* **Q1 2027 (Fase 2):** Integrasi OCR Vision untuk coretan kertas buram (*Scratchpad Ingestion*).
* **Q2 2027 (Fase 3):** WebCam Hand Gesture Tracking (MediaPipe) agar guru/siswa bisa memutar objek 3D di depan proyektor dengan lambaian tangan di udara.
* **Q3-Q4 2027 (Fase 4):** Tutor Suara Dua Arah (*Voice Socratic Tutor*) & Kanvas Kolaboratif Seluruh Kelas.

ZAP mewujudkan keadilan akses pendidikan: mengubah proyektor gantung lama di sekolah negeri menjadi sarana belajar matematika masa depan yang cerdas, inklusif, dan menyenangkan.
