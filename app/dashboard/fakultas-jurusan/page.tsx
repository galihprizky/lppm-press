"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_URL } from "@/lib/config";

interface Fakultas {
  id: number;
  kode_fakultas: string;
  nama_fakultas: string;
}

interface Jurusan {
  id: number;
  kode_jurusan: string;
  nama_jurusan: string;
  fakultas_id: number;
}

type FakultasForm = Omit<Fakultas, "id">;
type JurusanForm = Omit<Jurusan, "id">;
type FakultasErrors = Partial<Record<keyof FakultasForm, string>>;
type JurusanErrors = Partial<Record<keyof JurusanForm, string>>;

const EMPTY_FAKULTAS: FakultasForm = { kode_fakultas: "", nama_fakultas: "" };
const EMPTY_JURUSAN: JurusanForm = { kode_jurusan: "", nama_jurusan: "", fakultas_id: 0 };

interface ApiResponse<T> {
  data?: T | T[];
  message?: string;
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body: ApiResponse<unknown> = await response.json();
    return body.message || `${fallback} (HTTP ${response.status}).`;
  } catch {
    return `${fallback} (HTTP ${response.status}).`;
  }
}

async function fetchList<T>(endpoint: string): Promise<T[]> {
  const response = await fetch(`${API_URL}/${endpoint}`);
  if (!response.ok) throw new Error(await getErrorMessage(response, `Gagal memuat ${endpoint}`));

  const body: ApiResponse<T> = await response.json();
  return Array.isArray(body.data) ? body.data : [];
}

export default function FakultasJurusanPage() {
  const [fakultas, setFakultas] = useState<Fakultas[]>([]);
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const [fakultasForm, setFakultasForm] = useState<FakultasForm>(EMPTY_FAKULTAS);
  const [jurusanForm, setJurusanForm] = useState<JurusanForm>(EMPTY_JURUSAN);
  const [fakultasErrors, setFakultasErrors] = useState<FakultasErrors>({});
  const [jurusanErrors, setJurusanErrors] = useState<JurusanErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingFakultas, setSavingFakultas] = useState(false);
  const [savingJurusan, setSavingJurusan] = useState(false);
  const [editingFakultasId, setEditingFakultasId] = useState<number | null>(null);
  const [editingJurusanId, setEditingJurusanId] = useState<number | null>(null);

  useEffect(() => {
    void refreshLists();
  }, []);

  const refreshLists = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [fakultasList, jurusanList] = await Promise.all([
        fetchList<Fakultas>("fakultas"),
        fetchList<Jurusan>("jurusan"),
      ]);
      setFakultas(fakultasList);
      setJurusan(jurusanList);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Tidak bisa memuat data Fakultas dan Jurusan.");
    } finally {
      setLoading(false);
    }
  };

  const updateFakultas = (key: keyof FakultasForm, value: string) => {
    setFakultasForm((current) => ({ ...current, [key]: value }));
    setFakultasErrors((current) => ({ ...current, [key]: "" }));
  };

  const updateJurusan = (key: keyof JurusanForm, value: string | number) => {
    setJurusanForm((current) => ({ ...current, [key]: value }));
    setJurusanErrors((current) => ({ ...current, [key]: "" }));
  };

  const submitFakultas = async (event: FormEvent) => {
    event.preventDefault();
    const errors: FakultasErrors = {};
    if (!fakultasForm.kode_fakultas.trim()) errors.kode_fakultas = "Kode fakultas wajib diisi.";
    if (!fakultasForm.nama_fakultas.trim()) errors.nama_fakultas = "Nama fakultas wajib diisi.";
    if (Object.keys(errors).length) {
      setFakultasErrors(errors);
      return;
    }

    setSavingFakultas(true);
    setErrorMessage("");
    try {
      const response = await fetch(
        editingFakultasId ? `${API_URL}/fakultas/${editingFakultasId}` : `${API_URL}/fakultas`,
        {
          method: editingFakultasId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kode_fakultas: fakultasForm.kode_fakultas.trim(),
            nama_fakultas: fakultasForm.nama_fakultas.trim(),
          }),
        }
      );
      if (!response.ok) throw new Error(await getErrorMessage(response, "Gagal menyimpan fakultas"));
      setFakultasForm(EMPTY_FAKULTAS);
      setEditingFakultasId(null);
      setSuccessMessage(editingFakultasId ? "Fakultas berhasil diperbarui." : "Fakultas berhasil ditambahkan.");
      await refreshLists();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Tidak bisa menyimpan fakultas.");
    } finally {
      setSavingFakultas(false);
    }
  };

  const submitJurusan = async (event: FormEvent) => {
    event.preventDefault();
    const errors: JurusanErrors = {};
    if (!jurusanForm.kode_jurusan.trim()) errors.kode_jurusan = "Kode jurusan wajib diisi.";
    if (!jurusanForm.nama_jurusan.trim()) errors.nama_jurusan = "Nama jurusan wajib diisi.";
    if (!jurusanForm.fakultas_id) errors.fakultas_id = "Fakultas wajib dipilih.";
    if (Object.keys(errors).length) {
      setJurusanErrors(errors);
      return;
    }

    setSavingJurusan(true);
    setErrorMessage("");
    try {
      const response = await fetch(
        editingJurusanId ? `${API_URL}/jurusan/${editingJurusanId}` : `${API_URL}/jurusan`,
        {
          method: editingJurusanId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fakultas_id: jurusanForm.fakultas_id,
            kode_jurusan: jurusanForm.kode_jurusan.trim(),
            nama_jurusan: jurusanForm.nama_jurusan.trim(),
          }),
        }
      );
      if (!response.ok) throw new Error(await getErrorMessage(response, "Gagal menyimpan jurusan"));
      setJurusanForm(EMPTY_JURUSAN);
      setEditingJurusanId(null);
      setSuccessMessage(editingJurusanId ? "Jurusan berhasil diperbarui." : "Jurusan berhasil ditambahkan.");
      await refreshLists();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Tidak bisa menyimpan jurusan.");
    } finally {
      setSavingJurusan(false);
    }
  };

  const editFakultas = (item: Fakultas) => {
    setEditingFakultasId(item.id);
    setFakultasForm({ kode_fakultas: item.kode_fakultas, nama_fakultas: item.nama_fakultas });
    setFakultasErrors({});
  };

  const editJurusan = (item: Jurusan) => {
    setEditingJurusanId(item.id);
    setJurusanForm({ kode_jurusan: item.kode_jurusan, nama_jurusan: item.nama_jurusan, fakultas_id: item.fakultas_id });
    setJurusanErrors({});
  };

  const fakultasName = (fakultasId: number) => fakultas.find((item) => item.id === fakultasId)?.nama_fakultas ?? "-";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Fakultas dan Jurusan</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Kelola referensi fakultas dan jurusan.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: "var(--color-success-pale)", color: "var(--color-success)" }}>
          {successMessage}
        </div>
      )}

      <div className="grid xl:grid-cols-2 gap-6 mb-8">
        <section className="card p-6">
          <h2 className="font-semibold mb-1">{editingFakultasId ? "Edit Fakultas" : "Tambah Fakultas"}</h2>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>Masukkan kode dan nama fakultas.</p>
          <form onSubmit={submitFakultas} className="space-y-5" noValidate>
            <Field label="Kode Fakultas" value={fakultasForm.kode_fakultas} error={fakultasErrors.kode_fakultas} onChange={(value) => updateFakultas("kode_fakultas", value)} />
            <Field label="Nama Fakultas" value={fakultasForm.nama_fakultas} error={fakultasErrors.nama_fakultas} onChange={(value) => updateFakultas("nama_fakultas", value)} />
            <div className="flex gap-3">
              {editingFakultasId && <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => { setEditingFakultasId(null); setFakultasForm(EMPTY_FAKULTAS); }}>Batal</button>}
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={savingFakultas}>{savingFakultas ? "Menyimpan..." : editingFakultasId ? "Simpan Perubahan" : "Simpan Fakultas"}</button>
            </div>
          </form>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold mb-1">{editingJurusanId ? "Edit Jurusan" : "Tambah Jurusan"}</h2>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>Pilih fakultas untuk mengisi `fakultas_id`.</p>
          <form onSubmit={submitJurusan} className="space-y-5" noValidate>
            <Field label="Kode Jurusan" value={jurusanForm.kode_jurusan} error={jurusanErrors.kode_jurusan} onChange={(value) => updateJurusan("kode_jurusan", value)} />
            <Field label="Nama Jurusan" value={jurusanForm.nama_jurusan} error={jurusanErrors.nama_jurusan} onChange={(value) => updateJurusan("nama_jurusan", value)} />
            <div>
              <label className="block text-sm font-medium mb-1.5">Fakultas</label>
              <select className={`input-base ${jurusanErrors.fakultas_id ? "error" : ""}`} value={jurusanForm.fakultas_id || ""} onChange={(event) => updateJurusan("fakultas_id", Number(event.target.value))}>
                <option value="">Pilih fakultas...</option>
                {fakultas.map((item) => <option key={item.id} value={item.id}>{item.kode_fakultas} - {item.nama_fakultas}</option>)}
              </select>
              {jurusanErrors.fakultas_id && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{jurusanErrors.fakultas_id}</p>}
            </div>
            <div className="flex gap-3">
              {editingJurusanId && <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => { setEditingJurusanId(null); setJurusanForm(EMPTY_JURUSAN); }}>Batal</button>}
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={savingJurusan}>{savingJurusan ? "Menyimpan..." : editingJurusanId ? "Simpan Perubahan" : "Simpan Jurusan"}</button>
            </div>
          </form>
        </section>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <ReferenceTable title="Daftar Fakultas" empty={loading ? "Memuat fakultas..." : "Belum ada fakultas."} headers={["Kode", "Nama Fakultas", "Aksi"]} rows={fakultas.map((item) => [item.kode_fakultas, item.nama_fakultas, item.id.toString()])} onEdit={(id) => editFakultas(fakultas.find((item) => item.id === id)!)} />
        <ReferenceTable title="Daftar Jurusan" empty={loading ? "Memuat jurusan..." : "Belum ada jurusan."} headers={["Kode", "Nama Jurusan", "Fakultas", "Aksi"]} rows={jurusan.map((item) => [item.kode_jurusan, item.nama_jurusan, fakultasName(item.fakultas_id), item.id.toString()])} onEdit={(id) => editJurusan(jurusan.find((item) => item.id === id)!)} />
      </div>
    </div>
  );
}

function Field({ label, value, error, onChange }: { label: string; value: string; error?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input className={`input-base ${error ? "error" : ""}`} value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}
    </div>
  );
}

function ReferenceTable({ title, headers, rows, empty, onEdit }: { title: string; headers: string[]; rows: string[][]; empty: string; onEdit: (id: number) => void }) {
  return (
    <section className="card overflow-hidden">
      <div className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{rows.length} data tersimpan</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--color-bg)" }}>
              {headers.map((header) => <th key={header} className="text-left px-5 py-3 font-medium" style={{ color: "var(--color-text-muted)" }}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => <tr key={`${row[0]}-${index}`} className="border-t" style={{ borderColor: "var(--color-border)" }}>{row.map((cell, cellIndex) => cellIndex === row.length - 1 ? <td key={`${cell}-${cellIndex}`} className="px-5 py-3"><button type="button" className="btn-edit" onClick={() => onEdit(Number(cell))}>Edit</button></td> : <td key={`${cell}-${cellIndex}`} className="px-5 py-3">{cell}</td>)}</tr>)}
            {!rows.length && <tr><td colSpan={headers.length} className="px-5 py-8 text-center" style={{ color: "var(--color-text-muted)" }}>{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
