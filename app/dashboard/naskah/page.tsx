"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiListResponse, Naskah } from "@/app/dashboard/naskah/types";

const PAGE_SIZE = 5;

export default function NaskahPage() {
  const [items, setItems] = useState<Naskah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [serverError, setServerError] = useState("");
  const [deleteModal, setDeleteModal] = useState<Naskah | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchNaskah = async (pengusulId: string) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`http://localhost:3001/naskah/pengusul/${pengusulId}`);
      const json: ApiListResponse<Naskah> = await res.json();
      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setServerError("Tidak bisa memuat data naskah.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("user_id");

    if (!userId) {
      setServerError("User belum login atau user_id tidak ditemukan.");
      setLoading(false);
      return;
    }

    fetchNaskah(userId);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((n) => {
      const target = Array.isArray(n.target_pembaca) ? n.target_pembaca.join(" ") : "";
      return (
        n.judul_naskah?.toLowerCase().includes(q) ||
        n.nama_semua_penulis?.toLowerCase().includes(q) ||
        n.jenis_buku?.toLowerCase().includes(q) ||
        n.status_saat_ini?.toLowerCase().includes(q) ||
        target.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      const res = await fetch(`http://localhost:3001/naskah/${deleteModal.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setServerError("Gagal menghapus naskah.");
        return;
      }

      setItems((prev) => prev.filter((x) => x.id !== deleteModal.id));
      setSuccessMsg(`Naskah \"${deleteModal.judul_naskah}\" berhasil dihapus.`);
      setDeleteModal(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setServerError("Tidak bisa terhubung ke server.");
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pengajuan Naskah</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {items.length} naskah terdaftar
          </p>
        </div>
        <Link href="/dashboard/naskah/tambah" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajukan Naskah
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm animate-fade-in" style={{ background: "var(--color-success-pale)", color: "var(--color-success)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMsg}
        </div>
      )}

      {serverError && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {serverError}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="relative max-w-sm">
            <input
              type="text"
              className="input-base pl-9"
              placeholder="Cari judul, penulis, jenis, status..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Judul</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--color-text-muted)" }}>Penulis</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--color-text-muted)" }}>Jenis</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Status</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
                    Memuat data...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
                    Belum ada data naskah.
                  </td>
                </tr>
              ) : (
                paginated.map((n, i) => (
                  <tr
                    key={n.id}
                    style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--color-border)" : "none" }}
                    className="hover:bg-[var(--color-bg)] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-medium">{n.judul_naskah}</div>
                      <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                        Target: {(n.target_pembaca ?? []).join(", ") || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">{n.nama_semua_penulis || "-"}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">{n.jenis_buku || "-"}</td>
                    <td className="px-4 py-3.5">
                      <span className="badge">{n.status_saat_ini || "-"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/naskah/${n.id}`} className="btn-detail">Detail</Link>
                        <Link href={`/dashboard/naskah/${n.id}/edit`} className="btn-edit">Edit</Link>
                        <button onClick={() => setDeleteModal(n)} className="btn-danger">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Halaman {page} dari {totalPages} • {filtered.length} data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm border transition-colors disabled:opacity-40"
                style={{ borderColor: "var(--color-border)" }}
              >
                ‹
              </button>

              {pageNumbers.map((item, idx) =>
                item === "..." ? (
                  <span key={`e-${idx}`} className="w-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                    …
                  </span>
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
                  >
                    {item}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm border transition-colors disabled:opacity-40"
                style={{ borderColor: "var(--color-border)" }}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteModal(null)} />
          <div className="relative card p-6 w-full max-w-sm animate-fade-in">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-danger-pale)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <h3 className="text-center font-semibold text-lg mb-2">Hapus Naskah?</h3>
            <p className="text-center text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              Naskah <strong>{deleteModal.judul_naskah}</strong> akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={handleDelete} className="flex-1 justify-center btn-primary" style={{ background: "var(--color-danger)" }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
