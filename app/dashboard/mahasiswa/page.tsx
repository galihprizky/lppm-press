"use client";
// src/app/dashboard/mahasiswa/page.tsx
import { useState, useMemo, useCallback, ChangeEvent } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Mahasiswa } from "@/data/dummy";

const JURUSAN_COLORS: Record<string, string> = {
  Informatika: "badge-informatika",
  "Sistem Informasi": "badge-si",
  "Teknik Elektro": "badge-te",
  Manajemen: "badge-manajemen",
};

const PAGE_SIZE = 5;

export default function MahasiswaPage() {
  const { mahasiswa, deleteMahasiswa } = useApp();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<Mahasiswa | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return mahasiswa;
    return mahasiswa.filter(
      (m) =>
        m.nim.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.nama.toLowerCase().includes(q) ||
        m.jurusan.toLowerCase().includes(q)
    );
  }, [mahasiswa, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleDelete = () => {
    if (!deleteModal) return;
    deleteMahasiswa(deleteModal.id);
    setDeleteModal(null);
    setSuccessMsg(`Data ${deleteModal.nama} berhasil dihapus.`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => {
      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Data Mahasiswa</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {mahasiswa.length} mahasiswa terdaftar
          </p>
        </div>
        <Link href="/dashboard/mahasiswa/tambah" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Mahasiswa
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm animate-fade-in"
          style={{ background: "var(--color-success-pale)", color: "var(--color-success)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMsg}
        </div>
      )}

      <div className="card overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="relative max-w-sm">
            <input
              type="text"
              className="input-base pl-9"
              placeholder="Cari NIM, nama, email, atau jurusan..."
              value={search}
              onChange={handleSearch}
            />
          </div>
          {search && (
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              Ditemukan <strong>{filtered.length}</strong> hasil untuk &quot;{search}&quot;
            </p>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
                {["NIM", "Nama", "Email", "Jurusan", "Aksi"].map((h) => (
                  <th
                    key={h}
                    className={`text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider
                      ${h === "Email" ? "hidden md:table-cell" : ""}
                      ${h === "Jurusan" ? "hidden sm:table-cell" : ""}
                      ${h === "Aksi" ? "text-right" : ""}`}
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>
                    <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    {search ? `Tidak ada hasil untuk "${search}"` : "Belum ada data mahasiswa"}
                  </td>
                </tr>
              ) : (
                paginated.map((m, i) => (
                  <tr
                    key={m.id}
                    style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--color-border)" : "none" }}
                    className="hover:bg-[var(--color-bg)] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-medium px-2 py-1 rounded"
                        style={{ background: "var(--color-bg)" }}>
                        {m.nim}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{m.nama}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs" style={{ color: "var(--color-text-muted)" }}>{m.email}</td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`badge ${JURUSAN_COLORS[m.jurusan] ?? ""}`}>{m.jurusan}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/mahasiswa/${m.id}`} className="btn-detail">Detail</Link>
                        <Link href={`/dashboard/mahasiswa/${m.id}/edit`} className="btn-edit">Edit</Link>
                        <button onClick={() => setDeleteModal(m)} className="btn-danger">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Halaman {page} dari {totalPages} &bull; {filtered.length} data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm border transition-colors disabled:opacity-40"
                style={{ borderColor: "var(--color-border)" }}
              >‹</button>

              {pageNumbers.map((item, idx) =>
                item === "..." ? (
                  <span key={`e-${idx}`} className="w-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-sm border transition-colors"
                    style={{
                      background: page === item ? "var(--color-primary)" : "transparent",
                      color: page === item ? "#fff" : "var(--color-text)",
                      borderColor: page === item ? "var(--color-primary)" : "var(--color-border)",
                    }}
                  >{item}</button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm border transition-colors disabled:opacity-40"
                style={{ borderColor: "var(--color-border)" }}
              >›</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteModal(null)} />
          <div className="relative card p-6 w-full max-w-sm animate-fade-in">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--color-danger-pale)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <h3 className="text-center font-semibold text-lg mb-2">Hapus Mahasiswa?</h3>
            <p className="text-center text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              Data <strong>{deleteModal.nama}</strong> akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button
                onClick={handleDelete}
                className="flex-1 justify-center btn-primary"
                style={{ background: "var(--color-danger)" }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}