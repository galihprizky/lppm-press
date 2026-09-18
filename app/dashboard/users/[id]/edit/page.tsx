"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserForm from "../../UserForm";
import { EMPTY_USER_FORM } from "../../types";
import type { ApiResponse, User, UserForm as UserFormData } from "../../types";

const API_URL = "http://localhost:3001/users";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => { fetch(`${API_URL}/${id}`).then(async (response) => { const json: ApiResponse<User> = await response.json(); if (!response.ok) throw new Error(json.message || "User tidak ditemukan."); setUser(json.data); }).catch((reason) => setServerError(reason instanceof Error ? reason.message : "Tidak bisa memuat user.")).finally(() => setLoading(false)); }, [id]);

  const handleSubmit = async (form: UserFormData) => {
    setSaving(true); setServerError("");
    const payload: Record<string, unknown> = { nip: form.nip, nama: form.nama, email: form.email, no_hp: form.no_hp, jurusan_id: Number(form.jurusan_id), role_ids: form.role_ids, is_active: form.is_active };
    if (form.password) payload.password = form.password;
    try { const response = await fetch(`${API_URL}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const json: ApiResponse<unknown> = await response.json(); if (!response.ok) throw new Error(json.message || "Gagal memperbarui user."); router.push(`/dashboard/users/${id}`); } catch (error) { setServerError(error instanceof Error ? error.message : "Tidak bisa terhubung ke server."); } finally { setSaving(false); }
  };

  if (loading) return <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Memuat user...</div>;
  if (!user) return <div className="text-center py-20"><p className="text-lg font-semibold mb-2">{serverError || "User tidak ditemukan"}</p><Link href="/dashboard/users" className="btn-primary">Kembali ke Daftar</Link></div>;
  const initialForm: UserFormData = { ...EMPTY_USER_FORM, nip: user.nip ?? "", nama: user.nama ?? "", email: user.email ?? "", no_hp: user.no_hp ?? "", jurusan_id: String(user.jurusan_id ?? ""), fakultas_id: user.jurusan?.fakultas_id ? String(user.jurusan.fakultas_id) : "", role_ids: user.roles.map((role) => role.id), is_active: user.is_active };
  return <div className="max-w-3xl"><div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}><Link href="/dashboard/users" style={{ color: "var(--color-primary)" }}>Users</Link><span>›</span><span>Edit User</span></div><h1 className="text-2xl font-bold mb-1">Edit User</h1><p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>Perbarui data dan role user.</p><div className="card p-6"><UserForm initialForm={initialForm} isEdit loading={saving} serverError={serverError} onSubmit={handleSubmit} /></div></div>;
}