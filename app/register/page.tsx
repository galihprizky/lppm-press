"use client";
// src/app/register/page.tsx
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Fakultas {
  id: number;
  kode_fakultas: string;
  nama_fakultas: string;
}

interface Jurusan {
  id: number;
  fakultas_id: number;
  kode_fakultas: string;
  nama_fakultas: string;
  kode_jurusan: string;
  nama_jurusan: string;
}

interface RegisterForm {
  nip: string;
  nama: string;
  email: string;
  password: string;
  confirmPassword: string;
  no_hp: string;
  fakultas_id: string;
  jurusan_id: string;
}

type FormErrors = Partial<Record<keyof RegisterForm, string>>;

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    nip: "",
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
    no_hp: "",
    fakultas_id: "",
    jurusan_id: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [fakultasList, setFakultasList] = useState<Fakultas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [loadingFakultas, setLoadingFakultas] = useState(false);
  const [loadingJurusan, setLoadingJurusan] = useState(false);

  useEffect(() => {
    const fetchFakultas = async () => {
      setLoadingFakultas(true);
      try {
        const res = await fetch("http://localhost:3001/fakultas");
        const json = await res.json();
        setFakultasList(Array.isArray(json?.data) ? json.data : []);
      } catch {
        setFakultasList([]);
      } finally {
        setLoadingFakultas(false);
      }
    };

    fetchFakultas();
  }, []);

  useEffect(() => {
    const fetchJurusan = async () => {
      if (!form.fakultas_id) {
        setJurusanList([]);
        return;
      }

      setLoadingJurusan(true);
      try {
        const res = await fetch(`http://localhost:3001/jurusan/fakultas/${form.fakultas_id}`);
        const json = await res.json();
        setJurusanList(Array.isArray(json?.data) ? json.data : []);
      } catch {
        setJurusanList([]);
      } finally {
        setLoadingJurusan(false);
      }
    };

    fetchJurusan();
  }, [form.fakultas_id]);

  const validate = (): FormErrors => {
    const e: FormErrors = {};

    if (!form.nip.trim()) e.nip = "NIP wajib diisi.";
    if (!form.nama.trim()) e.nama = "Nama wajib diisi.";
    if (!form.email) e.email = "Email wajib diisi.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid.";
    if (!form.password) e.password = "Password wajib diisi.";
    else if (form.password.length < 6) e.password = "Password minimal 6 karakter.";
    if (!form.confirmPassword) e.confirmPassword = "Konfirmasi password wajib diisi.";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Password tidak cocok.";
    if (!form.no_hp.trim()) e.no_hp = "No HP wajib diisi.";
    if (!form.fakultas_id) e.fakultas_id = "Fakultas wajib dipilih.";
    if (!form.jurusan_id) e.jurusan_id = "Jurusan wajib dipilih.";

    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();

    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setErrors({});
    setServerError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nip: form.nip,
          nama: form.nama,
          email: form.email,
          password: form.password,
          no_hp: form.no_hp,
          fakultas_id: Number(form.fakultas_id),
          jurusan_id: Number(form.jurusan_id),
          is_active: true,
        }),
      });

      if (!res.ok) {
        let message = "Gagal mendaftarkan akun.";
        try {
          const err = await res.json();
          if (typeof err?.message === "string" && err.message) {
            message = err.message;
          }
        } catch {
          // ignore parse error
        }
        setServerError(message);
        return;
      }

      router.push("/login");
    } catch {
      setServerError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof RegisterForm, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <span className="font-semibold" style={{ color: "var(--color-primary)" }}>SiMahasiswa</span>
        </div>

        <div className="rounded-2xl border p-5 sm:p-6 mb-5 sm:mb-6" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="text-2xl font-bold mb-1">Buat Akun Baru</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Daftarkan diri Anda untuk menggunakan sistem
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3 rounded-lg flex items-center gap-2 text-sm animate-fade-in" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border p-5 sm:p-6" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">NIP</label>
              <input
                type="text"
                className={`input-base ${errors.nip ? "error" : ""}`}
                placeholder="Masukkan NIP"
                value={form.nip}
                onChange={(e) => update("nip", e.target.value)}
              />
              {errors.nip && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.nip}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                className={`input-base ${errors.nama ? "error" : ""}`}
                placeholder="Masukkan nama lengkap"
                value={form.nama}
                onChange={(e) => update("nama", e.target.value)}
              />
              {errors.nama && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.nama}</p>}
            </div>
          </div>

          <div className="grid gap-4 mt-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                className={`input-base ${errors.email ? "error" : ""}`}
                placeholder="nama@kampus.ac.id"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              {errors.email && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">No HP</label>
              <input
                type="text"
                className={`input-base ${errors.no_hp ? "error" : ""}`}
                placeholder="08xxxxxxxxxx"
                value={form.no_hp}
                onChange={(e) => update("no_hp", e.target.value)}
              />
              {errors.no_hp && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.no_hp}</p>}
            </div>
          </div>

          <div className="grid gap-4 mt-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Password</label>
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {showPass ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <input
                type={showPass ? "text" : "password"}
                className={`input-base ${errors.password ? "error" : ""}`}
                placeholder="Min. 6 karakter"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              {errors.password && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Konfirmasi Password</label>
              <input
                type={showPass ? "text" : "password"}
                className={`input-base ${errors.confirmPassword ? "error" : ""}`}
                placeholder="Ulangi password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="grid gap-4 mt-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Fakultas</label>
              <select
                className={`input-base ${errors.fakultas_id ? "error" : ""}`}
                value={form.fakultas_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    fakultas_id: e.target.value,
                    jurusan_id: "",
                  }))
                }
                disabled={loadingFakultas}
              >
                <option value="">{loadingFakultas ? "Memuat fakultas..." : "Pilih fakultas"}</option>
                {fakultasList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama_fakultas}
                  </option>
                ))}
              </select>
              {errors.fakultas_id && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.fakultas_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Jurusan</label>
              <select
                className={`input-base ${errors.jurusan_id ? "error" : ""}`}
                value={form.jurusan_id}
                onChange={(e) => update("jurusan_id", e.target.value)}
                disabled={!form.fakultas_id || loadingJurusan}
              >
                <option value="">
                  {!form.fakultas_id
                    ? "Pilih fakultas terlebih dahulu"
                    : loadingJurusan
                      ? "Memuat jurusan..."
                      : "Pilih jurusan"}
                </option>
                {jurusanList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama_jurusan}
                  </option>
                ))}
              </select>
              {errors.jurusan_id && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.jurusan_id}</p>}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-3 mt-6" disabled={loading}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mendaftarkan...
              </>
            ) : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--color-primary)" }}>
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}