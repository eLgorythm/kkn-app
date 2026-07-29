# 📌 Rundown & Proker KKN Interactive Web App

Aplikasi web interaktif untuk mengelola, memantau, dan mengalokasikan program kerja serta rundown kegiatan Kuliah Kerja Nyata (KKN) secara *real-time*. Didesain dengan antarmuka yang bersih, responsif, dan mudah digunakan oleh seluruh anggota tim.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

---

## ✨ Fitur Utama

- 🔄 **Real-Time Database Sync**: Integrasi langsung dengan **Firebase Firestore** untuk sinkronisasi data antar anggota tim secara instan.
- 📅 **Filter Berdasarkan Minggu**: Navigasi cepat dari Minggu 1 hingga Minggu 6.
- 🏷️ **Status & Prioritas Kegiatan**:
  - **Status**: *Belum*, *Sedang Berjalan*, *Selesai*.
  - **Prioritas**: 🔴 *Tinggi*, 🟠 *Sedang*, 🟢 *Rendah*.
- 📊 **Kartu Statistik Interaktif**: Ringkasan jumlah kegiatan (*Selesai*, *Belum*, *Hari Ini*, *Besok*).
- 📈 **Progress Bar**: Pelacakan progres keterlaksanaan kegiatan (Mingguan & Full Overall Progress).
- ⚡ **Auto-Seed Data Default**: Pengisian otomatis 27 data rundown kegiatan awal jika database kosong.
- 📥 **Export to CSV & Print / PDF**: Kemudahan mengekspor data rundown ke spreadsheet atau mencetak langsung dengan format rapi.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, Tailwind CSS (via CDN), FontAwesome icons, Vanilla JavaScript ES6.
- **Backend / Database**: Firebase Firestore (Modular SDK v10).
- **Font**: Google Fonts (*Plus Jakarta Sans*).

---

## 🚀 Cara Penggunaan / Instalasi

1. **Clone Repositori**
   ```bash
   git clone https://github.com/eLgorythm/kkn-app
   cd kkn-app
