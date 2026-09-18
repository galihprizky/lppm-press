"use client";
// src/app/dashboard/mahasiswa/[id]/edit/page.tsx
import { useState, useEffect, FormEvent, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { JURUSAN_OPTIONS } from "@/data/dummy";

interface MahasiswaForm {
  nim: string;
  nama: string;
  email: string;
  jurusan: string;
  tanggal_lahir: string;
}

type FormErrors = Partial<Record<keyof MahasiswaForm, string>>;

export default function EditMahasiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getMahasiswaById, updateMahasiswa } = useApp();
  const router = useRouter();
  const mhs = getMahasiswaById(id);

  const [form, setForm] = useState<MahasiswaForm>({
    nim: "", nama: "", email: "", jurusan: "", tanggal_lahir: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mhs) {
      setForm({
        nim: mhs.nim,
        nama: mhs.nama,
        email: mhs.email,
        jurusan: mhs.jurusan,
        tanggal_lahir: mhs.tanggal_lahir ?? "",
      });
    }
  }, [mhs]);

  if (!mhs) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold mb-2">Mahasiswa tidak ditemukan</p>
        <Link href="/dashboard/mahasiswa" className="btn-primary">Kembali ke Daftar</Link>
      </div>
    );
  }

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.nim.trim()) e.nim = "NIM wajib diisi.";
    if (!form.nama.trim()) e.nama = "Nama wajib diisi.";
    if (!form.email) e.email = "Email wajib diisi.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid.";
    if (!form.jurusan) e.jurusan = "Jurusan wajib dipilih.";
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = updateMahasiswa(id, form);
    setLoading(false);
    if (result.success) {
      router.push(`/dashboard/mahasiswa/${id}`);
    } else {
      setServerError(result.message ?? "Terjadi kesalahan.");
    }
  };

  const update = (key: keyof MahasiswaForm, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/dashboard/mahasiswa" style={{ color: "var(--color-primary)" }}>Data Mahasiswa</Link>
        <span>›</span>
        <Link href={`/dashboard/mahasiswa/${id}`} style={{ color: "var(--color-primary)" }}>{mhs.nama}</Link>
        <span>›</span>
        <span>Edit</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Edit Data Mahasiswa</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        Perbarui informasi mahasiswa <strong>{mhs.nama}</strong>.
      </p>

      {serverError && (
        <div className="mb-5 p-3 rounded-lg flex items-center gap-2 text-sm"
          style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {serverError}
        </div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                NIM <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                className={`input-base font-mono ${errors.nim ? "error" : ""}`}
                value={form.nim}
                onChange={(e) => update("nim", e.target.value)}
              />
              {errors.nim && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.nim}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Jurusan <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <select
                className={`input-base ${errors.jurusan ? "error" : ""}`}
                value={form.jurusan}
                onChange={(e) => update("jurusan", e.target.value)}
              >
                <option value="">Pilih jurusan...</option>
                {JURUSAN_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
              {errors.jurusan && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.jurusan}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nama Lengkap <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              className={`input-base ${errors.nama ? "error" : ""}`}
              value={form.nama}
              onChange={(e) => update("nama", e.target.value)}
            />
            {errors.nama && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.nama}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Email <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              type="email"
              className={`input-base ${errors.email ? "error" : ""}`}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            {errors.email && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Tanggal Lahir{" "}
              <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>(opsional)</span>
            </label>
            <input
              type="date"
              className="input-base"
              value={form.tanggal_lahir}
              onChange={(e) => update("tanggal_lahir", e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Link href={`/dashboard/mahasiswa/${id}`} className="btn-secondary flex-1 justify-center">Batal</Link>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                  </svg>
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}