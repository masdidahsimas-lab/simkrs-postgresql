
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ShoppingBasket,
  CreditCard,
  Info,
  Send
} from 'lucide-react';

import MahasiswaLayout from '../layout/MahasiswaLayout';
import CardKeranjang from '../component/CardKeranjang';
import api from '../api/axios';

// Mengubah angka menjadi format mata uang Rupiah.
const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);

// Komponen notifikasi untuk menampilkan pesan proses.
function Notification({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl bg-slate-900 px-5 py-4 text-sm text-white shadow-xl"
    >
      {message}
      <button className="ml-4" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

// Komponen ringkasan status persetujuan.
function ApprovalSummary({ items, allApproved }) {
  const hasRejectedItem = items.some(
    (item) => item.status === 'ditolak'
  );

  let approvalStatus = 'Belum ada';

  if (allApproved) {
    approvalStatus = 'Semua disetujui';
  } else if (hasRejectedItem) {
    approvalStatus = 'Ada yang ditolak';
  } else if (items.length > 0) {
    approvalStatus = 'Menunggu';
  }

  return approvalStatus;
}

export default function Keranjang() {
  const [cartData, setCartData] = useState({
    keranjang: null,
    items: []
  });

  const [notification, setNotification] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // Mengambil data keranjang dari backend.
  async function loadCartData() {
    try {
      const response = await api.get('/api/keranjang');
      setCartData(response.data);
    } catch (error) {
      setNotification(
        error.response?.data?.message ||
        'Gagal memuat keranjang.'
      );
    }
  }

    useEffect(() => {
    const fetchCartData = async () => {
      await loadCartData();
    };

    fetchCartData();
  }, []);

  const cartItems = useMemo(
    () => cartData.items || [],
    [cartData.items]
  );

  // Menghitung total SKS mata kuliah.
  const totalSKS = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + Number(item.sks),
        0
      ),
    [cartItems]
  );

  // Menghitung estimasi total biaya.
  const totalPrice = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + Number(item.harga),
        0
      ),
    [cartItems]
  );

  const cartStatus = cartData.keranjang?.status || 'draft';

  const allApproved =
    cartItems.length > 0 &&
    cartItems.every((item) => item.status === 'disetujui');

  const approvalStatus = ApprovalSummary({
    items: cartItems,
    allApproved
  });

  // Menghapus mata kuliah dari keranjang.
  async function removeCartItem(itemId) {
    try {
      await api.delete(`/api/keranjang/items/${itemId}`);

      setNotification('Mata kuliah dihapus.');
      await loadCartData();
    } catch (error) {
      setNotification(
        error.response?.data?.message ||
        'Gagal menghapus.'
      );
    }
  }

  // Mengajukan keranjang kepada dosen wali.
  async function submitCart() {
    setIsBusy(true);

    try {
      const response = await api.post('/api/keranjang/ajukan');

      setNotification(response.data.message);
      await loadCartData();
    } catch (error) {
      setNotification(
        error.response?.data?.message ||
        'Gagal mengajukan KRS.'
      );
    } finally {
      setIsBusy(false);
    }
  }

  // Melakukan checkout KRS setelah persetujuan.
  async function checkoutCart() {
    setIsBusy(true);

    try {
      const response = await api.post('/api/checkout');

      setNotification(
        `${response.data.message} Nomor KRS: ${response.data.id_krs}`
      );

      await loadCartData();
    } catch (error) {
      setNotification(
        error.response?.data?.message ||
        'Checkout gagal.'
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <MahasiswaLayout>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
            Rencana studimu
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Keranjang KRS
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Tinjau pilihan mata kuliah sebelum diajukan ke dosen wali.
          </p>
        </div>

        <Link
          to="/mahasiswa"
          className="inline-flex w-fit items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          Cari mata kuliah
        </Link>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold">
              Mata kuliah pilihan
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {cartItems.length} kelas dipilih · Status keranjang: {cartStatus}
            </p>
          </div>

          {cartItems.length > 0 ? (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <CardKeranjang
                  key={item.id_item}
                  item={item}
                  onRemove={removeCartItem}
                  canRemove={cartStatus === 'draft'}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
              <ShoppingBasket
                className="mx-auto text-violet-500"
                size={32}
              />

              <h3 className="mt-4 font-bold">
                Keranjang masih kosong
              </h3>

              <Link
                to="/mahasiswa"
                className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"
              >
                Jelajahi mata kuliah
              </Link>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold">
            Ringkasan KRS
          </h2>

          <div className="my-5 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">
                Mata kuliah
              </span>
              <b>{cartItems.length} kelas</b>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">
                Total SKS
              </span>
              <b>{totalSKS} SKS</b>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">
                Persetujuan
              </span>
              <b>{approvalStatus}</b>
            </div>
          </div>

          <div className="border-t border-dashed pt-5">
            <p className="text-xs text-slate-500">
              Estimasi total biaya
            </p>

            <p className="mt-1 text-2xl font-extrabold">
              {formatCurrency(totalPrice)}
            </p>
          </div>

          {cartStatus === 'draft' && (
            <button
              disabled={!cartItems.length || isBusy}
              onClick={submitCart}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white disabled:bg-slate-300"
            >
              <Send size={17} />
              Ajukan ke dosen wali
            </button>
          )}

          {cartStatus === 'diajukan' && (
            <div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              Pengajuan telah dikirim. Menunggu persetujuan dosen wali.
            </div>
          )}

          {cartStatus === 'diajukan' && (
            <button
              disabled={!allApproved || isBusy}
              onClick={checkoutCart}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white disabled:bg-slate-300"
            >
              <CreditCard size={17} />
              Checkout KRS
            </button>
          )}

          {cartStatus === 'checkout' && (
            <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
              KRS sudah berhasil di-checkout dan tersimpan.
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <Info size={16} />

            <span>
              {cartStatus === 'draft'
                ? 'Ajukan keranjang setelah pilihan mata kuliah selesai.'
                : cartStatus === 'diajukan'
                  ? 'Checkout aktif setelah semua mata kuliah disetujui dosen wali.'
                  : 'Pengajuan KRS ini sudah selesai.'}
            </span>
          </div>

          <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={15} />
            Data disimpan di PostgreSQL.
          </p>
        </aside>
      </div>

      <Notification
        message={notification}
        onClose={() => setNotification('')}
      />
    </MahasiswaLayout>
  );
}
