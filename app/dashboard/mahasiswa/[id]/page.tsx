"use client";
// src/app/dashboard/mahasiswa/[id]/page.tsx
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

const JURUSAN_COLORS: Record<string, string> = {
  Informatika: "badge-informatika",
  "Sistem Informasi": "badge-si",
  "Teknik Elektro": "badge-te",
  Manajemen: "badge-manajemen",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b last:border-0"
      style={{ borderColor: "var(--color-border)" }}>
      <span className="text-sm font-medium w-40 flex-shrink-0 mb-1 sm:mb-0" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span className="text-sm">
        {value || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
      </span>
    </div>
  );
}

const formatDate = (d?: string): string | null => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

export default function DetailMahasiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getMahasiswaById, deleteMahasiswa } = useApp();
  const router = useRouter();
  const mhs = getMahasiswaById(id);

  if (!mhs) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold mb-2">Mahasiswa tidak ditemukan</p>
        <Link href="/dashboard/mahasiswa" className="btn-primary">Kembali ke Daftar</Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm(`Hapus data ${mhs.nama}? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteMahasiswa(mhs.id);
      router.push("/dashboard/mahasiswa");
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/dashboard/mahasiswa" style={{ color: "var(--color-primary)" }}>Data Mahasiswa</Link>
        <span>›</span>
        <span>{mhs.nama}</span>
      </div>

      <div className="card p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ background: "var(--color-primary)" }}>
            {mhs.nama.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{mhs.nama}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="font-mono text-sm px-2 py-0.5 rounded" style={{ background: "var(--color-bg)" }}>
                {mhs.nim}
              </span>
              <span className={`badge ${JURUSAN_COLORS[mhs.jurusan] ?? ""}`}>{mhs.jurusan}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/dashboard/mahasiswa/${mhs.id}/edit`} className="btn-edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </Link>
            <button onClick={handleDelete} className="btn-danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
              Hapus
            </button>
          </div>
        </div>

        <div>
          <InfoRow label="Email" value={mhs.email} />
          <InfoRow label="Jurusan" value={mhs.jurusan} />
          <InfoRow label="Tanggal Lahir" value={formatDate(mhs.tanggal_lahir) ?? undefined} />
          <InfoRow label="Dibuat pada" value={formatDate(mhs.created_at) ?? undefined} />
          <InfoRow label="Diperbarui pada" value={formatDate(mhs.updated_at) ?? undefined} />
        </div>
      </div>

      <Link href="/dashboard/mahasiswa" className="btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Kembali ke Daftar
      </Link>
    </div>
  );
}