# PANDUAN PENGGUNAAN & DOKUMENTASI SISTEM SI-ANSOR
*Sistem Informasi Administrasi & Presensi Kaderisasi GP Ansor (Real-Time Hybrid Cloud)*

---

## 1. PENDAHULUAN
**SI-ANSOR** adalah platform sistem informasi dan manajemen presensi kaderisasi terpadu untuk Gerakan Pemuda Ansor. Aplikasi ini dirancang dengan arsitektur **Hybrid Cloud-Offline First** yang tangguh, menggunakan **React + Vite** di sisi klien dan terintegrasi secara real-time dengan **Supabase Cloud** di sisi server, serta didukung oleh penyimpanan cadangan **Local Storage** pada browser web.

Aplikasi ini mendukung konsep **Multi-Tenant berbasis Wilayah (Kabupaten/Kota)**, di mana data kader, presensi, sesi kelas, dan operator diisolasi secara aman per wilayah masing-masing, sementara peran **Super Admin** memiliki kendali penuh secara global.

---

## 2. ARSITEKTUR UTAMA & SINKRONISASI DATA
SI-ANSOR memadukan fleksibilitas aplikasi offline dengan kekuatan sinkronisasi database cloud:
1. **Mode Offline (Local Storage):** Semua aktivitas input peserta, perubahan sesi, dan pencatatan presensi disimpan langsung di browser. Sistem tetap berfungsi penuh tanpa koneksi internet.
2. **Sinkronisasi Dua Arah (Supabase Cloud):** Ketika koneksi internet tersedia, sistem secara cerdas melakukan rekonsiliasi data. Menghindari duplikasi, memperbarui record terbaru, dan mengunggah berkas multimedia.
3. **Penyimpanan Berkas Foto Efisien:** Pengunggahan foto profil kader dikompresi secara otomatis ke resolusi optimal (160x160 piksel) sebelum diunggah ke **Supabase Storage Bucket (`peserta_photos`)**, menghasilkan penyimpanan tautan (path URL) yang pendek, rapi, dan menghemat beban jaringan internet.

---

## 3. FITUR DAN ANTARMUKA MODUL APLIKASI

Sistem ini dibagi menjadi 11 tab menu utama yang interaktif:

### 📑 1. Dashboard Utama (Ringkasan Wilayah)
*   **Fungsi Utama:** Menyediakan panel kontrol informatif mengenai kondisi umum kaderisasi di wilayah operator saat ini.
*   **Elemen Tampilan:**
    *   **Peta Interaktif Sebaran (Leaflet Map):** Visualisasi peta wilayah Jawa Barat dan sekitarnya dengan penanda lokasi kaderisasi aktif di setiap Kabupaten/Kota.
    *   **Metrik Statistik:** Jumlah total peserta terdaftar, tingkat rata-rata kehadiran presensi, dan persentase tingkat kelulusan kader.
    *   **Status Koneksi Database:** Indikator visual real-time apakah aplikasi terhubung ke Supabase Cloud atau berjalan offline.
    *   **Bilah Pengumuman Instansi:** Menampilkan teks berjalan (running text) sesuai kustomisasi branding yang dipilih.

### 👑 2. Super Dashboard (Khusus Super Admin)
*   **Fungsi Utama:** Panel kontrol global untuk mengawasi seluruh aktivitas kaderisasi di berbagai Kabupaten/Kota.
*   **Elemen Tampilan:**
    *   **Bento Grid Sebaran Wilayah:** Menampilkan kartu statistik per Kabupaten/Kota secara detail.
    *   **Grafik Analitik (Recharts):** Visualisasi tren pendaftaran kader baru, keaktifan presensi, dan performa kelulusan.
    *   **Log Aktivitas Sistem:** Riwayat sinkronisasi dan tindakan operator secara real-time.

### 🔍 3. Scan Kehadiran Kader (Presensi Kilat)
*   **Fungsi Utama:** Mencatat kehadiran peserta pada sesi kelas yang sedang berjalan menggunakan teknologi QR Code atau input manual ID Card.
*   **Elemen Tampilan:**
    *   **Umpan Scanner Kamera:** Pemindai QR Code otomatis yang dapat mengenali kode identitas kader secara instan.
    *   **Panel Validasi Presensi:** Menampilkan informasi foto profil, nama kader, asal utusan, dan status kehadiran saat di-scan.
    *   **Sistem Peringatan Pintar:** Notifikasi suara dan visual jika terjadi duplikasi absen pada sesi yang sama, atau jika peserta terlambat melewati batas toleransi keterlambatan sesi.

### 📋 4. Kelola Sesi & Kurikulum (Silabus Kelas)
*   **Fungsi Utama:** Mengatur rangkaian jadwal materi kaderisasi, pembicara, durasi waktu, serta batasan aturan toleransi kedisiplinan.
*   **Elemen Tampilan:**
    *   **Formulir Sesi Utama:** Input Nomor Sesi (ID), Judul Bahasan/Topik Materi, Nama Narasumber/Instruktur, Waktu Mulai, Durasi Sesi (menit), Toleransi Keterlambatan (menit), dan Limit Izin Toilet (menit).
    *   **Tabel Daftar Sesi:** Daftar seluruh sesi materi kaderisasi yang tersimpan di database. Mendukung aksi mengedit detail sesi, menghapus sesi, dan menandai salah satu sesi sebagai **"Sesi Aktif"** (yang akan terhubung langsung ke modul Scanner dan Timer).
    *   **Mekanisme Redudansi 12 Sesi Standard:** Sistem otomatis memuat dan mengamankan 12 sesi kurikulum wajib yang disinkronkan secara fleksibel lintas wilayah.

### 👥 5. Daftar Anggota Kader (Manajemen Peserta)
*   **Fungsi Utama:** Basis data profil kader lengkap dengan manajemen identitas dan pencetakan kartu fisik.
*   **Elemen Tampilan:**
    *   **Pencarian & Penyaringan Canggih:** Memfilter kader berdasarkan nama, nomor ID, delegasi utusan, dan status kelulusan.
    *   **Formulir Input Kader Baru:** Menambahkan data kader (Nama, Utusan/Anak Cabang, Nomor Telepon, Status Bayar, Pas Foto).
    *   **Unggah Foto Profil Otomatis:** Fasilitas *drag-and-drop* berkas foto yang langsung dikompresi ke format JPEG berkualitas tinggi untuk memperkecil beban penyimpanan data.
    *   **Cetak Kartu ID Card & QR Code:** Melakukan cetak (print layout) kartu tanda peserta secara massal atau per individu dengan desain profesional dan barcode QR unik.

### 📊 6. Laporan Rekap Presensi (Matriks Kehadiran)
*   **Fungsi Utama:** Menyediakan data kehadiran menyeluruh untuk seluruh sesi kelas secara transparan.
*   **Elemen Tampilan:**
    *   **Tabel Matriks Grid:** Kolom baris menampilkan seluruh nama kader, dan kolom samping menunjukkan daftar seluruh sesi kaderisasi (Sesi 1 sampai Sesi Terakhir).
    *   **Ikon Status Presensi:** Visualisasi yang jelas menggunakan warna:
        *   🟢 **Hadir Tepat Waktu (H):** Kader hadir sebelum batas waktu toleransi terlambat.
        *   🟡 **Terlambat (T):** Kader hadir setelah batas waktu toleransi, namun sebelum sesi berakhir.
        *   🔴 **Alpa/Absen (A):** Kader tidak melakukan pemindaian presensi pada sesi tersebut.
    *   **Ekspor Data:** Fitur ekspor laporan ke format ramah cetak atau tabel siap pakai.

### 🎓 7. Hasil Evaluasi Kelulusan & Cetak Sertifikat
*   **Fungsi Utama:** Melakukan penilaian akhir kaderisasi secara objektif dan memproduksi sertifikat kelulusan resmi.
*   **Elemen Tampilan:**
    *   **Mesin Keputusan AI (Decision Tree C4.5):** Algoritma yang menganalisis persentase kehadiran sesi wajib, nilai ujian akhir, tingkat kedisiplinan keterlambatan, dan status administrasi untuk menyimpulkan keputusan kelulusan secara otomatis (*Lulus / Tidak Lulus / Lulus Bersyarat*).
    *   **Visualizer Pohon Keputusan:** Diagram interaktif yang menjelaskan bagaimana AI mengambil keputusan kelulusan peserta.
    *   **Cetak Sertifikat Kelulusan Resmi:** Fitur cetak sertifikat beresolusi tinggi dengan layout halaman depan (nama, predikat, nomor sertifikat) dan halaman belakang (daftar mata pelajaran/kurikulum sesi yang diikuti lengkap dengan bobot durasi jam pelajaran).

### 🛠️ 8. Hak Akses Operator (Manajemen Tim)
*   **Fungsi Utama:** Mengelola akun operator pendukung di setiap wilayah administratif.
*   **Elemen Tampilan:**
    *   **Manajemen Akun:** Menambahkan akun baru dengan hak spesifik (*Admin Wilayah / Operator Lapangan*).
    *   **Isolasi Multi-Tenant:** Membatasi akses data agar operator dari Kabupaten A tidak dapat melihat atau mengubah data milik Kabupaten B.

### 👨‍🏫 9. Data Instruktur & Materi
*   **Fungsi Utama:** Pusat manajemen profil narasumber, jajaran tim instruktur pembimbing, dan riwayat materi pengajaran.
*   **Elemen Tampilan:**
    *   **Akumulasi Jam Mengajar:** Menghitung total durasi kelas yang dipandu oleh masing-masing instruktur.
    *   **Daftar Topik Keahlian:** Mengelompokkan instruktur berdasarkan bidang materi kaderisasi keorganisasian atau keagamaan.

### 🎨 10. Kustomisasi Aplikasi (Branding Setelan)
*   **Fungsi Utama:** Memodifikasi aspek visual aplikasi agar sesuai dengan identitas penyelenggara setempat.
*   **Elemen Tampilan:**
    *   **Ubah Logo & Nama Instansi:** Mengganti ikon utama aplikasi dan kop surat pada cetakan dokumen.
    *   **Gaya Desain & Tema Warna:** Memilih tema warna dominan (misalnya hijau khas Ansor, emas, atau biru) dan beralih ke Mode Gelap (Dark Mode) yang nyaman untuk mata operator.

### ⏱️ 11. Waktu Digital & Timer Presentasi
*   **Fungsi Utama:** Memandu jalannya forum kelas agar penyampaian materi instruktur tepat waktu.
*   **Elemen Tampilan:**
    *   **Jam Digital Real-Time:** Menampilkan waktu saat ini dengan presisi tinggi.
    *   **Penghitung Mundur (Countdown Timer):** Timer besar interaktif yang dapat disinkronkan langsung dengan durasi menit dari Sesi Aktif yang sedang berjalan. Dilengkapi alarm visual berkedip merah saat waktu mendekati batas akhir penyampaian materi.

---

## 4. SKEMA TABEL DATABASE SUPABASE
Berikut adalah struktur tabel inti yang digunakan di server Supabase Cloud untuk mendukung sinkronisasi multi-wilayah:

| Nama Tabel | Kolom Utama (Primary & Foreign Keys) | Fungsi Penyimpanan |
| :--- | :--- | :--- |
| `peserta` | `id` (PK), `nama`, `utusan`, `no_telp`, `status_bayar`, `status_kelulusan`, `foto`, `kab_kota` | Menyimpan profil dan identitas kader peserta. |
| `sesi` | `num` (PK), `materi`, `instruktur`, `startTime`, `duration`, `maxLate`, `toiletLimit`, `active`, `kab_kota` | Menyimpan jadwal kurikulum dan konfigurasi sesi. |
| `presensi` | `db_id` (PK), `id` (FK), `nama`, `utusan`, `sesi` (FK), `materi`, `status`, `waktu_scan`, `kab_kota` | Log kehadiran peserta pada setiap sesi kelas. |
| `tim` | `username` (PK), `password`, `nama`, `peran`, `kab_kota` | Akun kredensial login operator wilayah. |
| `branding`| `id` (PK), `nama_instansi`, `logo`, `running_text`, `tema`, `kab_kota` | Konfigurasi visual kop surat dan tampilan aplikasi. |

---

## 5. ALUR KERJA OPERASIONAL SANKSI & KEDISIPLINAN (PANDUAN OPERATOR)
Untuk memulai kegiatan kaderisasi baru, jalankan alur berikut:
1. **Langkah 1 (Kustomisasi):** Masuk ke tab **Kustomisasi Aplikasi** untuk menyesuaikan nama kegiatan, logo, dan hubungkan Supabase API key wilayah Anda.
2. **Langkah 2 (Daftar Sesi):** Periksa kurikulum di tab **Kelola Sesi**. Pastikan seluruh 12 sesi wajib telah terkonfigurasi dengan nama instruktur pengampu kelas masing-masing.
3. **Langkah 3 (Input Kader):** Daftarkan profil peserta di tab **Daftar Anggota Kader**, ambil foto profil langsung melalui kamera laptop/HP (akan otomatis terkompresi hemat kuota), kemudian cetak kartu ID Card yang memuat kode QR peserta.
4. **Langkah 4 (Presensi Kelas):** Sebelum kelas dimulai, pilih sesi tersebut di tab **Kelola Sesi** dan klik tombol **"Tandai Sesi Aktif"**. Beralih ke tab **Scan Kehadiran**, arahkan kartu QR peserta ke kamera scanner untuk mencatatkan kehadiran.
5. **Langkah 5 (Evaluasi Akhir):** Setelah seluruh sesi selesai, kunjungi tab **Hasil Evaluasi Kelulusan**, klik **"Jalankan Analisis AI Kelulusan C4.5"**, periksa daftar peserta yang lulus, dan cetak sertifikat kelulusan fisik bolak-balik dalam satu klik mudah!
