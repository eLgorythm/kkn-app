# 📌 Rundown & Proker KKN Interactive Web App

Aplikasi web interaktif untuk mengelola, memantau, dan mengalokasikan program kerja serta rundown kegiatan Kuliah Kerja Nyata (KKN) secara *real-time*. Didesain dengan antarmuka yang bersih, responsif, dan mudah digunakan oleh seluruh anggota tim.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## ✨ Fitur Utama

### 📋 Matriks Kegiatan (`index.html`)
- 🔄 **Real-Time Database Sync**: Integrasi langsung dengan **Firebase Firestore** untuk sinkronisasi data antar anggota tim secara instan.
- 📅 **Filter Berdasarkan Minggu**: Navigasi cepat dari Minggu 1 hingga Minggu 6.
- 🏷️ **Status & Prioritas Kegiatan**:
  - **Status**: *Belum*, *Sedang Berjalan*, *Selesai*.
  - **Prioritas**: 🔴 *Tinggi*, 🟠 *Sedang*, 🟢 *Rendah*.
- 📊 **Kartu Statistik Interaktif**: Ringkasan jumlah kegiatan (*Selesai*, *Belum*, *Hari Ini*, *Besok*).
- 📈 **Progress Bar**: Pelacakan progres keterlaksanaan kegiatan (Mingguan & Full Overall Progress).
- 📥 **Export CSV & PDF**: Ekspor data matriks terurut per minggu & tanggal. PDF dibuat langsung via **jsPDF + AutoTable** (tanpa popup/print dialog).
- 🔎 **Filter Lanjutan**: Filter berdasarkan Proker, Status, Prioritas, dan pencarian kata kunci.

### 📅 Rundown Harian (`rundown.html`)
- 🗓️ **Agenda Harian**: Pengelolaan agenda per minggu dengan tab hari (Senin–Minggu).
- 🗃️ **Database Supabase**: Tersimpan realtime di tabel `kkn_rundown` (cloud, tanpa fallback lokal).
- 💬 **Format WA Hari Ini**: Generate pesan WhatsApp siap salin untuk dibagikan ke grup.
- 📥 **Export CSV & PDF**: Ekspor rundown per minggu via jsPDF + AutoTable.
- ✏️ **CRUD Lengkap**: Tambah, edit, hapus agenda dengan field Hari, Waktu, Kategori, Nama Agenda, Lokasi, PJ, Status, dan Catatan.

### 🤖 Bot WhatsApp (`bot.js`)
Bot WhatsApp berbasis [Baileys](https://github.com/whiskeysockets/baileys) yang terhubung ke kedua database:

| Perintah | Fungsi | Sumber Data |
|----------|--------|-------------|
| `!menu` / `!help` | Menampilkan daftar perintah | — |
| `!jadwal` | Daftar kegiatan (mendatang / per minggu `!jadwal [1-6]`) | Matriks (Firestore) |
| `!hariini` / `!today` | Jadwal kegiatan hari ini | Rundown (Supabase) |
| `!besok` / `!tomorrow` | Jadwal kegiatan besok | Rundown (Supabase) |
| `!broadcast` | Rangkuman seluruh agenda | Matriks (Firestore) |
| `!kirim [nomor] [pesan]` | Mengirim pesan ke nomor WA lain | — |
| `!progress` | Statistik & persentase progress | Matriks (Firestore) |
| `!ping` | Tes koneksi bot + latency | — |

> Semua pesan bot ditulis dengan gaya *divisi acara* yang santai, penuh semangat, dan diakhiri tag **0xfndLabs KKN System**.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, Tailwind CSS (via CDN), FontAwesome icons, Vanilla JavaScript ES6.
- **Backend / Database**:
  - **Matriks**: Firebase Firestore (Modular SDK v10) — collection `rundown_kkn`.
  - **Rundown**: Supabase — tabel `kkn_rundown`.
- **Export PDF**: jsPDF + AutoTable.
- **Bot WA**: Node.js, `@whiskeysockets/baileys`, `qrcode-terminal`, `firebase`, `@supabase/supabase-js`.
- **Font**: Google Fonts (*Plus Jakarta Sans* / *Inter*).

---

## 🚀 Cara Penggunaan / Instalasi

1. **Clone Repositori**
   ```bash
   git clone https://github.com/eLgorythm/kkn-app
   cd kkn-app
   ```

2. **Buka Aplikasi Web**
   Jalankan `index.html` (Matriks) dan `rundown.html` (Rundown) di browser, atau deploy ke hosting statis (GitHub Pages, Netlify, Vercel).

3. **Jalankan Bot WhatsApp**
   ```bash
   npm install
   node bot.js
   ```
   Scan QR code yang muncul di terminal dengan WhatsApp > *Linked Devices* > *Link a Device*.

---

## 🗄️ Konfigurasi Database

### Firebase (Matriks — `index.html`)
Kredensial diisi pada `firebaseConfig`. Koleksi `rundown_kkn` dengan struktur:
```js
{
  week: 1,              // int (1-6)
  date: "Selasa, 4 Aug 2026",
  time: "08.00 – 11.00",
  proker: "Proker Sampah",
  priority: "Tinggi",   // Tinggi | Sedang | Rendah
  status: "Selesai",    // Belum | Sedang | Selesai
  activity: "Deskripsi kegiatan",
  updatedAt: "ISO timestamp"
}
```

### Supabase (Rundown — `rundown.html`)
Kredensial diisi pada `SUPABASE_URL` & `SUPABASE_ANON_KEY`. SQL setup tersedia di tombol *SQL Setup* halaman rundown:
```sql
CREATE TABLE IF NOT EXISTS kkn_rundown (
  id TEXT PRIMARY KEY,
  week INT DEFAULT 1,
  day TEXT,
  time TEXT,
  category TEXT,
  title TEXT,
  location TEXT,
  pj TEXT,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kkn_rundown ENABLE ROW LEVEL SECURITY;
-- + policy akses publik
```

---

## 📁 Struktur Proyek

```
kkn/
├── index.html          # Halaman Matriks Kegiatan (Firebase Firestore)
├── rundown.html        # Halaman Rundown Harian (Supabase)
├── bot.js              # WhatsApp Bot
├── package.json        # Dependensi Node.js (bot)
├── README.md
├── assets/
│   └── bot_header.png  # Header/logo bot
└── auth_info_baileys/  # Session autentikasi WhatsApp bot (auto-generated)
```

---

## 📄 Lisensi & Kredit

Dikembangkan oleh **0xfndLabs** untuk keperluan KKN Desa Sokaraja. Seluruh pesan bot ditulis dengan gaya *divisi acara* yang santai dan penuh semangat. 🔥
