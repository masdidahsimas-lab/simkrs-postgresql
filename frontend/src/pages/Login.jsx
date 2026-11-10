import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  BookOpen, Check, Eye, EyeOff, LockKeyhole, UserRound,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("mahasiswa");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e.preventDefault(); setError("");
    if (!username.trim() || !password.trim()) { setError("Username dan password wajib diisi."); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      if (data.user.role !== role) { setError("Role akun tidak sesuai dengan pilihan login."); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(data.user.role === "dosen" ? "/dosen" : "/mahasiswa");
    } catch (err) { setError(err.response?.data?.message || "Tidak dapat terhubung ke server."); }
    finally { setLoading(false); }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Panel kiri */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-linear-to-br from-violet-700 via-violet-800 to-indigo-950 p-12 text-white lg:flex xl:p-16">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <BookOpen size={23} />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight">
              simkrs<span className="text-violet-300">.</span>
            </h2>
            <p className="text-[10px] font-semibold tracking-[0.22em] text-violet-200">
              ACADEMIC PORTAL
            </p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <span className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-widest text-violet-100">
            YOUR ACADEMIC JOURNEY
          </span>

          <h1 className="font-heading text-5xl font-extrabold leading-tight xl:text-6xl">
            Rencanakan kuliah.
            <br />
            <span className="text-violet-300">Raih masa depan.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-violet-100/80">
            Kelola rencana studimu dalam satu tempat. Pilih mata kuliah,
            pantau persetujuan dosen wali, dan selesaikan KRS dengan lebih mudah.
          </p>

          <div className="mt-9 space-y-4">
            {[
              "Pilih kelas sesuai kebutuhan dan jadwal",
              "Pantau status persetujuan KRS",
              "Ringkasan SKS dan biaya secara praktis",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                  <Check size={14} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-violet-200/60">
          © 2026 SIMKRS · Sistem Informasi Akademik
        </p>
      </section>

      {/* Panel kanan */}
      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
        <form onSubmit={login} className="w-full max-w-md">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 lg:hidden">
            <BookOpen size={24} />
          </div>

          <p className="text-xs font-bold tracking-[0.18em] text-violet-600">
            SELAMAT DATANG KEMBALI
          </p>

          <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Masuk ke akunmu
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Gunakan akun akademik untuk melanjutkan proses pengisian KRS.
          </p>

          {error && (
            <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-700">
                Masuk sebagai
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
              >
                <option value="mahasiswa">Mahasiswa</option>
                <option value="dosen">Dosen wali</option>
              </select>
            </div>

            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className={`${inputClass} px-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-600/25 active:translate-y-0"
            >
              <LockKeyhole size={17} />
              {loading ? "Memproses..." : "Masuk ke SIMKRS"}
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50/70 p-4 text-xs leading-6 text-slate-600">
            <p className="mb-1 font-bold text-violet-800">Akun demo</p>
            <p>Mahasiswa: <strong>anggun</strong> / <strong>123</strong></p>
            <p>Dosen wali: <strong>dosen</strong> / <strong>123</strong></p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            SIMKRS · Sistem Informasi Akademik
          </p>
        </form>
      </section>
    </main>
  );
}