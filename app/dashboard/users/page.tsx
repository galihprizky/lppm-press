"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiResponse, User, Fakultas, Jurusan } from "./types";

import { API_URL as BASE_API_URL } from "@/lib/config";
const API_URL = `${BASE_API_URL}/users`;
type SortOrder = "asc" | "desc";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [fakultasOptions, setFakultasOptions] = useState<Fakultas[]>([]);
  const [jurusanOptions, setJurusanOptions] = useState<Jurusan[]>([]);
  const [search, setSearch] = useState("");
  const [fakultasFilter, setFakultasFilter] = useState("");
  const [jurusanFilter, setJurusanFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(API_URL).then(async (response) => {
        const json: ApiResponse<User[]> = await response.json();
        if (!response.ok) throw new Error(json.message || "Gagal memuat data users.");
        return json;
      }),
      fetch(`${BASE_API_URL}/fakultas`).then((response) => response.json()),
      fetch(`${BASE_API_URL}/jurusan`).then((response) => response.json()),
    ])
      .then(([usersResponse, fakultasResponse, jurusanResponse]) => {
        setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
        setFakultasOptions(Array.isArray(fakultasResponse.data) ? fakultasResponse.data : []);
        setJurusanOptions(Array.isArray(jurusanResponse.data) ? jurusanResponse.data : []);
      })
      .catch((error) => setServerError(error instanceof Error ? error.message : "Tidak bisa memuat data users."))
      .finally(() => setLoading(false));
  }, []);

  const filteredJurusanOptions = useMemo(
    () => fakultasFilter
      ? jurusanOptions.filter((item) => String(item.fakultas_id) === fakultasFilter)
      : jurusanOptions,
    [fakultasFilter, jurusanOptions]
  );

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();
    return [...users]
      .filter((user) => !query || [user.nama, user.nip, user.email, user.no_hp, user.jurusan?.nama_jurusan ?? "", user.roles.map((role) => role.nama_role).join(" ")].some((value) => value.toLowerCase().includes(query)))
      .filter((user) => !fakultasFilter || String(user.jurusan?.fakultas_id) === fakultasFilter)
      .filter((user) => !jurusanFilter || String(user.jurusan_id) === jurusanFilter)
      .sort((a, b) => {
        const comparison = (a.nama || "").localeCompare(b.nama || "", "id", { sensitivity: "base" });
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [search, users, fakultasFilter, jurusanFilter, sortOrder]);

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/${deleteUser.id}`, { method: "DELETE" });
      const json: Partial<ApiResponse<unknown>> = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Gagal menghapus user.");
      setUsers((current) => current.filter((user) => user.id !== deleteUser.id));
      setSuccessMsg(`User ${deleteUser.nama} berhasil dihapus.`);
      setDeleteUser(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Tidak bisa menghapus user.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-bold">Users</h1><p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{users.length} user terdaftar</p></div>
        <Link href="/dashboard/users/tambah" className="btn-primary">Tambah User</Link>
      </div>
      {successMsg && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--color-success-pale)", color: "var(--color-success)" }}>{successMsg}</div>}
      {serverError && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>{serverError}</div>}
      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
            <input className="input-base w-[85%]" placeholder="Cari nama, NIP, email, jurusan..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="input-base w-[85%] text-xs py-2 pr-15" value={fakultasFilter} onChange={(event) => { setFakultasFilter(event.target.value); setJurusanFilter(""); }}>
              <option value="">Semua Fakultas</option>
              {fakultasOptions.map((item) => <option key={item.id} value={item.id}>{item.nama_fakultas}</option>)}
            </select>
            <select className="input-base w-[85%] text-xs py-2 pr-15" value={jurusanFilter} onChange={(event) => setJurusanFilter(event.target.value)}>
              <option value="">Semua Prodi/Jurusan</option>
              {filteredJurusanOptions.map((item) => <option key={item.id} value={item.id}>{item.nama_jurusan}</option>)}
            </select>
            <button type="button" onClick={() => setSortOrder((value) => value === "asc" ? "desc" : "asc")} className="btn-secondary w-[85%] text-xs py-2 justify-center">
              Nama: {sortOrder === "asc" ? "A-Z (Ascending)" : "Z-A (Descending)"}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}><th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>User</th><th className="text-left px-4 py-3 text-xs uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--color-text-muted)" }}>Kontak</th><th className="text-left px-4 py-3 text-xs uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--color-text-muted)" }}>Jurusan</th><th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Role</th><th className="text-right px-4 py-3 text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Aksi</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={5} className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>Memuat data...</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan={5} className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>Belum ada data user.</td></tr> : filteredUsers.map((user, index) => <tr key={user.id} style={{ borderBottom: index < filteredUsers.length - 1 ? "1px solid var(--color-border)" : "none" }}><td className="px-4 py-3.5"><div className="font-medium">{user.nama}</div><div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{user.nip} · {user.is_active ? "Aktif" : "Nonaktif"}</div></td><td className="px-4 py-3.5 hidden md:table-cell"><div>{user.email}</div><div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{user.no_hp || "-"}</div></td><td className="px-4 py-3.5 hidden lg:table-cell">{user.jurusan?.nama_jurusan || "-"}</td><td className="px-4 py-3.5">{user.roles.length ? user.roles.map((role) => <span className="badge mr-1" key={role.id}>{role.nama_role}</span>) : <span style={{ color: "var(--color-text-muted)" }}>-</span>}</td><td className="px-4 py-3.5"><div className="flex items-center justify-end gap-2"><Link href={`/dashboard/users/${user.id}`} className="btn-detail">Detail</Link><Link href={`/dashboard/users/${user.id}/edit`} className="btn-edit">Edit</Link><button onClick={() => setDeleteUser(user)} className="btn-danger">Hapus</button></div></td></tr>)}
        </tbody></table></div>
      </div>
      {deleteUser && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40" onClick={() => setDeleteUser(null)} /><div className="relative card p-6 w-full max-w-sm"><h3 className="text-center font-semibold text-lg mb-2">Hapus User?</h3><p className="text-center text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>User <strong>{deleteUser.nama}</strong> akan dihapus permanen.</p><div className="flex gap-3"><button onClick={() => setDeleteUser(null)} className="btn-secondary flex-1 justify-center">Batal</button><button onClick={handleDelete} disabled={deleting} className="btn-primary flex-1 justify-center" style={{ background: "var(--color-danger)" }}>{deleting ? "Menghapus..." : "Ya, Hapus"}</button></div></div></div>}
    </div>
  );
}