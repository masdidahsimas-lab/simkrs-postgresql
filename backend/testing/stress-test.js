
require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const JUMLAH_DATA = 1000;
const CSV_PATH = path.join(__dirname, 'mahasiswa_uji.csv');

const namaDepan = [
  'Andi', 'Budi', 'Citra', 'Dewi', 'Eka',
  'Fajar', 'Gita', 'Hana', 'Indra', 'Joko',
  'Karin', 'Lina', 'Maya', 'Nanda', 'Putri'
];

const namaBelakang = [
  'Saputra', 'Pratama', 'Permata', 'Lestari',
  'Wijaya', 'Ramadhan', 'Kusuma', 'Anggraini',
  'Firmansyah', 'Setiawan'
];

const programStudi = [
  'Sistem Informasi',
  'Informatika',
  'Manajemen',
  'Akuntansi'
];

function buatData() {
  const data = [];

  for (let i = 1; i <= JUMLAH_DATA; i++) {
    const depan = namaDepan[Math.floor(Math.random() * namaDepan.length)];
    const belakang = namaBelakang[
      Math.floor(Math.random() * namaBelakang.length)
    ];

    data.push({
      nim: `UJI${String(i).padStart(6, '0')}`,
      nama: `${depan} ${belakang}`,
      program_studi: programStudi[
        Math.floor(Math.random() * programStudi.length)
      ],
      email: `mahasiswa${i}@contoh.test`
    });
  }

  return data;
}

function buatCSV(data) {
  const header = 'nim,nama,program_studi,email';

  const baris = data.map(item =>
    [
      item.nim,
      item.nama,
      item.program_studi,
      item.email
    ].join(',')
  );

  fs.writeFileSync(
    CSV_PATH,
    [header, ...baris].join('\n'),
    'utf8'
  );

  console.log(`CSV berhasil dibuat: ${CSV_PATH}`);
}

async function insertSatuPerSatu(data) {
  const client = await pool.connect();
  const mulai = performance.now();

  try {
    await client.query('BEGIN');

    for (const item of data) {
      await client.query(
        `INSERT INTO testing.mahasiswa_uji_satuan
         (nim, nama, program_studi, email)
         VALUES ($1, $2, $3, $4)`,
        [
          item.nim,
          item.nama,
          item.program_studi,
          item.email
        ]
      );
    }

    await client.query('COMMIT');
    return performance.now() - mulai;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function insertBatch(data) {
  const client = await pool.connect();
  const mulai = performance.now();

  try {
    await client.query('BEGIN');

    const values = [];
    const placeholders = [];

    data.forEach((item, index) => {
      const posisi = index * 4;

      placeholders.push(
        `($${posisi + 1}, $${posisi + 2}, $${posisi + 3}, $${posisi + 4})`
      );

      values.push(
        item.nim,
        item.nama,
        item.program_studi,
        item.email
      );
    });

    await client.query(
      `INSERT INTO testing.mahasiswa_uji_batch
       (nim, nama, program_studi, email)
       VALUES ${placeholders.join(', ')}`,
      values
    );

    await client.query('COMMIT');
    return performance.now() - mulai;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function ujiCRUD() {
  console.log('\n=== PENGUJIAN CRUD ===');

  const data = buatData();
  buatCSV(data);

  // CREATE
  const waktuSatuan = await insertSatuPerSatu(data);
  const waktuBatch = await insertBatch(data);

  console.log(`CREATE satu per satu: ${waktuSatuan.toFixed(2)} ms`);
  console.log(`CREATE batch: ${waktuBatch.toFixed(2)} ms`);

  // READ
  let mulai = performance.now();

  const hasilBaca = await pool.query(
    `SELECT * FROM testing.mahasiswa_uji_batch`
  );

  const waktuBaca = performance.now() - mulai;

  console.log(`READ: ${hasilBaca.rowCount} data`);
  console.log(`Waktu READ: ${waktuBaca.toFixed(2)} ms`);

  // UPDATE
  mulai = performance.now();

  const hasilUpdate = await pool.query(
    `UPDATE testing.mahasiswa_uji_batch
     SET program_studi = 'Sistem Informasi'
     WHERE nim = $1`,
    ['UJI000001']
  );

  const waktuUpdate = performance.now() - mulai;

  console.log(`UPDATE: ${hasilUpdate.rowCount} baris`);
  console.log(`Waktu UPDATE: ${waktuUpdate.toFixed(2)} ms`);

  // DELETE
  mulai = performance.now();

  const hasilDelete = await pool.query(
    `DELETE FROM testing.mahasiswa_uji_batch
     WHERE nim = $1`,
    ['UJI000001']
  );

  const waktuDelete = performance.now() - mulai;

  console.log(`DELETE: ${hasilDelete.rowCount} baris`);
  console.log(`Waktu DELETE: ${waktuDelete.toFixed(2)} ms`);

  // Verifikasi sisa data
  const jumlahSisa = await pool.query(
    `SELECT COUNT(*) AS jumlah
     FROM testing.mahasiswa_uji_batch`
  );

  console.log(
    `Data tersisa setelah DELETE: ${jumlahSisa.rows[0].jumlah}`
  );

  console.log('\n=== HASIL PENGUJIAN ===');
  console.log(`Jumlah data awal: ${JUMLAH_DATA}`);
  console.log(`Insert satu per satu: ${waktuSatuan.toFixed(2)} ms`);
  console.log(`Insert batch: ${waktuBatch.toFixed(2)} ms`);
  console.log(`Read: ${waktuBaca.toFixed(2)} ms`);
  console.log(`Update: ${waktuUpdate.toFixed(2)} ms`);
  console.log(`Delete: ${waktuDelete.toFixed(2)} ms`);
}

async function main() {
  try {
    await ujiCRUD();
  } catch (error) {
    console.error('\nPENGUJIAN GAGAL:', error.message);
    console.error('Kode error PostgreSQL:', error.code || '-');
  } finally {
    await pool.end();
  }
}

main();
