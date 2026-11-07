# DESIGN SYSTEM & UI/UX SPECIFICATION: ZAP (V3.0 REVISED)

---

## 1. FILOSOFI DESAIN & METAFORA VISUAL

Desain antarmuka **ZAP (Zero Answer Policy)** dirancang berdasarkan paradigma **"Spatial Cognitive Scaffolding"**. 

Sistem menggabungkan metafora visual kanvas ruang 3D dengan dialog bimbingan yang memandu penalaran siswa secara terarah tanpa hukuman visual yang menurunkan motivasi.

### Tiga Prinsip Utama UI/UX:
1. **Dynamic 3D Spatial Canvas (Web-First):**
   * Mengutamakan visualisasi bentuk ruang interaktif (Three.js WebGL) sebagai jangkar pemahaman sebelum siswa masuk ke simbol matematika abstrak.
2. **Non-Punitive Feedback (Warna Amber vs Merah):**
   * Menghindari tanda silang merah besar ($\times$) yang menimbulkan *epistemic shame* (rasa malu intelektual).
   * Menggunakan warna **Amber (Epistemic Friction)** yang memberi sinyal edukatif: *"Di titik ini ada ketidaksesuaian nalar yang menarik untuk diselidiki bersama"*.
3. **Adaptive Dual-Mode Presentation:**
   * **Projector Mode:** Skema warna kontras tinggi, teks bimbingan berukuran besar agar terbaca jelas hingga baris belakang kelas, dan tombol "Focus Mode" untuk menyembunyikan chat saat guru ceramah.
   * **Smart Board Touch Mode:** Area sentuh virtual ramah jari (min. 48x48 px), mendukung rotasi 1 jari, zoom cubit 2 jari, dan coretan pena stylus.

---

## 2. DESIGN TOKENS & COLOR PALETTE

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COLOR TOKEN MATRIX                              │
├───────────────────┬──────────────┬─────────────┬───────────────────────┤
│ Token Name        │ Hex Code     │ HSL Value   │ Semantic Role         │
├───────────────────┼──────────────┼─────────────┼───────────────────────┤
│ --bg-deep         │ #020617      │ 222, 84%, 5%│ Canvas Base Dark      │
│ --bg-surface      │ #0F172A      │ 222, 47%, 11│ Card & Panel Surface  │
│ --bg-elevated     │ #1E293B      │ 217, 33%, 17│ Active Hover / Border │
│ --text-primary    │ #F8FAFC      │ 210, 40%, 98│ Headings & Math KaTeX │
│ --text-secondary  │ #94A3B8      │ 215, 16%, 65│ Helper & Descriptions │
│ --accent-brand    │ #1E3A8A      │ 224, 64%, 33│ ZAP Primary Identity  │
│ --accent-focus    │ #38BDF8      │ 199, 89%, 60│ Selection & Primary CT│
│ --amber-glitch    │ #F59E0B      │ 38, 92%, 50%│ Cognitive Breakpoint  │
│ --emerald-aha     │ #10B981      │ 161, 94%, 30│ Valid Step / Solution │
└───────────────────┴──────────────┴─────────────┴───────────────────────┘
```

---

## 3. LAYOUT ARSITEKTUR: SPLIT-VIEW WORKSPACE

Antarmuka ZAP mengadopsi tata letak dua bilah (*Split-View Workspace*):

```
┌────────────────────────────────────────────────────────────────────────┐
│  ZAP (Zero Answer Policy)         [1-Click: Google 🟢] [Mode Proyektor]│
├───────────────────────────────────┬────────────────────────────────────┤
│ 📐 KANVAS 3D INTERAKTIF (THREE.JS)│ 💬 BIMBINGAN SOKRATIK              │
│                                   │                                    │
│   [ Parabola / Bangun Ruang 3D ]  │  Siswa: "Berapa nilai x?"          │
│   (Bisa di-rotasi, zoom, slice)   │                                    │
│                                   │  ZAP:                              │
│   Slider Parameter:               │  "Coba amati titik potong pada     │
│   Radius (r): [───●───────] 4.2   │   sumbu-X di kanvas sebelah kiri.  │
│   Tinggi (h): [──────●────] 8.0   │   Berapakah nilai koordinat Y      │
│                                   │   pada posisi tersebut?"           │
│   [ Rotasi 360° ] [ Iris Bidang ] │                                    │
├───────────────────────────────────┴────────────────────────────────────┤
│ ✍️ Input Formula / Deret Langkah Aljabar: f(x) = (x+3)^2 - 4   [Kirim] │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. AKSESIBILITAS & ZERO-SETUP ONBOARDING

1. **1-Click Google Authentication:**
   * Menggantikan formulir registrasi yang rumit dengan tombol tunggal yang langsung terhubung ke akun Google pengguna.
2. **Model Indicator Badge:**
   * Menampilkan lencana status model di sudut kanan atas:
     * 🟢 *Tutor Aktif: Gemini (Google Baseline)*
     * 🟣 *Tutor Aktif: ChatGPT (User Connected)*
3. **Typography Standard:**
   * Menggunakan KaTeX untuk rendering notasi matematika dengan akselerasi hardware agar simbol akar, pecahan, dan integral tampil sempurna tanpa patah.
