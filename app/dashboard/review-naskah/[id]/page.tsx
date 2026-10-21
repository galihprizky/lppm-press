"use client";

import { ChangeEvent, FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { ApiListResponse, Naskah } from "@/app/dashboard/naskah/types";
import { API_URL } from "@/lib/config";
import { getActiveRole } from "@/lib/storage";

interface ReviewComment {
  id: number;
  author: string;
  text: string;
  createdAt: string;
}

const placeholderComments: ReviewComment[] = [];

function displayText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "-";

  const record = value as Record<string, unknown>;
  for (const key of ["nama", "name", "title", "label", "value"]) {
    if (typeof record[key] === "string" || typeof record[key] === "number") return String(record[key]);
  }
  return "-";
}

function displayUrl(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

function DetailRow({ label, value, className = "" }: { label: string; value?: unknown; className?: string }) {
  const text = displayText(value);
  return <div className={`py-3 border-b ${className}`} style={{ borderColor: "var(--color-border)" }}><span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</span><span className="block text-sm">{text}</span></div>;
}

function formatDate(value?: unknown) {
  if (!value) return "-";
  if (typeof value !== "string" && typeof value !== "number") return displayText(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

export default function ReviewNaskahRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [naskah, setNaskah] = useState<Naskah | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>(placeholderComments);
  const [comment, setComment] = useState("");
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isReviewer, setIsReviewer] = useState(false);

  useEffect(() => {
    const activeRole = getActiveRole()?.trim().toUpperCase();
    if (activeRole !== "REVIEWER") {
      window.location.replace("/dashboard/naskah");
      return;
    }
    setIsReviewer(true);

    const loadNaskah = async () => {
      try {
        const response = await fetch(`${API_URL}/naskah`);
        const payload: ApiListResponse<Naskah> = await response.json();
        if (!response.ok) throw new Error(payload.message || "Gagal memuat detail naskah.");
        setNaskah((payload.data ?? []).find((item) => String(item.id) === id) ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Tidak bisa memuat detail naskah.");
      } finally {
        setLoading(false);
      }
    };

    void loadNaskah();
  }, [id]);

  const handleCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setComments((current) => [...current, { id: Date.now(), author: "Saya", text: comment.trim(), createdAt: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date()) }]);
    setComment("");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => setReviewFile(event.target.files?.[0] ?? null);

  if (!isReviewer) return null;
  if (loading) return <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Memuat detail review...</div>;
  if (error || !naskah) return <div className="p-4 rounded-lg text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>{error || "Naskah tidak ditemukan."}</div>;

  return (
    <div className="review-naskah-page w-full min-w-0">
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/dashboard/naskah" style={{ color: "var(--color-primary)" }}>Pengajuan Naskah</Link><span>›</span><span>Review Naskah</span>
      </div>
      <section className="card p-4 sm:p-6 mb-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div className="min-w-0"><h1 className="text-xl font-bold break-words">{displayText(naskah.judul_naskah)}</h1><p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Review naskah oleh reviewer</p></div>
          <button type="button" className="btn-primary w-full sm:w-auto justify-center flex-shrink-0" onClick={() => alert("Aksi Update Status Naskah siap diintegrasikan ke API.")}>Update Status Naskah</button>
        </div>
        <details open>
          <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-primary)" }}>Detail naskah</summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <DetailRow label="Judul Naskah" value={naskah.judul_naskah} className="font-semibold md:col-span-3" />
            <DetailRow label="Sinopsis" value={naskah.sinopsis} className="md:col-span-3" />
          </div>
          <div className="naskah-meta mt-4" aria-label="Metadata naskah">
            <div className="naskah-meta-item naskah-meta-status"><span className="naskah-meta-label">Status</span><span className="naskah-meta-value">{displayText(naskah.status_saat_ini)}</span></div>
            <div className="naskah-meta-item"><span className="naskah-meta-label">Jenis buku</span><span className="naskah-meta-value">{displayText(naskah.jenis_buku)}</span></div>
            {(naskah.target_pembaca ?? []).map((target) => <div key={target} className="naskah-meta-item"><span className="naskah-meta-label">Target</span><span className="naskah-meta-value">{displayText(target)}</span></div>)}
            <div className="naskah-meta-item"><span className="naskah-meta-label">Warna isi</span><span className="naskah-meta-value">{displayText(naskah.warna_isi_buku)}</span></div>
            <div className="naskah-meta-item"><span className="naskah-meta-label">Status cover</span><span className="naskah-meta-value">{displayText(naskah.status_cover)}</span></div>
            <div className="naskah-meta-item"><span className="naskah-meta-label">Editor pribadi</span><span className="naskah-meta-value">{naskah.pake_editor_pribadi ? "Ya" : "Tidak"}</span></div>
            <div className="naskah-meta-item"><span className="naskah-meta-label">Dikirim</span><span className="naskah-meta-value">{formatDate(naskah.created_at)}</span></div>
          </div>
        </details>
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <DocumentSection title="Dokumen Sebelum Revisi" url={displayUrl(naskah.file_draft_naskah)} emptyText="Dokumen awal belum tersedia" />
        <DocumentSection title="Dokumen Setelah Revisi" url={displayUrl(naskah.file_draft_naskah_revisi)} emptyText="Belum ada dokumen revisi" />
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Komentar Review</h2>
        <p className="text-sm mt-1 mb-5" style={{ color: "var(--color-text-muted)" }}>{comments.length} komentar</p>
        <div className="space-y-3 mb-6">{comments.map((item) => <div key={item.id} className="p-4 rounded-lg" style={{ background: "var(--color-bg)" }}><div className="flex justify-between gap-3 mb-1"><span className="text-sm font-semibold">{item.author}</span><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.createdAt}</span></div><p className="text-sm leading-6">{item.text}</p></div>)}{comments.length === 0 && <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Belum ada komentar review.</p>}</div>
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="review-comment">Tambah komentar</label>
          <textarea id="review-comment" className="input-base min-h-28" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tuliskan catatan review..." />
          <label className="block text-sm font-medium" htmlFor="review-file">Upload file catatan review</label>
          <input id="review-file" type="file" className="input-base" onChange={handleFileChange} />
          {reviewFile && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>File dipilih: {reviewFile.name}</p>}
          <div className="flex justify-end"><button type="submit" className="btn-primary">Simpan Komentar</button></div>
        </form>
      </section>
    </div>
  );
}

function DocumentSection({ title, url, emptyText }: { title: string; url?: string | null; emptyText: string }) {
  const fileName = url?.split("/").pop() || "";
  return <section className="card p-4 sm:p-6 min-w-0 h-full"><h2 className="font-semibold mb-4">{title}</h2>{url ? <><p className="text-sm break-all mb-4" style={{ color: "var(--color-text-muted)" }}>{fileName}</p><a href={url} target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center">Buka / Preview Dokumen</a></> : <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{emptyText}</p>}</section>;
}