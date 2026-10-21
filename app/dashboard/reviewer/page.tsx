"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchReviewerNaskahList } from "@/lib/reviewer";

interface ReviewDocument {
  label: string;
  fileName: string;
  version: string;
  available: boolean;
  url?: string;
}

interface ReviewComment {
  id: number;
  author: string;
  text: string;
  createdAt: string;
}

interface ReviewSubmission {
  id: number;
  title: string;
  synopsis: string;
  bookType: string;
  targets: string[];
  interiorColor: string;
  coverStatus: string;
  personalEditor: string;
  author: string;
  submittedAt: string;
  deadline: string;
  status: "Menunggu Review" | "Sedang Direview" | "Sudah Direview";
  before: ReviewDocument;
  after: ReviewDocument;
  comments: ReviewComment[];
}

const REVIEW_STORAGE_KEY = "reviewer_comments_draft";

function displayText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "-";

  const record = value as Record<string, unknown>;
  for (const key of ["nama", "name", "nama_role", "title", "label", "value"]) {
    if (typeof record[key] === "string" || typeof record[key] === "number") {
      return String(record[key]);
    }
  }
  return "-";
}

function formatDate(value?: unknown) {
  if (!value) return "-";
  const dateValue = typeof value === "string" || typeof value === "number" || value instanceof Date ? value : displayText(value);
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? displayText(value) : new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

function reviewStatus(status?: string): ReviewSubmission["status"] {
  if (status === "REVIEW") return "Sedang Direview";
  if (status === "APPROVED") return "Sudah Direview";
  return "Menunggu Review";
}

function documentFrom(value: unknown, label: string, version: string): ReviewDocument {
  if (typeof value === "string" && value) {
    return { label, fileName: value.split("/").pop() || value, version, available: true, url: value };
  }
  return { label, fileName: "Dokumen belum tersedia dari API", version, available: false };
}

function normalizeComments(value: unknown): ReviewComment[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const comment = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: typeof comment.id === "number" ? comment.id : Date.now() + index,
      author: displayText(comment.author),
      text: displayText(comment.text),
      createdAt: displayText(comment.createdAt),
    };
  });
}

export default function ReviewerPage({ reviewId }: { reviewId?: string } = {}) {
  const [reviews, setReviews] = useState<ReviewSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
    const loadAssignedReviews = async () => {
      const reviewerId = Number(localStorage.getItem("user_id"));
      if (!reviewerId) {
        setLoadError("ID Reviewer tidak ditemukan. Silakan login kembali.");
        setLoading(false);
        return;
      }

      try {
        const assigned = await fetchReviewerNaskahList(reviewerId);

        const nextReviews = assigned.map(({ naskah, assignment }) => ({
          id: naskah.id,
          title: displayText(naskah.judul_naskah),
          synopsis: displayText(naskah.sinopsis),
          bookType: displayText(naskah.jenis_buku),
          targets: Array.isArray(naskah.target_pembaca) ? naskah.target_pembaca.map(displayText) : [],
          interiorColor: displayText(naskah.warna_isi_buku),
          coverStatus: displayText(naskah.status_cover),
          personalEditor: naskah.pake_editor_pribadi ? "Ya" : "Tidak",
          author: displayText(naskah.nama_semua_penulis),
          submittedAt: formatDate(naskah.created_at),
          deadline: formatDate(assignment.deadline_review),
          status: reviewStatus(naskah.status_saat_ini),
          before: documentFrom(naskah.file_draft_naskah, "Dokumen sebelum revisi", "Versi 1"),
          after: documentFrom(naskah.file_draft_naskah_revisi, "Dokumen setelah revisi", "Versi revisi"),
          comments: [],
        }));
        setReviews(nextReviews);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Tidak bisa memuat naskah yang ditugaskan.");
      } finally {
        setLoading(false);
      }
    };

    void loadAssignedReviews();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!stored) return;
    try {
      const savedComments: Record<number, unknown> = JSON.parse(stored);
      setReviews((current) => current.map((review) => ({
        ...review,
        comments: savedComments[review.id] ? normalizeComments(savedComments[review.id]) : review.comments,
      })));
    } catch {
      localStorage.removeItem(REVIEW_STORAGE_KEY);
    }
  }, []);

  const selectedReview = reviews.find((review) => String(review.id) === reviewId) ?? reviews[0];

  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedReview) return;
    if (!comment.trim()) {
      setCommentError("Komentar wajib diisi.");
      return;
    }
    const nextComment: ReviewComment = {
      id: Date.now(),
      author: "Saya",
      text: comment.trim(),
      createdAt: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
    };
    const nextReviews = reviews.map((review) => review.id === selectedReview.id ? { ...review, comments: [...review.comments, nextComment] } : review);
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(Object.fromEntries(nextReviews.map((review) => [review.id, review.comments]))));
    setReviews(nextReviews);
    setComment("");
    setCommentError("");
  };

  if (loading) return <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Memuat naskah yang ditugaskan...</div>;
  if (loadError) return <div className="p-4 rounded-lg text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>{loadError}</div>;
  if (!selectedReview) return <div className="p-4 rounded-lg text-sm" style={{ background: "var(--color-bg)", color: "var(--color-text-muted)" }}>Belum ada naskah yang ditugaskan kepada Anda.</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Review Naskah</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Detail naskah dan deadline review untuk naskah yang ditugaskan kepada Anda.
        </p>
      </div>
      <main className="space-y-6">
        <section className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div className="min-w-0">
              <h2 className="text-xl font-bold">{selectedReview.title}</h2>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Penulis: {selectedReview.author}</p>
            </div>
            <span className="badge">{selectedReview.status}</span>
          </div>
          <details open>
            <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-primary)" }}>Detail lengkap</summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-x-6">
              <InfoRow label="Judul Naskah" value={selectedReview.title} className="font-semibold md:col-span-3" />
              <InfoRow label="Sinopsis" value={selectedReview.synopsis} className="md:col-span-3" />
            </div>
            <div className="naskah-meta mb-6" aria-label="Metadata naskah">
              <ReviewMeta label="Status" value={selectedReview.status} status />
              <ReviewMeta label="Jenis buku" value={selectedReview.bookType} />
              {(selectedReview.targets.length ? selectedReview.targets : ["-"]).map((target, index) => <ReviewMeta key={`${target}-${index}`} label="Target" value={target} />)}
              <ReviewMeta label="Warna isi" value={selectedReview.interiorColor} />
              <ReviewMeta label="Status cover" value={selectedReview.coverStatus} />
              <ReviewMeta label="Editor pribadi" value={selectedReview.personalEditor} />
            </div>
          </details>
          <div className="grid sm:grid-cols-3 gap-4 text-sm border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
            <div><span style={{ color: "var(--color-text-muted)" }}>Dikirim</span><div className="font-medium mt-1">{selectedReview.submittedAt}</div></div>
            <div><span style={{ color: "var(--color-text-muted)" }}>Deadline review</span><div className="font-medium mt-1">{selectedReview.deadline}</div></div>
            <div><span style={{ color: "var(--color-text-muted)" }}>Status review</span><div className="font-medium mt-1">{selectedReview.status}</div></div>
          </div>
        </section>
        <section className="grid lg:grid-cols-2 gap-6"><DocumentCard document={selectedReview.before} tone="before" /><DocumentCard document={selectedReview.after} tone="after" /></section>
        <section className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold">Komentar Review</h2>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{selectedReview.comments.length} komentar</p>
            </div>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Sementara di localStorage</span>
          </div>
          <div className="space-y-4 mb-6">
            {selectedReview.comments.map((item) => (
              <div key={item.id} className="p-4 rounded-lg" style={{ background: "var(--color-bg)" }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-sm font-semibold">{item.author}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.createdAt}</span>
                </div>
                <p className="text-sm leading-6">{item.text}</p>
              </div>
            ))}
            {!selectedReview.comments.length && <p className="text-sm py-3" style={{ color: "var(--color-text-muted)" }}>Belum ada komentar untuk naskah ini.</p>}
          </div>
          <form onSubmit={submitComment} className="space-y-3">
            <label className="block text-sm font-medium">Tambah komentar</label>
            <textarea
              className={`input-base min-h-28 ${commentError ? "error" : ""}`}
              value={comment}
              onChange={(event) => { setComment(event.target.value); setCommentError(""); }}
              placeholder="Tuliskan catatan revisi untuk penulis..."
            />
            {commentError && <p className="text-xs" style={{ color: "var(--color-danger)" }}>{commentError}</p>}
            <div className="flex justify-end"><button type="submit" className="btn-primary">Simpan Komentar</button></div>
          </form>
        </section>
      </main>
    </div>
  );
}

function InfoRow({ label, value, className = "" }: { label: string; value?: string; className?: string }) {
  return <div className={`py-3 border-b ${className}`} style={{ borderColor: "var(--color-border)" }}><span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</span><span className="block text-sm">{value || "-"}</span></div>;
}

function ReviewMeta({ label, value, status = false }: { label: string; value: string; status?: boolean }) {
  return <div className={`naskah-meta-item ${status ? "naskah-meta-status" : ""}`}><span className="naskah-meta-label">{label}</span><span className="naskah-meta-value">{value || "-"}</span></div>;
}

function DocumentCard({ document, tone }: { document: ReviewDocument; tone: "before" | "after" }) {
  return <section className="card p-6"><div className="flex items-start justify-between gap-3 mb-5"><div><div className="text-xs uppercase tracking-wider font-semibold" style={{ color: tone === "before" ? "var(--color-text-muted)" : "var(--color-primary)" }}>{document.label}</div><h2 className="font-semibold mt-1">{document.version}</h2></div></div><div className="p-4 rounded-lg mb-4" style={{ background: "var(--color-bg)" }}><div className="text-sm font-medium truncate">{document.fileName}</div><div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{document.available ? "Dokumen tersedia" : "URL dokumen belum dikirim API"}</div></div>{document.url ? <a href={document.url} target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center">Buka Dokumen</a> : <button type="button" className="btn-secondary w-full justify-center" disabled>Dokumen Belum Tersedia</button>}</section>;
}
