"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { ApiResponse, User } from "../types";

export default function DetailUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { fetch(`http://localhost:3001/users/${id}`).then(async (response) => { const json: ApiResponse<User> = await response.json(); if (!response.ok) throw new Error(json.message || "User tidak ditemukan."); setUser(json.data); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Tidak bisa memuat detail user.")).finally(() => setLoading(false)); }, [id]);
  if (loading) return <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Memuat detail user...</div>;
  if (!user) return <div className="text-center py-20"><p className="text-lg font-semibold mb-2">{error || "User tidak ditemukan"}</p><Link href="/dashboard/users" className="btn-primary">Kembali ke Daftar</Link></div>;
  return <div className="max-w-3xl"><div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}><Link href="/dashboard/users" style={{ color: "var(--color-primary)" }}>Users</Link><span>›</span><span>{user.nama}</span></div><div className="card p-6 mb-5"><div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6"><div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ background: "var(--color-primary)" }}>{user.nama.charAt(0)}</div><div className="flex-1"><h1 className="text-xl font-bold">{user.nama}</h1><p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{user.email}</p></div><Link href={`/dashboard/users/${user.id}/edit`} className="btn-edit">Edit</Link></div><InfoRow label="NIP" value={user.nip} /><InfoRow label="Nama" value={user.nama} /><InfoRow label="Email" value={user.email} /><InfoRow label="No HP" value={user.no_hp} /><InfoRow label="Fakultas" value={user.jurusan?.nama_fakultas} /><InfoRow label="Jurusan" value={user.jurusan?.nama_jurusan} /><InfoRow label="Role" value={user.roles.map((role) => role.nama_role).join(", ")} /><InfoRow label="Status" value={user.is_active ? "Aktif" : "Nonaktif"} /></div><Link href="/dashboard/users" className="btn-secondary">Kembali ke Daftar</Link></div>;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) { return <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}><span className="text-sm font-medium w-40 flex-shrink-0 mb-1 sm:mb-0" style={{ color: "var(--color-text-muted)" }}>{label}</span><span className="text-sm">{value || <span style={{ color: "var(--color-text-muted)" }}>-</span>}</span></div>; }