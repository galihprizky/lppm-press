"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiListResponse, Naskah } from "@/app/dashboard/naskah/types";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
      <span className="text-sm font-medium w-44 flex-shrink-0 mb-1 sm:mb-0" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span className="text-sm">
        {value || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
      </span>
    </div>
  );
}

export default function DetailNaskahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [naskah, setNaskah] = useState<Naskah | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setServerError("");
      try {
        const res = await fetch("http://localhost:3001/naskah");
        const json: ApiListResponse<Naskah> = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        const found = list.find((x) => String(x.id) === id) ?? null;

        if (!found) {
          setServerError("Data naskah tidak ditemukan.");
        }

        setNaskah(found);
      } catch {
        setServerError("Tidak bisa memuat detail naskah.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!naskah) return;
    const ok = confirm(`Hapus naskah \"${naskah.judul_naskah}\"? Tindakan ini tidak dapat dibatalkan.`);
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:3001/naskah/${naskah.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setServerError("Gagal menghapus naskah.");
        return;
      }

      router.push("/dashboard/naskah");
    } catch {
      setServerError("Tidak bisa terhubung ke server.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Memuat detail naskah...</div>;
  }

  if (!naskah) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold mb-2">Naskah tidak ditemukan</p>
        <Link href="/dashboard/naskah" className="btn-primary">Kembali ke Daftar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/dashboard/naskah" style={{ color: "var(--color-primary)" }}>Pengajuan Naskah</Link>
        <span>›</span>
        <span>{naskah.judul_naskah}</span>
      </div>

      {serverError && (
        <div className="mb-5 p-3 rounded-lg flex items-center gap-2 text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {serverError}
        </div>
      )}

      <div className="card p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-xl font-bold">{naskah.judul_naskah}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              {naskah.jenis_buku || "-"} • Status: {naskah.status_saat_ini || "-"}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/dashboard/naskah/${naskah.id}/edit`} className="btn-edit">Edit</Link>
            <button onClick={handleDelete} className="btn-danger" disabled={deleting}>
              {deleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>

        <div>
          <InfoRow label="Judul Naskah" value={naskah.judul_naskah} />
          <InfoRow label="Sinopsis" value={naskah.sinopsis} />
          <InfoRow label="Jenis Buku" value={naskah.jenis_buku} />
          <InfoRow label="Target Pembaca" value={(naskah.target_pembaca ?? []).join(", ")} />
          <InfoRow label="Nama Semua Penulis" value={naskah.nama_semua_penulis} />
          <InfoRow label="Warna Isi Buku" value={naskah.warna_isi_buku} />
          <InfoRow label="Pakai Editor Pribadi" value={naskah.pake_editor_pribadi ? "Ya" : "Tidak"} />
          <InfoRow label="Status Cover" value={naskah.status_cover} />
          <InfoRow label="Status Saat Ini" value={naskah.status_saat_ini} />
        </div>
      </div>

      <Link href="/dashboard/naskah" className="btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Kembali ke Daftar
      </Link>
    </div>
  );
}
