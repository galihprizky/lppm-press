"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  JENIS_BUKU_OPTIONS,
  NaskahForm,
  STATUS_COVER_OPTIONS,
  TARGET_PEMBACA_OPTIONS,
  toApiTargetPembaca,
  WARNA_ISI_OPTIONS,
} from "@/app/dashboard/naskah/types";
import { API_URL } from "@/lib/config";

type FormErrors = Partial<Record<keyof NaskahForm, string>>;

const INITIAL_FORM: NaskahForm = {
  pengusul_id: "",
  judul_naskah: "",
  sinopsis: "",
  jenis_buku: "",
  target_pembaca: [],
  nama_semua_penulis: "",
  warna_isi_buku: "",
  pake_editor_pribadi: false,
  status_cover: "",
  status_saat_ini: "",
  file_draft_naskah: null,
  file_profile_penulis: null,
  file_surat_keaslian: null,
};

export default function TambahNaskahPage() {
  const router = useRouter();
  const [form, setForm] = useState<NaskahForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.judul_naskah.trim()) e.judul_naskah = "Judul naskah wajib diisi.";
    if (!form.sinopsis.trim()) e.sinopsis = "Sinopsis wajib diisi.";
    if (!form.jenis_buku) e.jenis_buku = "Jenis buku wajib dipilih.";
    if (!form.target_pembaca.length) e.target_pembaca = "Target pembaca wajib dipilih.";
    if (!form.nama_semua_penulis.trim()) e.nama_semua_penulis = "Nama penulis wajib diisi.";
    if (!form.warna_isi_buku) e.warna_isi_buku = "Warna isi buku wajib dipilih.";
    if (!form.status_cover) e.status_cover = "Status cover wajib dipilih.";
    if (!form.file_draft_naskah) e.file_draft_naskah = "File draft naskah wajib diunggah.";
    if (!form.file_profile_penulis) e.file_profile_penulis = "File profil penulis wajib diunggah.";
    if (!form.file_surat_keaslian) e.file_surat_keaslian = "File surat keaslian wajib diunggah.";
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
      const userId = localStorage.getItem("user_id") ?? "";
      if (!userId || !/^\d+$/.test(userId)) {
        setServerError("Sesi user tidak valid. Silakan logout lalu login kembali dengan akun Author.");
        return;
      }
      const { file_draft_naskah, file_profile_penulis, file_surat_keaslian, ...rest } = form;

      const formData = new FormData();
      Object.entries({
        ...rest,
        pengusul_id: userId,
        status_saat_ini: "SUBMITTED",
      }).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => formData.append(`${key}[]`, toApiTargetPembaca(item)));
        } else {
          formData.append(key, String(value));
        }
      });
      if (file_draft_naskah) formData.append("file_draft_naskah", file_draft_naskah);
      if (file_profile_penulis) formData.append("file_profile_penulis", file_profile_penulis);
      if (file_surat_keaslian) formData.append("file_surat_keaslian", file_surat_keaslian);

      const res = await fetch(`${API_URL}/naskah`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "Gagal menyimpan pengajuan naskah.";
        try {
          const err = await res.json();
          if (typeof err?.message === "string" && err.message) {
            message = err.message;
          } else if (Array.isArray(err?.message)) {
            message = err.message.join(" ");
          }
        } catch {
          // ignore parse errors
        }
        setServerError(message);
        return;
      }

      router.push("/dashboard/naskah");
    } catch {
      setServerError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof NaskahForm, val: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toggleTargetPembaca = (target: string) => {
    const next = form.target_pembaca.includes(target)
      ? form.target_pembaca.filter((x) => x !== target)
      : [...form.target_pembaca, target];
    update("target_pembaca", next);
  };

  const handleFile = (key: "file_draft_naskah" | "file_profile_penulis" | "file_surat_keaslian", file: File | null) => {
    setForm((prev) => ({ ...prev, [key]: file }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/dashboard/naskah" style={{ color: "var(--color-primary)" }}>Pengajuan Naskah</Link>
        <span>›</span>
        <span>Tambah</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Ajukan Naskah Baru</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        Isi formulir berikut untuk mengajukan naskah.
      </p>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Jenis Buku</label>
              <select
                className={`input-base ${errors.jenis_buku ? "error" : ""}`}
                value={form.jenis_buku}
                onChange={(e) => update("jenis_buku", e.target.value)}
              >
                <option value="">Pilih jenis buku...</option>
                {JENIS_BUKU_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {errors.jenis_buku && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.jenis_buku}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Judul Naskah</label>
            <input
              className={`input-base ${errors.judul_naskah ? "error" : ""}`}
              value={form.judul_naskah}
              onChange={(e) => update("judul_naskah", e.target.value)}
            />
            {errors.judul_naskah && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.judul_naskah}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Sinopsis</label>
            <textarea
              className={`input-base min-h-28 ${errors.sinopsis ? "error" : ""}`}
              value={form.sinopsis}
              onChange={(e) => update("sinopsis", e.target.value)}
            />
            {errors.sinopsis && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.sinopsis}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Target Pembaca</label>
            <div className="grid sm:grid-cols-3 gap-2">
              {TARGET_PEMBACA_OPTIONS.map((target) => (
                <label key={target} className="flex items-center gap-2 text-sm p-2 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
                  <input
                    type="checkbox"
                    checked={form.target_pembaca.includes(target)}
                    onChange={() => toggleTargetPembaca(target)}
                  />
                  <span>{target}</span>
                </label>
              ))}
            </div>
            {errors.target_pembaca && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.target_pembaca}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Semua Penulis</label>
            <input
              className={`input-base ${errors.nama_semua_penulis ? "error" : ""}`}
              placeholder="Pisahkan dengan koma"
              value={form.nama_semua_penulis}
              onChange={(e) => update("nama_semua_penulis", e.target.value)}
            />
            {errors.nama_semua_penulis && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.nama_semua_penulis}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Warna Isi Buku</label>
              <select
                className={`input-base ${errors.warna_isi_buku ? "error" : ""}`}
                value={form.warna_isi_buku}
                onChange={(e) => update("warna_isi_buku", e.target.value)}
              >
                <option value="">Pilih warna isi...</option>
                {WARNA_ISI_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {errors.warna_isi_buku && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.warna_isi_buku}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Status Cover</label>
              <select
                className={`input-base ${errors.status_cover ? "error" : ""}`}
                value={form.status_cover}
                onChange={(e) => update("status_cover", e.target.value)}
              >
                <option value="">Pilih status cover...</option>
                {STATUS_COVER_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {errors.status_cover && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.status_cover}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Pakai Editor Pribadi</label>
              <div className="h-[42px] flex items-center px-3 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.pake_editor_pribadi}
                    onChange={(e) => update("pake_editor_pribadi", e.target.checked)}
                  />
                  <span>Ya, pakai editor pribadi</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">File Draft Naskah</label>
              <input
                type="file"
                accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,image/jpeg,.jpg,.jpeg,image/png,.png"
                className={`input-base ${errors.file_draft_naskah ? "error" : ""}`}
                onChange={(e) => handleFile("file_draft_naskah", e.target.files?.[0] ?? null)}
              />
              {errors.file_draft_naskah && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.file_draft_naskah}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">File Profil Penulis</label>
              <input
                type="file"
                accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,image/jpeg,.jpg,.jpeg,image/png,.png"
                className={`input-base ${errors.file_profile_penulis ? "error" : ""}`}
                onChange={(e) => handleFile("file_profile_penulis", e.target.files?.[0] ?? null)}
              />
              {errors.file_profile_penulis && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.file_profile_penulis}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">File Surat Keaslian</label>
              <input
                type="file"
                accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,image/jpeg,.jpg,.jpeg,image/png,.png"
                className={`input-base ${errors.file_surat_keaslian ? "error" : ""}`}
                onChange={(e) => handleFile("file_surat_keaslian", e.target.files?.[0] ?? null)}
              />
              {errors.file_surat_keaslian && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.file_surat_keaslian}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/naskah" className="btn-secondary flex-1 justify-center">Batal</Link>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Pengajuan"
              )}
            </button>
          </div>
        </form>

        {serverError && (
          <div className="mt-5 p-3 rounded-lg flex items-center gap-2 text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {serverError}
          </div>
        )}
      </div>
    </div>
  );
}
