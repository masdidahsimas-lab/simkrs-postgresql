
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../data/db');
const { auth } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username dan password wajib diisi.'
      });
    }

    const { rows } = await db.query(
      `SELECT id_user, username, password, role, nama, status
       FROM users
       WHERE username = $1`,
      [username.trim()]
    );

    const user = rows[0];

    if (
      !user ||
      !user.status ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        message: 'Username atau password salah.'
      });
    }

    let profile = {};

    if (user.role === 'mahasiswa') {
      profile = (
        await db.query(
          `SELECT id_mahasiswa, nim, program_studi,
                  maksimal_sks, id_dosen_wali
           FROM mahasiswa
           WHERE id_user = $1`,
          [user.id_user]
        )
      ).rows[0] || {};
    } else if (user.role === 'dosen') {
      profile = (
        await db.query(
          `SELECT id_dosen, nidn
           FROM dosen
           WHERE id_user = $1`,
          [user.id_user]
        )
      ).rows[0] || {};
    }

    const payload = {
      id_user: user.id_user,
      username: user.username,
      nama: user.nama,
      role: user.role,
      ...profile
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: payload });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    res.status(500).json({
      message: 'Gagal login.'
    });
  }
});

router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
