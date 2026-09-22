"use client";
// src/app/dashboard/page.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiListResponse, Naskah } from "@/app/dashboard/naskah/types";
import { API_URL } from "@/lib/config";

interface StatCard {
  label: string;
  value: number;
  color: string;
  bg: string;
}

export default function DashboardPage() {
  const [naskah, setNaskah] = useState<Naskah[]>([]);

  useEffect(() => {
    const fetchNaskah = async () => {
      try {
        const response = await fetch(`${API_URL}/naskah`);
        const json: ApiListResponse<Naskah> = await response.json();
        setNaskah(Array.isArray(json.data) ? json.data : []);
      } catch {
        setNaskah([]);
      }
    };

    fetchNaskah();
  }, []);

  const recentNaskah = [...naskah]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  const statusCount = (status: string) =>
    naskah.filter((item) => item.status_saat_ini === status).length;

  const stats: StatCard[] = [
    { label: "Total Naskah", value: naskah.length, color: "var(--color-primary)", bg: "var(--color-primary-pale)" },
    { label: "Submitted", value: statusCount("SUBMITTED"), color: "#1565c0", bg: "#e8f4fd" },
    { label: "Under Review", value: statusCount("UNDER_REVIEW"), color: "#b7770d", bg: "#fef9e7" },
    { label: "Revision Required", value: statusCount("REVISION_REQUIRED"), color: "#8e44ad", bg: "#fdf2f8" },
    { label: "Published", value: statusCount("PUBLISHED"), color: "#1e8449", bg: "#eafaf1" },
    { label: "Rejected", value: statusCount("REJECTED"), color: "var(--color-danger)", bg: "var(--color-danger-pale)" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          Selamat datang, 👋
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Ini ringkasan pengajuan naskah hari ini.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
            <Link href="/dashboard/naskah/tambah" className="btn-primary w-full justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah Naskah
            </Link>
            <Link href="/dashboard/naskah" className="btn-secondary w-full justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
              Lihat Semua Naskah
            </Link>
            <Link href="/dashboard/profil" className="btn-secondary w-full justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Kelola Profil
            </Link>
          </div>
        </div>

        {/* Recent naskah */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Naskah Terbaru
            </h2>
            <Link href="/dashboard/naskah" className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>
              Lihat semua →
            </Link>
          </div>
          <div className="space-y-3">
            {recentNaskah.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0"
                style={{ borderColor: "var(--color-border)" }}>
                <div className="text-sm font-medium truncate">{item.judul_naskah}</div>
                <span className="badge flex-shrink-0">{item.status_saat_ini || "-"}</span>
              </div>
            ))}
            {recentNaskah.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                Belum ada data naskah.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}