"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Fakultas, Jurusan, UserForm as UserFormData, UserRole } from "./types";

interface UserFormProps {
  initialForm: UserFormData;
  isEdit?: boolean;
  loading?: boolean;
  serverError?: string;
  onSubmit: (form: UserFormData) => void;
}

type FormErrors = Partial<Record<keyof UserFormData, string>>;

export default function UserForm({ initialForm, isEdit = false, loading = false, serverError = "", onSubmit }: UserFormProps) {
  const [form, setForm] = useState<UserFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [fakultasList, setFakultasList] = useState<Fakultas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [roleList, setRoleList] = useState<UserRole[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingJurusan, setLoadingJurusan] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/fakultas").then((response) => response.json()),
      fetch("http://localhost:3001/roles").then((response) => response.json()),
    ]).then(([fakultas, roles]) => {
      setFakultasList(Array.isArray(fakultas?.data) ? fakultas.data : []);
      setRoleList(Array.isArray(roles?.data) ? roles.data : []);
    }).catch(() => {
      setFakultasList([]);
      setRoleList([]);
    }).finally(() => setLoadingOptions(false));
  }, []);

  useEffect(() => {
    if (!form.fakultas_id) {
      setJurusanList([]);
      return;
    }
    setLoadingJurusan(true);
    fetch(`http://localhost:3001/jurusan/fakultas/${form.fakultas_id}`)
      .then((response) => response.json())
      .then((json) => setJurusanList(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setJurusanList([]))
      .finally(() => setLoadingJurusan(false));
  }, [form.fakultas_id]);

  const update = (key: keyof UserFormData, value: string | boolean | number[]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const toggleRole = (roleId: number) => {
    const roleIds = form.role_ids.includes(roleId) ? form.role_ids.filter((id) => id !== roleId) : [...form.role_ids, roleId];
    update("role_ids", roleIds);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!form.nip.trim()) nextErrors.nip = "NIP wajib diisi.";
    if (!form.nama.trim()) nextErrors.nama = "Nama wajib diisi.";
    if (!form.email.trim()) nextErrors.email = "Email wajib diisi.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = "Format email tidak valid.";
    if (!form.no_hp.trim()) nextErrors.no_hp = "No HP wajib diisi.";
    if (!form.jurusan_id) nextErrors.jurusan_id = "Jurusan wajib dipilih.";
    if (!form.role_ids.length) nextErrors.role_ids = "Minimal satu role wajib dipilih.";
    if (!isEdit && !form.password) nextErrors.password = "Password wajib diisi.";
    if (form.password && form.password.length < 6) nextErrors.password = "Password minimal 6 karakter.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    onSubmit(form);
  };

  const input = (key: keyof UserFormData, type = "text") => (
    <input type={type} className={`input-base ${errors[key] ? "error" : ""}`} value={String(form[key])} onChange={(event) => update(key, event.target.value)} />
  );

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {serverError && <div className="p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>{serverError}</div>}
      <div className="grid sm:grid-cols-2 gap-5">
        <div><label className="block text-sm font-medium mb-1.5">NIP</label>{input("nip")}{errors.nip && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.nip}</p>}</div>
        <div><label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>{input("nama")}{errors.nama && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.nama}</p>}</div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div><label className="block text-sm font-medium mb-1.5">Email</label>{input("email", "email")}{errors.email && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.email}</p>}</div>
        <div><label className="block text-sm font-medium mb-1.5">No HP</label>{input("no_hp", "tel")}{errors.no_hp && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.no_hp}</p>}</div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div><label className="block text-sm font-medium mb-1.5">Fakultas</label><select className="input-base" value={form.fakultas_id} disabled={loadingOptions} onChange={(event) => setForm((current) => ({ ...current, fakultas_id: event.target.value, jurusan_id: "" }))}><option value="">{loadingOptions ? "Memuat fakultas..." : "Pilih fakultas..."}</option>{fakultasList.map((item) => <option key={item.id} value={item.id}>{item.nama_fakultas}</option>)}</select></div>
        <div><label className="block text-sm font-medium mb-1.5">Jurusan</label><select className={`input-base ${errors.jurusan_id ? "error" : ""}`} value={form.jurusan_id} disabled={!form.fakultas_id || loadingJurusan} onChange={(event) => update("jurusan_id", event.target.value)}><option value="">{loadingJurusan ? "Memuat jurusan..." : "Pilih jurusan..."}</option>{jurusanList.map((item) => <option key={item.id} value={item.id}>{item.kode_jurusan} - {item.nama_jurusan}</option>)}</select>{errors.jurusan_id && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.jurusan_id}</p>}</div>
      </div>
      <div><label className="block text-sm font-medium mb-1.5">Roles</label><div className="grid sm:grid-cols-2 gap-2">{roleList.length ? roleList.map((role) => <label key={role.id} className="flex items-center gap-2 text-sm p-2 rounded-lg border" style={{ borderColor: "var(--color-border)" }}><input type="checkbox" checked={form.role_ids.includes(role.id)} onChange={() => toggleRole(role.id)} /><span>{role.nama_role}</span></label>) : <p className="text-sm" style={{ color: "var(--color-danger)" }}>Daftar role tidak dapat dimuat.</p>}</div>{errors.role_ids && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.role_ids}</p>}</div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div><label className="block text-sm font-medium mb-1.5">Password {isEdit && <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>(kosongkan jika tidak diubah)</span>}</label>{input("password", "password")}{errors.password && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.password}</p>}</div>
        <div><label className="block text-sm font-medium mb-1.5">Status</label><label className="h-[42px] flex items-center gap-2 px-3 rounded-lg border text-sm" style={{ borderColor: "var(--color-border)" }}><input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} /> User aktif</label></div>
      </div>
      <div className="flex gap-3 pt-2"><button type="button" className="btn-secondary flex-1 justify-center" onClick={() => history.back()}>Batal</button><button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>{loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan User"}</button></div>
    </form>
  );
}