require('dotenv').config();
const bcrypt=require('bcryptjs');
const db=require('../data/db');
(async()=>{
 const c=await db.pool.connect();
 try{
  await c.query('BEGIN');
  const hash=await bcrypt.hash('123',10);
  const dos=(await c.query(`INSERT INTO users(username,email,password_hash,role,nama) VALUES('dosen','dosen@simkrs.local',$1,'dosen','Dr. Budi Santoso, S.Kom., M.T.') ON CONFLICT(username) DO UPDATE SET nama=EXCLUDED.nama,password_hash=EXCLUDED.password_hash RETURNING id_user`,[hash])).rows[0];
  const mhs=(await c.query(`INSERT INTO users(username,email,password_hash,role,nama) VALUES('anggun','anggun@simkrs.local',$1,'mahasiswa','Anggun Legia') ON CONFLICT(username) DO UPDATE SET nama=EXCLUDED.nama,password_hash=EXCLUDED.password_hash RETURNING id_user`,[hash])).rows[0];
  const dosen=(await c.query(`INSERT INTO dosen(id_user,nidn) VALUES($1,'0011223344') ON CONFLICT(id_user) DO UPDATE SET nidn=EXCLUDED.nidn RETURNING id_dosen`,[dos.id_user])).rows[0];
  await c.query(`INSERT INTO mahasiswa(id_user,id_dosen_wali,nim,program_studi,angkatan,semester_aktif,maksimal_sks) VALUES($1,$2,'2311001','Sistem Informasi',2023,5,24) ON CONFLICT(id_user) DO UPDATE SET id_dosen_wali=EXCLUDED.id_dosen_wali`,[mhs.id_user,dosen.id_dosen]);
  const sem=(await c.query(`INSERT INTO semester(tahun_ajaran,periode,tanggal_mulai,tanggal_selesai,status_aktif) VALUES('2026/2027','Ganjil','2026-08-01','2027-01-31',TRUE) ON CONFLICT(tahun_ajaran,periode) DO UPDATE SET status_aktif=TRUE RETURNING id_semester`)).rows[0];
  const courses=[
   ['SI204','Pemrograman Web',3,'Senin','08:00','10:30','Lab Komputer 1',500000,'A',40],
   ['SI202','Sistem Basis Data',3,'Selasa','10:00','12:30','Ruang 203',450000,'B',35],
   ['SI206','Analisis dan Perancangan Sistem',3,'Rabu','13:00','15:30','Ruang 205',475000,'A',35],
   ['SI208','Interaksi Manusia dan Komputer',2,'Kamis','08:00','09:40','Ruang 201',350000,'B',30],
   ['SI210','Manajemen Proyek Sistem Informasi',3,'Kamis','13:00','15:30','Ruang 204',500000,'A',40],
   ['SI212','Statistika dan Probabilitas',2,'Jumat','09:00','10:40','Ruang 202',325000,'C',30]
  ];
  for(const [kode,nama,sks,hari,mulai,selesai,ruang,harga,kelas,kap] of courses){
   const mk=(await c.query(`INSERT INTO mata_kuliah(kode_matkul,nama_matkul,sks,program_studi) VALUES($1,$2,$3,'Sistem Informasi') ON CONFLICT(kode_matkul) DO UPDATE SET nama_matkul=EXCLUDED.nama_matkul,sks=EXCLUDED.sks RETURNING id_matkul`,[kode,nama,sks])).rows[0];
   const kl=(await c.query(`INSERT INTO kelas(id_matkul,id_dosen,id_semester,nama_kelas,kapasitas,harga) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id_matkul,id_semester,nama_kelas) DO UPDATE SET kapasitas=EXCLUDED.kapasitas,harga=EXCLUDED.harga RETURNING id_kelas`,[mk.id_matkul,dosen.id_dosen,sem.id_semester,kelas,kap,harga])).rows[0];
   await c.query(`INSERT INTO jadwal_kelas(id_kelas,hari,jam_mulai,jam_selesai,ruangan) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id_kelas,hari,jam_mulai,jam_selesai) DO UPDATE SET ruangan=EXCLUDED.ruangan`,[kl.id_kelas,hari,mulai,selesai,ruang]);
  }
  await c.query('COMMIT');
  console.log('Seed selesai. Login demo: mahasiswa anggun/123, dosen wali dosen/123');
 }catch(e){await c.query('ROLLBACK');console.error(e);process.exitCode=1;}finally{c.release();await db.pool.end();}
})();
