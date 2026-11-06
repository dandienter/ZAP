# DESIGN SYSTEM & UI/UX SPECIFICATION: "COGNITIVE DIFF" (V2.0 REVISED)

---

## 1. FILOSOFI DESAIN & METAFORA VISUAL

Desain antarmuka **NalarAI** dirancang berdasarkan paradigma **"Cognitive Diff"**. 

Sebagaimana seorang software engineer menggunakan *code diff* untuk melacak di mana letak bug dalam suatu alur kode, siswa menggunakan NalarAI untuk melihat di baris mana asumsi model berpikir mereka mulai menyimpang dari konsistensi matematika.

### Tiga Prinsip Utama UI/UX:
1. **Non-Punitive Feedback (Warna Amber vs Merah):**
   * Menghindari tanda silang merah besar ($\times$) yang menimbulkan *epistemic shame* (rasa malu intelektual).
   * Menggunakan warna **Amber (Epistemic Friction)** yang memberi sinyal: *"Di baris ini ada paradoks yang menarik untuk diselidiki"*.
2. **Dual-Pane Focused Workspace:**
   * Mempertahankan visibilitas artefak fisik siswa (kertas buram) berdampingan dengan instrumen refleksi kognitif.
3. **Scaffolding Progresif (Bertahap):**
   * Petunjuk tidak membeberkan jawaban. Level 1 hanya berupa pertanyaan pemantik. Level 2 menyajikan kontradiksi numerik. Level 3 baru memberikan analogi geometris.

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
│ --accent-focus    │ #38BDF8      │ 199, 89%, 60│ Selection & Primary CT│
│ --amber-glitch    │ #F59E0B      │ 38, 92%, 50%│ Cognitive Breakpoint  │
│ --emerald-aha     │ #10B981      │ 161, 94%, 30│ Valid Step / Solution │
└───────────────────┴──────────────┴─────────────┴───────────────────────┘
```

---

## 3. ALUR ANTARMUKA & WORKSPACE DUAL-PANE

### Tahap 1: Modal "Tinjau Hasil Transkripsi" (Human-in-the-Loop)
Sebelum masuk ke konsol diagnosa, siswa disodori popover verifikasi teks sederhana:
```
┌────────────────────────────────────────────────────────────────────────┐
│ 🔍 TINJAU HASIL BACAAN CORETANMU                                       │
│ Pastikan rumus tulisan tanganmu terbaca dengan tepat:                  │
├────────────────────────────────────────────────────────────────────────┤
│ Baris 1: f(x) = (x + 3)^2 - 4                      [Edit ✎] [✓ Cocok]  │
│ Baris 2: f(x) = x^2 + 9 - 4                        [Edit ✎] [✓ Cocok]  │
│ Baris 3: f(x) = x^2 + 5                            [Edit ✎] [✓ Cocok]  │
├────────────────────────────────────────────────────────────────────────┤
│ [ Batalkan ]                             [ Mulai Diagnosa Logika ➔ ]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Tahap 2: Layar Utama Dual-Pane Workspace

```
┌────────────────────────────────────────┬────────────────────────────────────────┐
│  PANEL KIRI: SCRATCHPAD INSPECTOR      │  PANEL KANAN: THE SOCRATIC CONSOLE     │
├────────────────────────────────────────┼────────────────────────────────────────┤
│ [Top Toolbar: Upload | Zoom | Re-crop] │ [Status: First Fault Isolated (Line 2)]│
│                                        │                                        │
│  Foto Kertas Buram Siswa:              │ ┌────────────────────────────────────┐ │
│  ┌──────────────────────────────────┐  │ │ ⚠️ Miskonsepsi Terdeteksi          │ │
│  │ (1) f(x) = (x + 3)^2 - 4   [OK]  │  │ │ Ilusi Ekspansi Kuadrat             │ │
│  │ -------------------------------- │  │ └────────────────────────────────────┘ │
│  │ (2) f(x) = x^2 + 9 - 4 [AMBER ⚠️]│  │                                        │
│  │     ╭──────────────────────╮     │  │ 💬 Pertanyaan Sokrates (Level 1):    │ │
│  │     │ Bounding Box Pulse   │     │  │ "Di baris ke-2, apa yang terjadi     │ │
│  │     ╰──────────────────────╯     │  │  ketika kamu membuka tanda kurung    │ │
│  │ (3) f(x) = x^2 + 5               │  │  pada bentuk kuadrat?"               │ │
│  └──────────────────────────────────┘  │                                        │
│                                        │ ┌────────────────────────────────────┐ │
│                                        │ │ 🧪 Uji Angka Nyata (Level 2):      │ │
│                                        │ │ Jika x = 2:                        │ │
│                                        │ │ Rumus awal : (2+3)² = 25           │ │
│                                        │ │ Langkahmu  : 2²+9   = 13           │ │
│                                        │ │ Pertanyaan : Mengapa 25 ≠ 13?      │ │
│                                        │ └────────────────────────────────────┘ │
│                                        │                                        │
│                                        │ [Input Jawaban: "Menurutmu kenapa?"]   │
│                                        │ [Tombol: "Periksa Ulang Asumsi Saya"]  │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 4. TINGKATAN PETUNJUK PROGRESIF (SCAFFOLDING LADDER)

Untuk mencegah siswa melihat petunjuk yang langsung membocorkan jawaban:
1. **Level 1 (Socratic Query):** Mendorong siswa melihat kembali operasi di baris tersebut (*"Coba periksa perkalian suku-suku di dalam tanda kurung"*).
2. **Level 2 (Numerical Counter-Example):** Menampilkan perbandingan angka substitusi sederhana ($x = 2$) yang menunjukkan terjadinya ketidaksamaan matematis ($25 \neq 13$).
3. **Level 3 (Conceptual Analogy):** Menampilkan visualisasi kotak persegi berukuran $(a+b) \times (a+b)$ yang memperlihatkan empat area pecahan: $a^2$, $ab$, $ab$, dan $b^2$.
