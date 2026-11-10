
const bcrypt = require('bcryptjs');
const db = require('./src/data/db');

async function seedUsers() {
  try {
    const passwordHash = await bcrypt.hash('123', 10);

    const users = [
      {
        username: 'anggun',
        nama: 'Anggun',
        email: 'anggun@simkrs.com',
        role: 'mahasiswa'
      },
      {
        username: 'dosen',
        nama: 'Dosen Wali',
        email: 'dosen@simkrs.com',
        role: 'dosen'
      }
    ];

    for (const user of users) {
      await db.query(
        `INSERT INTO users
          (username, nama, email, password, role, status)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (username)
         DO UPDATE SET
           password = EXCLUDED.password,
           status = TRUE`,
        [
          user.username,
          user.nama,
          user.email,
          passwordHash,
          user.role
        ]
      );
    }

    console.log('Akun demo berhasil dibuat!');
  } catch (error) {
    console.error('Gagal membuat akun:', error);
  } finally {
    await db.pool.end();
  }
}

seedUsers();
