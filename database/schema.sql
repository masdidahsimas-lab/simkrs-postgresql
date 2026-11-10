-- SIMKRS PostgreSQL schema
-- Jalankan pada database krs_db setelah membuat database tersebut.
BEGIN;
CREATE TABLE IF NOT EXISTS users (
  id_user BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('mahasiswa','dosen','admin')),
  nama VARCHAR(120) NOT NULL,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dosen (
  id_dosen BIGSERIAL PRIMARY KEY,
  id_user BIGINT NOT NULL UNIQUE REFERENCES users(id_user) ON DELETE CASCADE,
  nidn VARCHAR(30) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS mahasiswa (
  id_mahasiswa BIGSERIAL PRIMARY KEY,
  id_user BIGINT NOT NULL UNIQUE REFERENCES users(id_user) ON DELETE CASCADE,
  id_dosen_wali BIGINT REFERENCES dosen(id_dosen),
  nim VARCHAR(30) NOT NULL UNIQUE,
  program_studi VARCHAR(100) NOT NULL DEFAULT 'Sistem Informasi',
  angkatan SMALLINT NOT NULL DEFAULT 2024,
  semester_aktif SMALLINT NOT NULL DEFAULT 1,
  maksimal_sks SMALLINT NOT NULL DEFAULT 24 CHECK (maksimal_sks BETWEEN 1 AND 30)
);
CREATE TABLE IF NOT EXISTS semester (
  id_semester BIGSERIAL PRIMARY KEY,
  tahun_ajaran VARCHAR(20) NOT NULL,
  periode VARCHAR(10) NOT NULL CHECK (periode IN ('Ganjil','Genap','Pendek')),
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  status_aktif BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (tahun_ajaran, periode),
  CHECK (tanggal_selesai IS NULL OR tanggal_mulai IS NULL OR tanggal_selesai >= tanggal_mulai)
);
CREATE UNIQUE INDEX IF NOT EXISTS satu_semester_aktif ON semester(status_aktif) WHERE status_aktif = TRUE;
CREATE TABLE IF NOT EXISTS mata_kuliah (
  id_matkul BIGSERIAL PRIMARY KEY,
  kode_matkul VARCHAR(20) NOT NULL UNIQUE,
  nama_matkul VARCHAR(150) NOT NULL,
  sks SMALLINT NOT NULL CHECK (sks BETWEEN 1 AND 6),
  program_studi VARCHAR(100) NOT NULL DEFAULT 'Sistem Informasi',
  semester_rekomendasi SMALLINT
);
CREATE TABLE IF NOT EXISTS kelas (
  id_kelas BIGSERIAL PRIMARY KEY,
  id_matkul BIGINT NOT NULL REFERENCES mata_kuliah(id_matkul),
  id_dosen BIGINT NOT NULL REFERENCES dosen(id_dosen),
  id_semester BIGINT NOT NULL REFERENCES semester(id_semester),
  nama_kelas VARCHAR(20) NOT NULL,
  kapasitas INT NOT NULL CHECK (kapasitas > 0),
  harga NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (harga >= 0),
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (id_matkul, id_semester, nama_kelas)
);
CREATE TABLE IF NOT EXISTS jadwal_kelas (
  id_jadwal BIGSERIAL PRIMARY KEY,
  id_kelas BIGINT NOT NULL REFERENCES kelas(id_kelas) ON DELETE CASCADE,
  hari VARCHAR(10) NOT NULL CHECK (hari IN ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')),
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  ruangan VARCHAR(50) NOT NULL,
  CHECK (jam_selesai > jam_mulai),
  UNIQUE (id_kelas, hari, jam_mulai, jam_selesai)
);
CREATE TABLE IF NOT EXISTS keranjang (
  id_keranjang BIGSERIAL PRIMARY KEY,
  id_mahasiswa BIGINT NOT NULL REFERENCES mahasiswa(id_mahasiswa),
  id_semester BIGINT NOT NULL REFERENCES semester(id_semester),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','diajukan','checkout')),
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  diajukan_pada TIMESTAMPTZ,
  checkout_pada TIMESTAMPTZ,
  UNIQUE (id_mahasiswa, id_semester)
);
CREATE TABLE IF NOT EXISTS keranjang_item (
  id_item BIGSERIAL PRIMARY KEY,
  id_keranjang BIGINT NOT NULL REFERENCES keranjang(id_keranjang) ON DELETE CASCADE,
  id_kelas BIGINT NOT NULL REFERENCES kelas(id_kelas),
  status_approval VARCHAR(20) NOT NULL DEFAULT 'menunggu' CHECK (status_approval IN ('menunggu','disetujui','ditolak')),
  catatan_dosen TEXT,
  id_dosen_approval BIGINT REFERENCES dosen(id_dosen),
  tanggal_approval TIMESTAMPTZ,
  harga_saat_ambil NUMERIC(14,2) NOT NULL CHECK (harga_saat_ambil >= 0),
  UNIQUE (id_keranjang, id_kelas)
);
CREATE TABLE IF NOT EXISTS riwayat_approval (
  id_riwayat BIGSERIAL PRIMARY KEY,
  id_item BIGINT NOT NULL REFERENCES keranjang_item(id_item) ON DELETE CASCADE,
  id_dosen BIGINT NOT NULL REFERENCES dosen(id_dosen),
  status VARCHAR(20) NOT NULL CHECK (status IN ('disetujui','ditolak')),
  catatan TEXT,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS krs (
  id_krs BIGSERIAL PRIMARY KEY,
  id_keranjang BIGINT NOT NULL UNIQUE REFERENCES keranjang(id_keranjang),
  id_mahasiswa BIGINT NOT NULL REFERENCES mahasiswa(id_mahasiswa),
  id_semester BIGINT NOT NULL REFERENCES semester(id_semester),
  total_sks SMALLINT NOT NULL,
  total_biaya NUMERIC(14,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','dibatalkan')),
  checkout_pada TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS krs_detail (
  id_krs_detail BIGSERIAL PRIMARY KEY,
  id_krs BIGINT NOT NULL REFERENCES krs(id_krs) ON DELETE CASCADE,
  id_kelas BIGINT NOT NULL REFERENCES kelas(id_kelas),
  sks_saat_ambil SMALLINT NOT NULL,
  harga_saat_ambil NUMERIC(14,2) NOT NULL,
  UNIQUE (id_krs, id_kelas)
);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_wali ON mahasiswa(id_dosen_wali);
CREATE INDEX IF NOT EXISTS idx_kelas_semester ON kelas(id_semester);
CREATE INDEX IF NOT EXISTS idx_jadwal_kelas ON jadwal_kelas(id_kelas);
CREATE INDEX IF NOT EXISTS idx_keranjang_mahasiswa ON keranjang(id_mahasiswa, id_semester);
CREATE INDEX IF NOT EXISTS idx_item_keranjang ON keranjang_item(id_keranjang);
CREATE INDEX IF NOT EXISTS idx_krs_mahasiswa ON krs(id_mahasiswa);

CREATE OR REPLACE VIEW v_kelas_tersedia AS
SELECT kl.id_kelas, mk.id_matkul, mk.kode_matkul, mk.nama_matkul, mk.sks,
       kl.nama_kelas, kl.id_semester, kl.id_dosen, u.nama AS nama_dosen,
       kl.kapasitas, kl.harga, kl.aktif,
       COUNT(DISTINCT kd.id_krs_detail) FILTER (WHERE kr.status = 'aktif')::INT AS terisi,
       GREATEST(kl.kapasitas - COUNT(DISTINCT kd.id_krs_detail) FILTER (WHERE kr.status = 'aktif')::INT, 0) AS sisa_kuota,
       STRING_AGG(j.hari || ' ' || TO_CHAR(j.jam_mulai,'HH24:MI') || '-' || TO_CHAR(j.jam_selesai,'HH24:MI') || ' (' || j.ruangan || ')', ', ' ORDER BY j.id_jadwal) AS jadwal
FROM kelas kl
JOIN mata_kuliah mk ON mk.id_matkul = kl.id_matkul
JOIN dosen d ON d.id_dosen = kl.id_dosen
JOIN users u ON u.id_user = d.id_user
LEFT JOIN jadwal_kelas j ON j.id_kelas = kl.id_kelas
LEFT JOIN krs_detail kd ON kd.id_kelas = kl.id_kelas
LEFT JOIN krs kr ON kr.id_krs = kd.id_krs
GROUP BY kl.id_kelas, mk.id_matkul, mk.kode_matkul, mk.nama_matkul, mk.sks,
         kl.nama_kelas, kl.id_semester, kl.id_dosen, u.nama, kl.kapasitas, kl.harga, kl.aktif;
COMMIT;
