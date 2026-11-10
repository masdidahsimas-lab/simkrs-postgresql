import {
  Clock3,
  UserRound,
  DoorOpen,
  UsersRound,
  Plus,
  Check,
} from "lucide-react";

const currency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function MataKuliahCard({ data, onAdd, added = false }) {
  const capacity = data.kapasitas ?? 40;
  const filled = data.terisi ?? 28;
  const remaining = Math.max(0, capacity - filled);
  const full = remaining === 0;

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-200/50 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
          <BookOpenIcon />
        </div>
        <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700">
          {data.sks} SKS
        </span>
      </div>

      <p className="mt-5 text-[11px] font-bold tracking-wider text-violet-600">
        {data.kode}
      </p>
      <h3 className="mt-1 font-heading text-lg font-bold leading-snug text-slate-900">
        {data.nama}
      </h3>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        Mata kuliah semester aktif · Program Studi Sistem Informasi
      </p>

      <div className="my-5 h-px bg-slate-100" />

      <div className="space-y-4">
        <Info icon={UserRound} label="Dosen pengampu" value={data.dosen} />
        <Info
          icon={DoorOpen}
          label="Kelas"
          value={`Kelas ${data.kelas}`}
        />
        <Info icon={Clock3} label="Jadwal" value={data.jadwal} />
        <Info
          icon={UsersRound}
          label="Kapasitas kelas"
          value={`${filled}/${capacity} mahasiswa`}
        />
      </div>

      <div className="mt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              remaining <= 5 ? "bg-amber-400" : "bg-violet-500"
            }`}
            style={{ width: `${Math.min(100, (filled / capacity) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          {remaining} kursi tersisa
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-5">
        <div className="min-w-0">
          <p className="text-[11px] text-slate-400">Biaya mata kuliah</p>
          <p className="mt-1 text-sm font-extrabold text-slate-900">
            {currency(data.harga)}
          </p>
        </div>

        <button
          disabled={added || full}
          onClick={() => onAdd?.(data)}
          className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
            added
              ? "bg-emerald-50 text-emerald-700"
              : "bg-violet-600 text-white shadow-md shadow-violet-600/15 hover:bg-violet-700"
          }`}
        >
          {added ? (
            <>
              <Check size={14} /> Ditambahkan
            </>
          ) : full ? (
            "Kelas penuh"
          ) : (
            <>
              <Plus size={14} /> Tambah
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function BookOpenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 7v14" />
      <path d="M3 18V5a2 2 0 0 1 2-2h2a5 5 0 0 1 5 5 5 5 0 0 1 5-5h2a2 2 0 0 1 2 2v13h-4a5 5 0 0 0-5 3 5 5 0 0 0-5-3H3Z" />
    </svg>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="mt-0.5 wrap-break-word text-xs font-semibold leading-5 text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}