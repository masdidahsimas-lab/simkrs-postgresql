# DOKUMENTASI REFACTORING SISTEM SIMKRS

## 1. Tujuan Refactoring

Refactoring dilakukan untuk memperbaiki struktur kode program SIMKRS agar lebih mudah dibaca, dipahami, dipelihara, dan dikembangkan tanpa mengubah fungsi utama aplikasi.

## 2. File yang Dilakukan Refactoring

### A. DashboardMahasiswa.jsx

Teknik refactoring:
- Extract Function: memisahkan fungsi `formatCourseData()`.
- Extract Component: membuat komponen `StatCard`.
- Memoization: menggunakan `useMemo` untuk `filteredCourses`.
- Parallel API Calls: menggunakan `Promise.all()` untuk mengambil data kelas dan keranjang secara bersamaan.

### B. Keranjang.jsx

Teknik refactoring:
- Extract Function: membuat fungsi `formatCurrency()`.
- Extract Component: memisahkan komponen `Notification` dan `CardKeranjang`.
- Pemisahan logika: membuat fungsi `ApprovalSummary()`.
- Memoization: menghitung total SKS dan biaya menggunakan `useMemo`.

### C. DashboardDosen.jsx

Teknik refactoring:
- Extract Component: membuat komponen `StatCard`, `Notification`, dan `ApprovalItem`.
- Extract Function: memisahkan `loadApprovalData()` dan `handleApproval()`.
- Data-driven Rendering: menggunakan `statistics.map()` untuk menampilkan statistik.

## 3. Pengujian Program

Pengujian dilakukan dengan beberapa cara:

1. Menjalankan ESLint menggunakan `npm run lint`.
2. Menjalankan build frontend menggunakan `npm run build`.
3. Melakukan pengujian manual pada fitur dashboard mahasiswa.
4. Menguji penambahan mata kuliah ke keranjang.
5. Menguji penghapusan mata kuliah dari keranjang.
6. Menguji pengiriman KRS kepada dosen wali.
7. Menguji persetujuan dan penolakan KRS oleh dosen.

Hasil pemeriksaan ESLint dan build frontend sebelumnya berhasil dijalankan tanpa error.

## 4. Kesimpulan

Refactoring membantu membuat kode program SIMKRS lebih terstruktur melalui pemisahan fungsi dan komponen, penggunaan memoization, serta penyederhanaan pengambilan data API.

Repository GitHub:

https://github.com/masdidahsimas-lab/simkrs-postgresql
