# SIMKRS — Sistem Kartu Rencana Studi

Aplikasi frontend React + Vite, backend Express, dan database PostgreSQL. Alur: login mahasiswa/dosen wali, pilih kelas, keranjang, ajukan KRS, approval dosen wali, checkout.

## 1. Persiapan PostgreSQL

1. Buat database bernama `krs_db` melalui pgAdmin atau psql:
   ```sql
   CREATE DATABASE krs_db;
   ```
2. Pilih database `krs_db`, buka Query Tool, lalu jalankan seluruh file `database/schema.sql`.
3. Buat file `backend/.env` berdasarkan `backend/.env.example`, isi password PostgreSQL yang benar dan ubah `JWT_SECRET` menjadi string acak yang panjang.
4. Jalankan seed demo dari folder backend (lihat langkah berikut).

## 2. Jalankan backend

```bash
cd backend
npm install
# buat .env dari .env.example dan sesuaikan DATABASE_URL
npm run seed
npm run dev
```

Backend berjalan di `http://localhost:3000`. Tes `http://localhost:3000/health`.

## 3. Jalankan frontend

Buka terminal kedua:

```bash
cd frontend
npm install
# opsional: salin .env.example menjadi .env
npm run dev
```

Buka URL Vite yang tampil, biasanya `http://localhost:5173`.

## Akun demo

Semua password demo adalah `123`:

- Mahasiswa: `anggun` / `123`
- Dosen wali: `dosen` / `123`

Akun demo mahasiswa telah dihubungkan ke dosen wali demo. Data mata kuliah, kelas, kuota, jadwal, dan harga dimasukkan oleh `npm run seed`.

## Fitur yang sudah terhubung

- Login memakai password hash bcrypt dan token JWT.
- Mahasiswa melihat kelas dari PostgreSQL, dosen, jadwal, SKS, kuota, dan harga.
- Tambah/hapus kelas di keranjang selama masih berstatus draft.
- Pengajuan keranjang kepada dosen wali yang ditetapkan pada data mahasiswa.
- Dosen wali melihat pengajuan mahasiswa bimbingan dan menyetujui/menolak tiap mata kuliah.
- Mahasiswa melihat status dan catatan persetujuan.
- Checkout hanya berhasil jika semua item disetujui; KRS dan detailnya disimpan di PostgreSQL.
- Validasi duplikasi mata kuliah, kapasitas saat checkout, batas SKS, dan bentrok jadwal saat checkout.

## Catatan

- `database/schema.sql` membuat tabel dan view, bukan membuat database itu sendiri. Buat `krs_db` terlebih dahulu.
- Jangan mengunggah file `.env` atau membagikan password database.
- Ini adalah starter aplikasi akademik untuk pengembangan/proyek kuliah. Untuk produksi, tambahkan HTTPS, rate limiting, audit log, reset password, pengelolaan admin, aturan prasyarat mata kuliah, dan validasi bentrok jadwal lintas transaksi yang lebih ketat.
