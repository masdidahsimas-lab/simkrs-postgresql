import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBasket,
  ClipboardCheck,
  CalendarDays,
  LogOut,
  X,
  CircleHelp,
} from "lucide-react";

export default function Sidebar({ open = false, onClose = () => {} }) {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || '{"nama":"Anggun Legia","role":"mahasiswa"}'
  );

  const cart = JSON.parse(localStorage.getItem("keranjang") || "[]");

  const links = user.role === "dosen"
    ? [{ label: "Persetujuan KRS", to: "/dosen", icon: ClipboardCheck }]
    : [
        { label: "Dashboard", to: "/mahasiswa", icon: LayoutDashboard, end: true },
        { label: "Keranjang KRS", to: "/keranjang", icon: ShoppingBasket, count: cart.length },
        { label: "Jadwal Kuliah", to: "/jadwal", icon: CalendarDays },
      ];

  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("keranjang");
    navigate("/");
  }

  return (
    <>
      {open && (
        <button
          aria-label="Tutup menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
            <BookOpen size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900">
              simkrs<span className="text-violet-600">.</span>
            </h1>
            <p className="text-[9px] font-bold tracking-[0.2em] text-slate-400">
              ACADEMIC PORTAL
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Tutup sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Menu utama
        </div>

        <nav className="space-y-1.5">
          {links.map(({ label, to, icon: Icon, count, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={
                      isActive
                        ? "text-violet-600"
                        : "text-slate-400 group-hover:text-slate-700"
                    }
                  />
                  <span className="flex-1">{label}</span>
                  {count > 0 && (
                    <span className="rounded-lg bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 to-indigo-50 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
              <CircleHelp size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Butuh bantuan?
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Hubungi bagian akademik jika kamu membutuhkan bantuan KRS.
            </p>
          </div>

          <div className="my-5 h-px bg-slate-100" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">
              {(user.nama || "A")
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">
                {user.nama}
              </p>
              <p className="mt-0.5 text-xs capitalize text-slate-400">
                {user.role === "dosen" ? "Dosen wali" : "Mahasiswa"}
              </p>
            </div>

            <button
              onClick={logout}
              title="Keluar"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}