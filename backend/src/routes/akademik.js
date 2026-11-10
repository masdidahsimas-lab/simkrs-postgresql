
const router = require('express').Router();
const db = require('../data/db');
const { auth, allow } = require('../middleware/auth');

// Semua endpoint akademik wajib login
router.use(auth);

// =====================================================
// HELPER: MENGAMBIL ATAU MEMBUAT KERANJANG MAHASISWA
// =====================================================

  async function getCart(client, mahasiswaId, semesterId) {
    // Cari keranjang draft yang masih bisa digunakan
    let cart = await client.query(
      `SELECT *
      FROM keranjang
      WHERE id_mahasiswa = $1
        AND id_semester = $2
        AND status = 'draft'
      ORDER BY id_keranjang DESC
      LIMIT 1
      FOR UPDATE`,
      [mahasiswaId, semesterId]
    );

    // Jika belum ada keranjang draft, buat keranjang baru
    if (!cart.rowCount) {
      cart = await client.query(
        `INSERT INTO keranjang
        (id_mahasiswa, id_semester, status)
        VALUES ($1, $2, 'draft')
        RETURNING *`,
        [mahasiswaId, semesterId]
      );
    }

    return cart.rows[0];
  }

// =====================================================
// 1. MENGAMBIL SEMESTER AKTIF
// GET /api/semester-aktif
// =====================================================

router.get('/semester-aktif', async (req, res) => {
  const result = await db.query(
    `SELECT *
     FROM semester
     WHERE status_aktif = TRUE
     LIMIT 1`
  );

  res.json(result.rows[0] || null);
});

// =====================================================
// 2. MENAMPILKAN DAFTAR KELAS
// GET /api/kelas
// =====================================================

router.get('/kelas', allow('mahasiswa', 'admin'), async (req, res) => {
  const semester = await db.query(
    `SELECT id_semester
     FROM semester
     WHERE status_aktif = TRUE
     LIMIT 1`
  );

  if (!semester.rowCount) {
    return res.json([]);
  }

  const result = await db.query(
    `SELECT *
     FROM v_kelas_tersedia
     WHERE id_semester = $1
       AND aktif = TRUE
     ORDER BY kode_matkul, nama_kelas`,
    [semester.rows[0].id_semester]
  );

  res.json(result.rows);
});

// =====================================================
// 3. MELIHAT KERANJANG MAHASISWA
// GET /api/keranjang
// =====================================================

  router.get('/keranjang', allow('mahasiswa'), async (req, res) => {
    const sem = await db.query(
      `SELECT id_semester
      FROM semester
      WHERE status_aktif = TRUE
      LIMIT 1`
    );

    if (!sem.rowCount) {
      return res.json({ keranjang: null, items: [] });
    }

    const c = await db.query(
      `SELECT *
      FROM keranjang
      WHERE id_mahasiswa = $1
        AND id_semester = $2
      ORDER BY
        CASE
          WHEN status = 'draft' THEN 1
          WHEN status = 'diajukan' THEN 2
          ELSE 3
        END,
        id_keranjang DESC
      LIMIT 1`,
      [req.user.id_mahasiswa, sem.rows[0].id_semester]
    );

    if (!c.rowCount) {
      return res.json({ keranjang: null, items: [] });
    }

    const items = await db.query(
      `SELECT
        ki.id_item,
        ki.id_kelas,
        ki.status_approval AS status,
        ki.catatan_dosen,
        ki.harga_saat_ambil AS harga,
        mk.kode_matkul AS kode,
        mk.nama_matkul AS nama,
        mk.sks,
        kl.nama_kelas AS kelas,
        u.nama AS dosen,
        STRING_AGG(
          j.hari || ' ' ||
          TO_CHAR(j.jam_mulai, 'HH24:MI') || '-' ||
          TO_CHAR(j.jam_selesai, 'HH24:MI') ||
          ' (' || j.ruangan || ')',
          ', ' ORDER BY j.id_jadwal
        ) AS jadwal
      FROM keranjang_item ki
      JOIN kelas kl ON kl.id_kelas = ki.id_kelas
      JOIN mata_kuliah mk ON mk.id_matkul = kl.id_matkul
      JOIN dosen d ON d.id_dosen = kl.id_dosen
      JOIN users u ON u.id_user = d.id_user
      LEFT JOIN jadwal_kelas j ON j.id_kelas = kl.id_kelas
      WHERE ki.id_keranjang = $1
      GROUP BY
        ki.id_item,
        ki.id_kelas,
        ki.status_approval,
        ki.catatan_dosen,
        ki.harga_saat_ambil,
        mk.kode_matkul,
        mk.nama_matkul,
        mk.sks,
        kl.nama_kelas,
        u.nama
      ORDER BY ki.id_item`,
      [c.rows[0].id_keranjang]
    );

    res.json({
      keranjang: c.rows[0],
      items: items.rows
    });
  });


// =====================================================
// 4. MENAMBAHKAN MATA KULIAH KE KERANJANG
// POST /api/keranjang/items
// =====================================================

router.post('/keranjang/items', allow('mahasiswa'), async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const semester = await client.query(
      `SELECT id_semester
       FROM semester
       WHERE status_aktif = TRUE
       LIMIT 1`
    );

    if (!semester.rowCount) {
      throw new Error('Belum ada semester aktif.');
    }

    const cart = await getCart(
      client,
      req.user.id_mahasiswa,
      semester.rows[0].id_semester
    );

    if (cart.status !== 'draft') {
      throw new Error('Keranjang sudah diajukan atau checkout.');
    }

    // PERBAIKAN: tabel kelas menggunakan kolom status,
    // bukan kolom aktif.
    const kelas = await client.query(
      `SELECT
         id_kelas,
         id_matkul,
         id_semester,
         harga,
         kapasitas
       FROM kelas
       WHERE id_kelas = $1
         AND status = TRUE`,
      [req.body.id_kelas]
    );

    if (
      !kelas.rowCount ||
      Number(kelas.rows[0].id_semester) !== Number(cart.id_semester)
    ) {
      throw new Error('Kelas tidak tersedia untuk semester aktif.');
    }

    const duplicate = await client.query(
      `SELECT 1
       FROM keranjang_item ki
       JOIN kelas k ON k.id_kelas = ki.id_kelas
       WHERE ki.id_keranjang = $1
         AND k.id_matkul = $2`,
      [cart.id_keranjang, kelas.rows[0].id_matkul]
    );

    if (duplicate.rowCount) {
      throw new Error('Mata kuliah tersebut sudah ada di keranjang.');
    }

    const item = await client.query(
      `INSERT INTO keranjang_item
         (id_keranjang, id_kelas, harga_saat_ambil)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        cart.id_keranjang,
        kelas.rows[0].id_kelas,
        kelas.rows[0].harga
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      item: item.rows[0],
      message: 'Mata kuliah ditambahkan.'
    });

  } catch (error) {
    await client.query('ROLLBACK');

    res.status(400).json({
      message: error.message
    });

  } finally {
    client.release();
  }
});

// =====================================================
// 5. MENGHAPUS MATA KULIAH DARI KERANJANG
// DELETE /api/keranjang/items/:id
// =====================================================

router.delete('/keranjang/items/:id', allow('mahasiswa'), async (req, res) => {
  const result = await db.query(
    `DELETE FROM keranjang_item ki
     USING keranjang k
     WHERE ki.id_keranjang = k.id_keranjang
       AND ki.id_item = $1
       AND k.id_mahasiswa = $2
       AND k.status = 'draft'
     RETURNING ki.id_item`,
    [req.params.id, req.user.id_mahasiswa]
  );

  if (!result.rowCount) {
    return res.status(400).json({
      message: 'Item tidak ditemukan atau keranjang tidak lagi dapat diubah.'
    });
  }

  res.json({
    message: 'Mata kuliah dihapus.'
  });
});

// =====================================================
// 6. MENGAJUKAN KRS KE DOSEN WALI
// POST /api/keranjang/ajukan
// =====================================================

  router.post('/keranjang/ajukan', allow('mahasiswa'), async (req, res) => {
    const result = await db.query(
      `UPDATE keranjang
      SET status = 'diajukan'
      WHERE id_mahasiswa = $1
        AND status = 'draft'
        AND id_semester = (
          SELECT id_semester
          FROM semester
          WHERE status_aktif = TRUE
        )
      RETURNING id_keranjang`,
      [req.user.id_mahasiswa]
    );

    if (!result.rowCount) {
      return res.status(400).json({
        message: 'Keranjang kosong atau sudah pernah diajukan.'
      });
    }

    res.json({
      message: 'Pengajuan KRS berhasil dikirim ke dosen wali.'
    });
  });

  // =====================================================
  // 7. MELIHAT DAFTAR PERSETUJUAN KRS
  // GET /api/persetujuan
  // =====================================================

  router.get('/persetujuan', allow('dosen'), async (req, res) => {
    const result = await db.query(
      `SELECT
        ki.id_item,
        ki.status_approval AS status,
        ki.catatan_dosen,
        ki.harga_saat_ambil AS harga,
        m.nim,
        um.nama AS nama_mahasiswa,
        m.program_studi,
        mk.kode_matkul AS kode,
        mk.nama_matkul AS nama,
        mk.sks,
        kl.nama_kelas AS kelas,
        ud.nama AS dosen_pengajar,
        STRING_AGG(
          j.hari || ' ' ||
          TO_CHAR(j.jam_mulai, 'HH24:MI') || '-' ||
          TO_CHAR(j.jam_selesai, 'HH24:MI') ||
          ' (' || j.ruangan || ')',
          ', ' ORDER BY j.id_jadwal
        ) AS jadwal
      FROM keranjang_item ki
      JOIN keranjang k ON k.id_keranjang = ki.id_keranjang
      JOIN mahasiswa m ON m.id_mahasiswa = k.id_mahasiswa
      JOIN users um ON um.id_user = m.id_user
      JOIN kelas kl ON kl.id_kelas = ki.id_kelas
      JOIN mata_kuliah mk ON mk.id_matkul = kl.id_matkul
      JOIN dosen d ON d.id_dosen = kl.id_dosen
      JOIN users ud ON ud.id_user = d.id_user
      LEFT JOIN jadwal_kelas j ON j.id_kelas = kl.id_kelas
      WHERE m.id_dosen_wali = $1
        AND k.status = 'diajukan'
      GROUP BY
        ki.id_item,
        ki.status_approval,
        ki.catatan_dosen,
        ki.harga_saat_ambil,
        m.nim,
        um.nama,
        m.program_studi,
        mk.kode_matkul,
        mk.nama_matkul,
        mk.sks,
        kl.nama_kelas,
        ud.nama
      ORDER BY um.nama, ki.id_item`,
      [req.user.id_dosen]
    );

    res.json(result.rows);
  });

// =====================================================
// 8. MENYETUJUI ATAU MENOLAK KRS
// POST /api/persetujuan/:id
// =====================================================

router.post('/persetujuan/:id', allow('dosen'), async (req, res) => {
  const { status, catatan } = req.body;

  if (!['disetujui', 'ditolak'].includes(status)) {
    return res.status(400).json({
      message: 'Status tidak valid.'
    });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const item = await client.query(
      `SELECT ki.id_item
       FROM keranjang_item ki
       JOIN keranjang k ON k.id_keranjang = ki.id_keranjang
       JOIN mahasiswa m ON m.id_mahasiswa = k.id_mahasiswa
       WHERE ki.id_item = $1
         AND m.id_dosen_wali = $2
         AND k.status = 'diajukan'
       FOR UPDATE OF ki`,
      [req.params.id, req.user.id_dosen]
    );

    if (!item.rowCount) {
      throw new Error(
        'Pengajuan tidak ditemukan atau bukan mahasiswa bimbingan Anda.'
      );
    }

    await client.query(
      `UPDATE keranjang_item
       SET
         status_approval = $1,
         catatan_dosen = $2,
         id_dosen_approval = $3,
         tanggal_approval = NOW()
       WHERE id_item = $4`,
      [
        status,
        catatan || null,
        req.user.id_dosen,
        req.params.id
      ]
    );

    await client.query(
      `INSERT INTO riwayat_approval
         (id_item, id_dosen, status, catatan)
       VALUES ($1, $2, $3, $4)`,
      [
        req.params.id,
        req.user.id_dosen,
        status,
        catatan || null
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: `Mata kuliah ${status}.`
    });

  } catch (error) {
    await client.query('ROLLBACK');

    res.status(400).json({
      message: error.message
    });

  } finally {
    client.release();
  }
});

// =====================================================
// 9. CHECKOUT KRS
// POST /api/checkout
// =====================================================

router.post('/checkout', allow('mahasiswa'), async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const cartResult = await client.query(
      `SELECT *
       FROM keranjang
       WHERE id_mahasiswa = $1
         AND status = 'diajukan'
         AND id_semester = (
           SELECT id_semester
           FROM semester
           WHERE status_aktif = TRUE
         )
       FOR UPDATE`,
      [req.user.id_mahasiswa]
    );

    if (!cartResult.rowCount) {
      throw new Error('Keranjang belum diajukan atau tidak ditemukan.');
    }

    const cart = cartResult.rows[0];

    const items = await client.query(
      `SELECT
         ki.id_kelas,
         ki.harga_saat_ambil,
         mk.sks,
         kl.kapasitas
       FROM keranjang_item ki
       JOIN kelas kl ON kl.id_kelas = ki.id_kelas
       JOIN mata_kuliah mk ON mk.id_matkul = kl.id_matkul
       WHERE ki.id_keranjang = $1
         AND ki.status_approval = 'disetujui'
       ORDER BY ki.id_kelas
       FOR UPDATE OF kl`,
      [cart.id_keranjang]
    );

    const unapproved = await client.query(
      `SELECT COUNT(*)::int AS n
       FROM keranjang_item
       WHERE id_keranjang = $1
         AND status_approval <> 'disetujui'`,
      [cart.id_keranjang]
    );

    if (!items.rowCount || unapproved.rows[0].n > 0) {
      throw new Error(
        'Semua mata kuliah harus disetujui sebelum checkout.'
      );
    }

    // Menghitung total SKS
    const totalSks = items.rows.reduce(
      (total, item) => total + Number(item.sks),
      0
    );

    if (totalSks > Number(req.user.maksimal_sks)) {
      throw new Error('Total SKS melebihi batas maksimal.');
    }

    // Memeriksa kapasitas kelas
    for (const item of items.rows) {
      const count = await client.query(
        `SELECT COUNT(*)::int AS n
         FROM krs_detail kd
         JOIN krs kr ON kr.id_krs = kd.id_krs
         WHERE kd.id_kelas = $1
           AND kr.status = 'aktif'`,
        [item.id_kelas]
      );

      if (count.rows[0].n >= item.kapasitas) {
        throw new Error(
          `Kuota kelas ID ${item.id_kelas} sudah penuh.`
        );
      }
    }

    // Memeriksa bentrok jadwal
    const conflict = await client.query(
      `SELECT 1
       FROM keranjang_item a
       JOIN jadwal_kelas ja ON ja.id_kelas = a.id_kelas
       JOIN keranjang_item b
         ON b.id_keranjang = a.id_keranjang
        AND b.id_item > a.id_item
       JOIN jadwal_kelas jb ON jb.id_kelas = b.id_kelas
       WHERE a.id_keranjang = $1
         AND ja.hari = jb.hari
         AND ja.jam_mulai < jb.jam_selesai
         AND jb.jam_mulai < ja.jam_selesai
       LIMIT 1`,
      [cart.id_keranjang]
    );

    if (conflict.rowCount) {
      throw new Error('Terdapat jadwal mata kuliah yang bentrok.');
    }

    // Menghitung total biaya
    const totalBiaya = items.rows.reduce(
      (total, item) => total + Number(item.harga_saat_ambil),
      0
    );

    // Membuat transaksi KRS
    const krs = await client.query(
      `INSERT INTO krs
         (id_keranjang, id_mahasiswa, id_semester, total_sks, total_biaya)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_krs`,
      [
        cart.id_keranjang,
        req.user.id_mahasiswa,
        cart.id_semester,
        totalSks,
        totalBiaya
      ]
    );

    // Memasukkan detail KRS
    for (const item of items.rows) {
      await client.query(
        `INSERT INTO krs_detail
           (id_krs, id_kelas, sks_saat_ambil, harga_saat_ambil)
         VALUES ($1, $2, $3, $4)`,
        [
          krs.rows[0].id_krs,
          item.id_kelas,
          item.sks,
          item.harga_saat_ambil
        ]
      );
    }

    // Mengubah status keranjang
    await client.query(
      `UPDATE keranjang
       SET
         status = 'checkout',
         tanggal_checkout = NOW()
       WHERE id_keranjang = $1`,
      [cart.id_keranjang]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Checkout KRS berhasil.',
      id_krs: krs.rows[0].id_krs,
      total_sks: totalSks,
      total_biaya: totalBiaya
    });

  } catch (error) {
    await client.query('ROLLBACK');

    res.status(400).json({
      message: error.message
    });

  } finally {
    client.release();
  }
});

// =====================================================
// 10. MELIHAT RIWAYAT KRS MAHASISWA
// GET /api/riwayat-krs
// =====================================================

router.get('/riwayat-krs', allow('mahasiswa'), async (req, res) => {
  const result = await db.query(
    `SELECT
       kr.id_krs,
       kr.total_sks,
       kr.total_biaya,
       kr.checkout_pada,
       mk.kode_matkul,
       mk.nama_matkul,
       mk.sks,
       kl.nama_kelas,
       du.nama AS dosen
     FROM krs kr
     JOIN krs_detail kd ON kd.id_krs = kr.id_krs
     JOIN kelas kl ON kl.id_kelas = kd.id_kelas
     JOIN mata_kuliah mk ON mk.id_matkul = kl.id_matkul
     JOIN dosen d ON d.id_dosen = kl.id_dosen
     JOIN users du ON du.id_user = d.id_user
     WHERE kr.id_mahasiswa = $1
     ORDER BY kr.checkout_pada DESC, kd.id_krs_detail`,
    [req.user.id_mahasiswa]
  );

  res.json(result.rows);
});

// =====================================================
// MELIHAT JADWAL KULIAH MAHASISWA
// GET /api/jadwal-kuliah
// =====================================================

  router.get('/jadwal-kuliah', allow('mahasiswa'), async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
          kd.id_krs_detail AS id_item,
          mk.kode_matkul AS kode,
          mk.nama_matkul AS nama,
          mk.sks,
          kl.nama_kelas AS kelas,
          du.nama AS dosen,
          CONCAT(
            jk.hari, ' ',
            TO_CHAR(jk.jam_mulai, 'HH24:MI'),
            '-',
            TO_CHAR(jk.jam_selesai, 'HH24:MI'),
            ' (',
            jk.ruangan,
            ')'
          ) AS jadwal,
          kr.status AS status
        FROM krs kr
        JOIN krs_detail kd ON kd.id_krs = kr.id_krs
        JOIN kelas kl ON kl.id_kelas = kd.id_kelas
        JOIN mata_kuliah mk ON mk.id_matkul = kl.id_matkul
        JOIN dosen d ON d.id_dosen = kl.id_dosen
        JOIN users du ON du.id_user = d.id_user
        JOIN jadwal_kelas jk ON jk.id_kelas = kl.id_kelas
        WHERE kr.id_mahasiswa = $1
          AND kr.status = 'aktif'
        ORDER BY
          CASE jk.hari
            WHEN 'Senin' THEN 1
            WHEN 'Selasa' THEN 2
            WHEN 'Rabu' THEN 3
            WHEN 'Kamis' THEN 4
            WHEN 'Jumat' THEN 5
            WHEN 'Sabtu' THEN 6
            WHEN 'Minggu' THEN 7
            ELSE 8
          END,
          jk.jam_mulai`,
        [req.user.id_mahasiswa]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Gagal mengambil jadwal kuliah:', error);
      res.status(500).json({
        message: 'Gagal memuat jadwal kuliah.'
      });
    }
  });

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
