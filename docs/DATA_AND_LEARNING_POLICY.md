# KEBIJAKAN DATA DAN SELF-LEARNING ZAP

Terakhir diperbarui: 7 November 2026

Dokumen ini mengatur bagaimana basis pengetahuan ZAP tumbuh dari
kontribusi pengguna ("self-learning"), dan pagar apa yang berlaku.
Istilah teknis mengikuti `docs/BACKEND_SYSTEM.md`.

## 1. Prinsip dasar

1. ZAP tidak melatih ulang model bahasa dari data pengguna.
2. Yang tumbuh adalah **basis pengetahuan terkurasi**: kumpulan materi
   matematika yang lolos penyaringan, verifikasi, dan pengelompokan.
3. Tidak ada pengambilan data diam-diam. Materi hanya masuk dari jalur
   kontribusi eksplisit dan hanya dari pengguna yang persetujuan
   berbaginya aktif.

## 2. Jalur masuk materi

1. Tombol berbagi pada sebuah percakapan: pengguna memilih sendiri
   pertukaran mana yang dibagikan.
2. Formulir kontribusi: pengguna mengirim materi (soal dan langkah,
   penjelasan konsep, atau materi ajar) secara sadar untuk basis
   pengetahuan.
3. Di luar dua jalur itu, tidak ada materi pengguna yang masuk ke sistem
   pembelajaran, termasuk isi chat privat, draf coretan, dan kunci API.

## 3. Tahapan pemrosesan

Setiap kontribusi melewati tahapan yang sama dan tercatat statusnya:

1. **Penerimaan dan sidik jari.** Materi di-hash SHA-256. Duplikat
   ditolak otomatis.
2. **Penyaringan.** Pemindaian data pribadi (email, nomor telepon,
   nomor identitas) dengan redaksi otomatis, pemeriksaan kelayakan isi,
   dan penilaian kualitas awal. Materi dengan data pribadi yang tidak
   bisa diredaksi dengan aman akan ditolak.
3. **Verifikasi.**
   - Materi langkah penyelesaian matematika diverifikasi oleh mesin
     deterministik SymPy/CFL: seluruh rantai langkah harus konsisten
     tanpa kesalahan. Statusnya: terverifikasi SymPy.
   - Materi lain dinilai kurator LLM (klasifikasi dan skor kualitas).
     Statusnya: kurasi LLM, dan tidak pernah dilabeli sebagai
     terverifikasi deterministik.
   - Materi di bawah ambang kualitas tidak diterbitkan, apa pun jalur
     verifikasinya.
4. **Pengelompokan.** Materi diterbitkan ke basis pengetahuan dengan
   label topik (antara lain aljabar, geometri, kalkulus, trigonometri,
   statistika, peluang, aritmatika, matriks, vektor) dan label jenjang
   (SD, SMP, SMA, SMK, D3, S1, S2, S3).
5. **Pemakaian.** Tutor Sokratik dan 3D Canvas boleh mengambil materi
   terbit sebagai contoh dan konteks, selalu di bawah pagar Zero Answer
   Policy: materi tidak boleh ditampilkan sebagai jawaban akhir untuk
   soal yang sedang dikerjakan pengguna.

## 4. Hak kontributor

1. Kontributor dapat melihat status setiap materinya (diterima,
   disaring, terverifikasi, diterbitkan, atau ditolak beserta alasannya).
2. Kontributor dapat menarik kontribusinya yang belum diterbitkan kapan
   pun, dan mencabut persetujuan berbagi untuk menghentikan pemrosesan
   baru.
3. Nama kontributor tidak ditampilkan pada materi terbit kecuali
   kontributor memilih untuk ditampilkan.

## 5. Yang tidak akan pernah dilakukan sistem

1. Mengambil isi chat privat untuk pembelajaran tanpa tindakan berbagi
   yang eksplisit dari pemiliknya.
2. Menyimpan atau mempelajari kunci API connector pengguna.
3. Menerbitkan materi berisi data pribadi pihak ketiga.
4. Melabeli hasil kurasi LLM sebagai kebenaran matematis yang
   terverifikasi mesin.

## 6. Audit

Setiap perubahan status kontribusi tercatat dengan waktu, tahap, dan
pelaku (sistem, mesin verifikasi, kurator LLM, atau manusia), sehingga
riwayat pertumbuhan basis pengetahuan dapat diperiksa kembali.
