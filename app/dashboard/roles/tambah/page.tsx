"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiResponse, EMPTY_ROLE_FORM, RoleForm } from "../types";

const API_URL = "http://localhost:3001/roles";
type FormErrors = Partial<Record<keyof RoleForm, string>>;

export default function TambahRolePage() {
  const router = useRouter();
  const [form, setForm] = useState<RoleForm>(EMPTY_ROLE_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (key: keyof RoleForm, value: string) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })); };
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!form.nama_role.trim()) nextErrors.nama_role = "Nama role wajib diisi.";
    if (!form.deskripsi.trim()) nextErrors.deskripsi = "Deskripsi wajib diisi.";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    setLoading(true); setServerError("");
    try { const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nama_role: form.nama_role.trim(), deskripsi: form.deskripsi.trim() }) }); const json: ApiResponse<unknown> = await response.json(); if (!response.ok) throw new Error(json.message || "Gagal menambahkan role."); router.push("/dashboard/roles"); } catch (error) { setServerError(error instanceof Error ? error.message : "Tidak bisa terhubung ke server."); } finally { setLoading(false); }
  };
  return <RoleFormView title="Tambah Role Baru" description="Isi formulir untuk menambahkan role baru." breadcrumb="Tambah Role" form={form} errors={errors} serverError={serverError} loading={loading} onChange={update} onSubmit={handleSubmit} />;
}

export function RoleFormView({ title, description, breadcrumb, form, errors, serverError, loading, onChange, onSubmit }: { title: string; description: string; breadcrumb: string; form: RoleForm; errors: FormErrors; serverError: string; loading: boolean; onChange: (key: keyof RoleForm, value: string) => void; onSubmit: (event: FormEvent) => void }) {
  return <div className="max-w-2xl"><div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}><Link href="/dashboard/roles" style={{ color: "var(--color-primary)" }}>Roles</Link><span>›</span><span>{breadcrumb}</span></div><h1 className="text-2xl font-bold mb-1">{title}</h1><p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>{description}</p>{serverError && <div className="mb-5 p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>{serverError}</div>}<div className="card p-6"><form onSubmit={onSubmit} className="space-y-5" noValidate><div><label className="block text-sm font-medium mb-1.5">Nama Role</label><input className={`input-base ${errors.nama_role ? "error" : ""}`} value={form.nama_role} onChange={(event) => onChange("nama_role", event.target.value)} />{errors.nama_role && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.nama_role}</p>}</div><div><label className="block text-sm font-medium mb-1.5">Deskripsi</label><textarea className={`input-base min-h-28 ${errors.deskripsi ? "error" : ""}`} value={form.deskripsi} onChange={(event) => onChange("deskripsi", event.target.value)} />{errors.deskripsi && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.deskripsi}</p>}</div><div className="flex gap-3 pt-2"><Link href="/dashboard/roles" className="btn-secondary flex-1 justify-center">Batal</Link><button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>{loading ? "Menyimpan..." : "Simpan Role"}</button></div></form></div></div>;
}