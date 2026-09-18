"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ApiResponse, Role } from "../types";

const API_URL = "http://localhost:3001/roles";
export default function DetailRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { fetch(`${API_URL}/${id}`).then(async (response) => { const json: ApiResponse<Role> = await response.json(); if (!response.ok) throw new Error(json.message || "Role tidak ditemukan."); setRole(json.data); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Tidak bisa memuat detail role.")).finally(() => setLoading(false)); }, [id]);
  if (loading) return <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Memuat detail role...</div>;
  if (!role) return <div className="text-center py-20"><p className="text-lg font-semibold mb-2">{error || "Role tidak ditemukan"}</p><Link href="/dashboard/roles" className="btn-primary">Kembali ke Daftar</Link></div>;
  return <div className="max-w-2xl"><div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}><Link href="/dashboard/roles" style={{ color: "var(--color-primary)" }}>Roles</Link><span>›</span><span>{role.nama_role}</span></div><div className="card p-6 mb-5"><div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6"><div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ background: "var(--color-primary)" }}>{role.nama_role.charAt(0)}</div><div className="flex-1"><h1 className="text-xl font-bold">{role.nama_role}</h1><p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Detail role sistem</p></div><Link href={`/dashboard/roles/${role.id}/edit`} className="btn-edit">Edit</Link></div><div className="py-3 border-b" style={{ borderColor: "var(--color-border)" }}><span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Nama Role</span><span className="text-sm">{role.nama_role}</span></div><div className="py-3"><span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Deskripsi</span><span className="text-sm">{role.deskripsi}</span></div></div><Link href="/dashboard/roles" className="btn-secondary">Kembali ke Daftar</Link></div>;
}