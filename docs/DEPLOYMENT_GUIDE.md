# Panduan Deployment & Konfigurasi Domain chatzap.web.id

Dokumen ini menjelaskan tata cara deployment ZAP (Zero Answer Policy) ke domain **`chatzap.web.id`** yang telah aktif di DataByte Cloud, arsitektur database (PostgreSQL vs SQLite), serta petunjuk langkah-demi-langkah.

---

## 1. Arsitektur Deployment & Alokasi Database

### A. Apakah Pakai PostgreSQL Saja? Bagaimana Pembagiannya?

Di aplikasi ZAP, terdapat **2 jenis data** dengan karakteristik yang berbeda:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             ZAP DATA ARCHITECTURE                                │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│ 1. Math Corpus & Knowledge Base        │ 2. User Accounts, Chats & Sync          │
│    (Soal Kurikulum, Teorema, Geometri) │    (Akun Google, Riwayat Sesi, BYOK)    │
├────────────────────────────────────────┼─────────────────────────────────────────┤
│ • Disimpan di: SQLite (data/*.db)      │ • Disimpan di: PostgreSQL               │
│ • Sifat: Read-Heavy, Embedded di CAS   │ • Sifat: Relasional, Multi-user, ACID   │
│ • Latensi: < 1 ms (tanpa round-trip)   │ • Enkripsi: AES-256-GCM (UU PDP)        │
└────────────────────────────────────────┴─────────────────────────────────────────┘
```

1. **Math Knowledge Base (`data/zap_math_corpus.db`):**
   - Tetap berada di **SQLite lokal** di dalam container/folder backend.
   - **Alasannya:** Mesin deterministik SymPy membaca ratusan baris aljabar per detik. Dengan SQLite lokal di container backend, pembacaan data terjadi instan (**< 1 milidetik**) tanpa latency jaringan keluar server.

2. **User Data, Sesi Percakapan & Kredensial Terenkripsi (`zapcore`):**
   - Menggunakan **PostgreSQL**.
   - Menangani tabel `users`, `sessions`, `connectors` (kunci API AI terenkripsi), dan `conversations`.

### B. Di Mana Database PostgreSQL Ditaruh?

Anda memiliki 2 opsi terbaik:

* **Opsi 1 — Managed Cloud Postgres (Paling Praktis, Tanpa Beban VPS):**
  - Gunakan layanan gratis seperti **Neon.tech** (Serverless Postgres) atau **Supabase**.
  - **Kelebihan:** Auto-backup, high availability, ada dashboard GUI web, dan tidak memakan RAM/CPU VPS Anda.
  - Cukup pasang connection string di file `.env`:
    ```env
    DATABASE_URL=postgresql://user:password@ep-cool-sample.ap-southeast-1.aws.neon.tech/zap_production?sslmode=require
    ```

* **Opsi 2 — Self-Hosted di VPS DataByte (Hemat, 100% di Server Sendiri):**
  - Sudah disediakan di [`docker-compose.yml`](file:///C:/Users/wakhidpangestu/orca/projects/logicodix/docker-compose.yml) proyek ini.
  - Begitu Anda menjalankan `docker compose up -d`, service `postgres:16-alpine` otomatis berjalan di port 5432 dengan data tersimpan aman di volume Docker `postgres_data`.

---

## 2. Pengaturan DNS di Dashboard DataByte Cloud

Berdasarkan halaman dashboard domain Anda di DataByte Cloud (`anastasia.ns.cloudflare.com` & `trevor.ns.cloudflare.com`):

### Skenario Rekomendasi (Frontend Vercel + Backend VPS DataByte)

| Tipe | Nama / Host | Nilai / Target | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Preset** | `@` & `www` | **Vercel Deploy** *(1-Click Preset)* | Mengarahkan web utama ke Vercel CDN global |
| **A** | `api` | `<IP_VPS_DATABYTE>` | Endpoint microservice Python FastAPI |

> **Cara Setup di Dashboard DataByte:**
> 1. Pada kotak **1-CLICK DNS INTEGRATIONS / PRESETS**, klik tombol **"Vercel Deploy"** untuk otomatis membuat DNS record frontend.
> 2. Klik tombol hitam **"+ Tambah Record"**:
>    - **Tipe:** `A`
>    - **Nama/Host:** `api`
>    - **Nilai/Target:** Masukkan IP Publik VPS DataByte Anda (misal `103.xxx.xxx.xxx`)
>    - **TTL:** Auto

---

### Skenario All-in-One (Semua Berjalan di 1 VPS DataByte via Docker)

Jika Anda ingin frontend, backend, dan database berjalan bersamaan di 1 VPS DataByte:

| Tipe | Nama / Host | Nilai / Target |
| :--- | :--- | :--- |
| **A** | `@` | `<IP_VPS_DATABYTE>` |
| **CNAME** | `www` | `chatzap.web.id` |
| **A** | `api` | `<IP_VPS_DATABYTE>` |

---

## 3. Langkah Menjalankan Aplikasi di VPS (Docker Compose)

File container [`backend/Dockerfile`](file:///C:/Users/wakhidpangestu/orca/projects/logicodix/backend/Dockerfile), [`frontend/Dockerfile`](file:///C:/Users/wakhidpangestu/orca/projects/logicodix/frontend/Dockerfile), dan [`docker-compose.yml`](file:///C:/Users/wakhidpangestu/orca/projects/logicodix/docker-compose.yml) sudah disiapkan dan siap dijalankan:

### Langkah 1: Clone Repositori di VPS
```bash
git clone https://github.com/wakhidpangestu/ZAP.git
cd ZAP
```

### Langkah 2: Buat File `.env` Produksi
```bash
cp .env.example .env
nano .env
```
Isi konfigurasi produksi:
```env
NEXT_PUBLIC_BACKEND_URL=https://api.chatzap.web.id
ZAP_JWT_SECRET=buat_kunci_rahasia_acak_panjang_disini
ZAP_MASTER_SECRET=buat_passphrase_enkripsi_vault_disini
DATABASE_URL=postgresql://zap_user:zap_secure_pass@postgres:5432/zap_production
```

### Langkah 3: Build & Jalankan Container
```bash
docker compose up -d --build
```

Periksa status container:
```bash
docker compose ps
docker compose logs -f
```

---

## 4. Reverse Proxy Nginx & SSL (HTTPS Gratis) di VPS

Gunakan Nginx dan Certbot di VPS untuk menangani domain HTTPS:

```nginx
# /etc/nginx/sites-available/chatzap.conf

# 1. Backend API (api.chatzap.web.id)
server {
    server_name api.chatzap.web.id;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. Frontend Web (Jika di-host di VPS yang sama pada port 3000)
server {
    server_name chatzap.web.id www.chatzap.web.id;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan SSL gratis dengan Certbot:
```bash
sudo certbot --nginx -d chatzap.web.id -d www.chatzap.web.id -d api.chatzap.web.id
```
*(Catatan: Karena DataByte Anycast DNS menggunakan infrastruktur Cloudflare, SSL fleksibel/full juga otomatis aktif jika proxy diaktifkan).*
