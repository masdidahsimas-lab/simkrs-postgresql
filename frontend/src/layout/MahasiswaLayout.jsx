
import { useLocation } from "react-router-dom";
import { Menu, Bell, ChevronRight } from "lucide-react";
import Sidebar from "../component/Sidebar";
import { useEffect, useState } from "react";
import {  Sun, Moon } from "lucide-react";


const titles = {
  "/mahasiswa": "Dashboard",
  "/keranjang": "Keranjang KRS",
  "/dosen": "Persetujuan KRS",
  "/jadwal": "Jadwal Kuliah",
};

export default function MahasiswaLayout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const user = JSON.parse(
    localStorage.getItem("user") || '{"nama":"Anggun Legia"}'
  );
  const [darkMode, setDarkMode] = useState(
  () => localStorage.getItem("theme") === "dark"
);

useEffect(() => {
  document.documentElement.classList.toggle("dark", darkMode);
  localStorage.setItem("theme", darkMode ? "dark" : "light");
}, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Buka menu"
            >
              <Menu size={18} />
            </button>

            <div className="truncate text-xs text-slate-400 sm:text-sm">
              Portal Akademik
              <ChevronRight
                size={14}
                className="mx-1 inline-block align-middle"
              />
              <span className="font-semibold text-slate-800">
                {titles[location.pathname] || "Akademik"}
              </span>
            </div>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-3 sm:gap-4">
            <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500 md:inline-flex">
              TA 2026/2027 · Ganjil
            </span>
            <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => setDarkMode((current) => !current)}
    aria-label={darkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
    title={darkMode ? "Mode terang" : "Mode gelap"}
    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
  >
    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
  </button>

  <button
    type="button"
    onClick={() => window.alert("Belum ada notifikasi baru.")}
    aria-label="Notifikasi"
    className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
  >
    <Bell size={18} />
    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-500 ring-2 ring-white dark:ring-slate-900" />
  </button>
</div>
           

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
              {(user.nama || "A")
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-5 sm:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}