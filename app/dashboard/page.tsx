"use client";
// src/app/dashboard/page.tsx
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Mahasiswa } from "@/data/dummy";

const JURUSAN_COLORS: Record<string, string> = {
  Informatika: "badge-informatika",
  "Sistem Informasi": "badge-si",
  "Teknik Elektro": "badge-te",
  Manajemen: "badge-manajemen",
};

interface StatCard {
  label: string;
  value: number;
  color: string;
  bg: string;
}

export default function DashboardPage() {
  const { currentUser, mahasiswa } = useApp();

  const jurusanCount = mahasiswa.reduce<Record<string, number>>((acc, m) => {
    acc[m.jurusan] = (acc[m.jurusan] ?? 0) + 1;
    return acc;
  }, {});

  const recentMhs: Mahasiswa[] = [...mahasiswa]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const stats: StatCard[] = [
    { label: "Total Mahasiswa", value: mahasiswa.length, color: "var(--color-primary)", bg: "var(--color-primary-pale)" },
    { label: "Informatika", value: jurusanCount["Informatika"] ?? 0, color: "#1565c0", bg: "#e8f4fd" },
    { label: "Sistem Informasi", value: jurusanCount["Sistem Informasi"] ?? 0, color: "#b7770d", bg: "#fef9e7" },
    { label: "Teknik Elektro", value: jurusanCount["Teknik Elektro"] ?? 0, color: "#8e44ad", bg: "#fdf2f8" },
    { label: "Manajemen", value: jurusanCount["Manajemen"] ?? 0, color: "#1e8449", bg: "#eafaf1" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          Selamat datang, 👋
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Ini ringkasan data mahasiswa hari ini.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4 text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            Aksi Cepat
          </h2>
          <div className="space-y-3">
            <Link href="/dashboard/mahasiswa/tambah" className="btn-primary w-full justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah Mahasiswa
            </Link>
            <Link href="/dashboard/mahasiswa" className="btn-secondary w-full justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              Lihat Semua Mahasiswa
            </Link>
            <Link href="/dashboard/profil" className="btn-secondary w-full justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Kelola Profil
            </Link>
          </div>
        </div>

        {/* Recent mahasiswa */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Mahasiswa Terbaru
            </h2>
            <Link href="/dashboard/mahasiswa" className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>
              Lihat semua →
            </Link>
          </div>
          <div className="space-y-3">
            {recentMhs.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: "var(--color-primary-light)" }}>
                    {m.nama.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{m.nama}</div>
                    <div className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>{m.nim}</div>
                  </div>
                </div>
                <span className={`badge ${JURUSAN_COLORS[m.jurusan] ?? ""}`}>{m.jurusan}</span>
              </div>
            ))}
            {recentMhs.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                Belum ada data mahasiswa.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}