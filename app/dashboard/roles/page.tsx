"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiResponse, Role } from "./types";

const API_URL = "http://localhost:3001/roles";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    setServerError("");
    try {
      const response = await fetch(API_URL);
      const json: ApiResponse<Role[]> = await response.json();
      if (!response.ok) throw new Error(json.message || "Gagal memuat data role.");
      setRoles(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Tidak bisa memuat data role.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return roles;
    return roles.filter((role) =>
      role.nama_role.toLowerCase().includes(query) || role.deskripsi.toLowerCase().includes(query)
    );
  }, [roles, search]);

  const handleDelete = async () => {
    if (!deleteRole) return;
    setDeleting(true);
    setServerError("");
    try {
      const response = await fetch(`${API_URL}/${deleteRole.id}`, { method: "DELETE" });
      if (!response.ok) {
        const json: Partial<ApiResponse<unknown>> = await response.json().catch(() => ({}));
        throw new Error(json.message || "Gagal menghapus role.");
      }
      setRoles((current) => current.filter((role) => role.id !== deleteRole.id));
      setSuccessMsg(`Role ${deleteRole.nama_role} berhasil dihapus.`);
      setDeleteRole(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Tidak bisa menghapus role.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{roles.length} role terdaftar</p>
        </div>
        <Link href="/dashboard/roles/tambah" className="btn-primary">Tambah Role</Link>
      </div>

      {successMsg && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--color-success-pale)", color: "var(--color-success)" }}>{successMsg}</div>}
      {serverError && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>{serverError}</div>}

      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <input className="input-base max-w-sm" placeholder="Cari nama atau deskripsi role..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}><th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Nama Role</th><th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Deskripsi</th><th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={3} className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>Memuat data...</td></tr> : filteredRoles.length === 0 ? <tr><td colSpan={3} className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>Belum ada data role.</td></tr> : filteredRoles.map((role, index) => <tr key={role.id} style={{ borderBottom: index < filteredRoles.length - 1 ? "1px solid var(--color-border)" : "none" }}><td className="px-4 py-3.5 font-medium">{role.nama_role}</td><td className="px-4 py-3.5" style={{ color: "var(--color-text-muted)" }}>{role.deskripsi}</td><td className="px-4 py-3.5"><div className="flex items-center justify-end gap-2"><Link href={`/dashboard/roles/${role.id}`} className="btn-detail">Detail</Link><Link href={`/dashboard/roles/${role.id}/edit`} className="btn-edit">Edit</Link><button onClick={() => setDeleteRole(role)} className="btn-danger">Hapus</button></div></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {deleteRole && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40" onClick={() => setDeleteRole(null)} /><div className="relative card p-6 w-full max-w-sm"><h3 className="text-center font-semibold text-lg mb-2">Hapus Role?</h3><p className="text-center text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>Role <strong>{deleteRole.nama_role}</strong> akan dihapus permanen.</p><div className="flex gap-3"><button onClick={() => setDeleteRole(null)} className="btn-secondary flex-1 justify-center">Batal</button><button onClick={handleDelete} disabled={deleting} className="btn-primary flex-1 justify-center" style={{ background: "var(--color-danger)" }}>{deleting ? "Menghapus..." : "Ya, Hapus"}</button></div></div></div>}
    </div>
  );
}