
import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  BookOpen
} from 'lucide-react';

import MahasiswaLayout from '../layout/MahasiswaLayout';
import api from '../api/axios';

export default function Jadwal() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/jadwal-kuliah')
      .then((r) => {
        setItems(r.data || []);
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
          'Gagal memuat jadwal.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <MahasiswaLayout>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
          Rencana mingguan
        </p>

        <h1 className="mt-2 text-3xl font-extrabold">
          Jadwal Kuliah
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Jadwal dari mata kuliah KRS yang sudah berhasil di-checkout.
        </p>
      </div>

      {loading && (
        <p className="text-slate-500">
          Memuat jadwal kuliah...
        </p>
      )}

      {error && (
        <p className="text-red-600">{error}</p>
      )}

      {!loading && !error && (
        items.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((i) => (
              <article
                key={i.id_item}
                className="rounded-2xl border bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                    {i.kode}
                  </span>

                  <span className="text-xs font-bold">
                    {i.sks} SKS
                  </span>
                </div>

                <h3 className="mt-4 font-bold">
                  {i.nama}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Kelas {i.kelas} · {i.dosen}
                </p>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p className="flex gap-2">
                    <Clock3 size={16} />
                    {i.jadwal}
                  </p>

                  <p className="flex gap-2">
                    <BookOpen size={16} />
                    Status: {i.status}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-slate-500">
            <CalendarDays className="mx-auto mb-3" />
            Belum ada jadwal dari KRS yang aktif.
          </div>
        )
      )}
    </MahasiswaLayout>
  );
}
