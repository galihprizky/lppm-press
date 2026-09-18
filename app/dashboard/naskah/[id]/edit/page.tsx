"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ApiListResponse,
  JENIS_BUKU_OPTIONS,
  Naskah,
  NaskahForm,
  STATUS_COVER_OPTIONS,
  TARGET_PEMBACA_OPTIONS,
  WARNA_ISI_OPTIONS,
} from "@/app/dashboard/naskah/types";

type FormErrors = Partial<Record<keyof NaskahForm, string>>;

const EMPTY_FORM: NaskahForm = {
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
};

export default function EditNaskahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [form, setForm] = useState<NaskahForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [judulPreview, setJudulPreview] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      setFetching(true);
      setServerError("");
      try {
        const res = await fetch("http://localhost:3001/naskah");
        const json: ApiListResponse<Naskah> = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        const found = list.find((x) => String(x.id) === id);

        if (!found) {
          setServerError("Data naskah tidak ditemukan.");
          return;
        }

        setJudulPreview(found.judul_naskah);
        setForm({
          pengusul_id: found.pengusul_id ?? "",
          judul_naskah: found.judul_naskah ?? "",
          sinopsis: found.sinopsis ?? "",
          jenis_buku: found.jenis_buku ?? "",
          target_pembaca: Array.isArray(found.target_pembaca) ? found.target_pembaca : [],
          nama_semua_penulis: found.nama_semua_penulis ?? "",
          warna_isi_buku: found.warna_isi_buku ?? "",
          pake_editor_pribadi: Boolean(found.pake_editor_pribadi),
          status_cover: found.status_cover ?? "",
          status_saat_ini: found.status_saat_ini ?? "",
        });
      } catch {
        setServerError("Tidak bisa memuat data naskah.");
      } finally {
        setFetching(false);
      }
    };

    fetchDetail();
  }, [id]);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.judul_naskah.trim()) e.judul_naskah = "Judul naskah wajib diisi.";
    if (!form.sinopsis.trim()) e.sinopsis = "Sinopsis wajib diisi.";
    if (!form.jenis_buku) e.jenis_buku = "Jenis buku wajib dipilih.";
    if (!form.target_pembaca.length) e.target_pembaca = "Target pembaca wajib dipilih.";
    if (!form.nama_semua_penulis.trim()) e.nama_semua_penulis = "Nama penulis wajib diisi.";
    if (!form.warna_isi_buku) e.warna_isi_buku = "Warna isi buku wajib dipilih.";
    if (!form.status_cover) e.status_cover = "Status cover wajib dipilih.";
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
      const { pengusul_id, status_saat_ini, ...payload } = form;
      const res = await fetch(`http://localhost:3001/naskah/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Gagal memperbarui naskah.";
        try {
          const err = await res.json();
          if (typeof err?.message === "string" && err.message) {
            message = err.message;
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

  if (fetching) {
    return <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Memuat data naskah...</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/dashboard/naskah" style={{ color: "var(--color-primary)" }}>Pengajuan Naskah</Link>
        <span>›</span>
        <span>{judulPreview || "Edit"}</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Edit Pengajuan Naskah</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        Perbarui informasi pengajuan naskah.
      </p>

      {serverError && (
        <div className="mb-5 p-3 rounded-lg flex items-center gap-2 text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {serverError}
        </div>
      )}

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

          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/naskah" className="btn-secondary flex-1 justify-center">Batal</Link>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
