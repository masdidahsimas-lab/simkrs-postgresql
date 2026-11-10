
import { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Check,
  XCircle
} from 'lucide-react';

import MahasiswaLayout from '../layout/MahasiswaLayout';
import StatusBadge from '../component/StatusBadge';
import api from '../api/axios';

// Komponen untuk menampilkan statistik pengajuan.
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-white p-5">
      <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
        <Icon size={21} />
      </div>

      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
      </div>
    </div>
  );
}

// Komponen notifikasi.
function Notification({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-5 py-4 text-sm text-white shadow-xl"
    >
      {message}

      <button
        className="ml-4"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}

// Menampilkan informasi setiap pengajuan mahasiswa.
function ApprovalItem({ item, onDecide, isBusy }) {
  return (
    <article className="p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-bold text-violet-600">
            {item.nim} · {item.kode}
          </p>

          <h3 className="mt-1 font-bold">
            {item.nama_mahasiswa}
          </h3>

          <p className="mt-1 text-sm text-slate-700">
            {item.nama} — Kelas {item.kelas} ({item.sks} SKS)
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Dosen pengajar: {item.dosen_pengajar} · {item.jadwal}
          </p>

          {item.catatan_dosen && (
            <p className="mt-2 text-xs text-slate-500">
              Catatan: {item.catatan_dosen}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />

          {item.status === 'menunggu' && (
            <>
              <button
                disabled={isBusy}
                onClick={() => onDecide(item.id_item, 'disetujui')}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                <Check size={14} />
                Setujui
              </button>

              <button
                disabled={isBusy}
                onClick={() => onDecide(item.id_item, 'ditolak')}
                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
              >
                <XCircle size={14} />
                Tolak
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function DashboardDosen() {
  const [approvalItems, setApprovalItems] = useState([]);
  const [notification, setNotification] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // Mengambil daftar pengajuan KRS dari backend.
  async function loadApprovalData() {
    try {
      const response = await api.get('/api/persetujuan');
      setApprovalItems(response.data);
    } catch (error) {
      setNotification(
        error.response?.data?.message ||
        'Gagal memuat pengajuan.'
      );
    }
  }

  useEffect(() => {
    const fetchApprovalData = async () => {
      await loadApprovalData();
    };
    fetchApprovalData();
  }, []);

  // Memproses keputusan persetujuan dosen.
  async function handleApproval(itemId, status) {
    setIsBusy(true);

    try {
      const response = await api.post(
        `/api/persetujuan/${itemId}`,
        { status }
      );

      setNotification(response.data.message);
      await loadApprovalData();
    } catch (error) {
      setNotification(
        error.response?.data?.message ||
        'Gagal memproses persetujuan.'
      );
    } finally {
      setIsBusy(false);
    }
  }

  // Menghitung statistik pengajuan.
  const pendingCount = approvalItems.filter(
    (item) => item.status === 'menunggu'
  ).length;

  const approvedCount = approvalItems.filter(
    (item) => item.status === 'disetujui'
  ).length;

  const statistics = [
    {
      icon: ClipboardCheck,
      label: 'Total mata kuliah',
      value: approvalItems.length
    },
    {
      icon: Clock3,
      label: 'Menunggu ditinjau',
      value: pendingCount
    },
    {
      icon: FileCheck2,
      label: 'Disetujui',
      value: approvedCount
    }
  ];

  return (
    <MahasiswaLayout>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
          Area dosen wali
        </p>

        <h1 className="mt-2 text-3xl font-extrabold">
          Persetujuan KRS
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Periksa mata kuliah yang diajukan mahasiswa bimbingan Anda.
        </p>
      </div>

      {/* Statistik pengajuan */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {statistics.map((statistic) => (
          <StatCard
            key={statistic.label}
            icon={statistic.icon}
            label={statistic.label}
            value={statistic.value}
          />
        ))}
      </div>

      {/* Daftar pengajuan mahasiswa */}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b p-5">
          <h2 className="font-bold">
            Daftar pengajuan
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Persetujuan dilakukan per mata kuliah.
          </p>
        </div>

        {approvalItems.length > 0 ? (
          <div className="divide-y">
            {approvalItems.map((item) => (
              <ApprovalItem
                key={item.id_item}
                item={item}
                onDecide={handleApproval}
                isBusy={isBusy}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-slate-500">
            Belum ada pengajuan KRS dari mahasiswa bimbingan.
          </div>
        )}
      </div>

      <Notification
        message={notification}
        onClose={() => setNotification('')}
      />
    </MahasiswaLayout>
  );
}
