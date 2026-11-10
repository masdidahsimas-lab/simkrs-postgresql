
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck,
  GraduationCap,
  ShoppingBasket,
  Search,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

import MahasiswaLayout from '../layout/MahasiswaLayout';
import MataKuliahCard from '../component/MataKuliahCard';
import api from '../api/axios';

// Mengubah data kelas dari API ke format yang digunakan frontend.
function formatCourseData(course) {
  return {
    id: course.id_kelas,
    kode: course.kode_matkul,
    nama: course.nama_matkul,
    sks: course.sks,
    dosen: course.nama_dosen,
    kelas: course.nama_kelas,
    jadwal: course.jadwal || 'Jadwal belum diatur',
    harga: Number(course.harga),
    terisi: Number(course.terisi),
    kapasitas: Number(course.kapasitas),
    sisa: Number(course.sisa_kuota)
  };
}

// Komponen untuk menampilkan ringkasan akademik.
function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
        <Icon size={22} />
      </div>

      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

export default function DashboardMahasiswa() {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [cartData, setCartData] = useState({
    keranjang: null,
    items: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua kelas');
  const [notification, setNotification] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Mengambil data kelas dan keranjang dari server.
  async function loadDashboardData() {
    try {
      const [courseResponse, cartResponse] = await Promise.all([
        api.get('/api/kelas'),
        api.get('/api/keranjang')
      ]);

      const formattedCourses = courseResponse.data.map(formatCourseData);

      setAvailableCourses(formattedCourses);
      setCartData(cartResponse.data);
    } catch (error) {
      setNotification(
        error.response?.data?.message ||
        'Gagal mengambil data dari server.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      await loadDashboardData();
    };
    fetchDashboardData();
  }, []);

  // Memfilter mata kuliah berdasarkan pencarian dan kelas.
  const filteredCourses = useMemo(() => {
    return availableCourses.filter((course) => {
      const matchesSearch = `${course.nama} ${course.kode} ${course.dosen}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesClass =
        selectedClass === 'Semua kelas' ||
        course.kelas === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [availableCourses, searchTerm, selectedClass]);

  // Menambahkan mata kuliah ke keranjang.
  async function addCourseToCart(course) {
    try {
      await api.post('/api/keranjang/items', {
        id_kelas: course.id
      });

      setNotification(`${course.nama} ditambahkan ke keranjang.`);

      await loadDashboardData();
    } catch (error) {
      setNotification(
        error.response?.data?.message ||
        'Gagal menambahkan mata kuliah.'
      );
    }
  }

  const totalSKS = cartData.items.reduce(
    (total, item) => total + Number(item.sks),
    0
  );

  return (
    <MahasiswaLayout>
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-linear-to-r from-violet-700 to-indigo-800 p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-200">
          Ringkasan akademik
        </p>

        <h1 className="mt-3 text-3xl font-extrabold">
          Selamat datang, {user.nama || 'Mahasiswa'} ✦
        </h1>

        <p className="mt-3 text-sm text-violet-100">
          Pilih mata kuliah, pantau persetujuan dosen wali, lalu checkout KRS.
        </p>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={BookOpenCheck}
          label="Total SKS di keranjang"
          value={`${totalSKS} SKS`}
          detail="Pilihan mata kuliah saat ini"
        />

        <StatCard
          icon={GraduationCap}
          label="Kelas tersedia"
          value={availableCourses.length}
          detail="Dari database akademik"
        />

        <StatCard
          icon={ShoppingBasket}
          label="Pilihan di keranjang"
          value={cartData.items.length}
          detail="Pengajuan KRS"
        />
      </section>

      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Temukan mata kuliah
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Informasi dosen, kelas, jadwal, kuota, SKS, dan biaya.
          </p>
        </div>

        <span className="text-xs text-slate-400">
          <Sparkles size={14} className="mr-1 inline text-violet-500" />
          {filteredCourses.length} kelas ditemukan
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-3 rounded-xl border bg-white px-4 py-3">
          <Search size={17} />

          <input
            className="w-full outline-none"
            placeholder="Cari nama, kode, atau dosen"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3">
          <SlidersHorizontal size={16} />

          <select
            className="bg-transparent outline-none"
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
          >
            <option>Semua kelas</option>

            {['A', 'B', 'C', 'D'].map((className) => (
              <option key={className} value={className}>
                {`Kelas ${className}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-slate-500">
          Memuat data kelas...
        </p>
      ) : filteredCourses.length ? (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <MataKuliahCard
              key={course.id}
              data={course}
              added={cartData.items.some(
                (item) =>
                  Number(item.id_kelas) === Number(course.id)
              )}
              onAdd={addCourseToCart}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-slate-500">
          Tidak ada kelas yang ditemukan.
        </div>
      )}

      {notification && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-5 py-4 text-sm text-white shadow-xl"
        >
          {notification}

          <button
            className="ml-4"
            onClick={() => setNotification('')}
          >
            ×
          </button>
        </div>
      )}
    </MahasiswaLayout>
  );
}
