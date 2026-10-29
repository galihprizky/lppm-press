"use client";

import { ChangeEvent, FormEvent, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatStatusLabel, getStatusColors, Naskah } from "@/app/dashboard/naskah/types";
import { ApiResponse } from "@/app/dashboard/users/types";
import { API_URL } from "@/lib/config";
import { getNaskahDocument, toPublicDocumentUrl } from "@/lib/documents";
import { getActiveRole } from "@/lib/storage";

interface ReviewComment {
  id: number;
  author: string;
  text: string;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  recommendation?: string;
}

interface ReviewerAssignment {
  id: number;
  reviewer_id: number;
  deadline_review?: string;
  status_penugasan?: string;
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

function formatFileSize(value?: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value !== "number" || value <= 0) return undefined;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeReviewComments(value: unknown): ReviewComment[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const review = item as Record<string, unknown>;
    const reviewer = review.reviewer;
    const reviewerName: string = review.nama_reviewer ? displayText(review.nama_reviewer) : displayText(reviewer);
    const text = typeof review.catatan_review === "string" ? review.catatan_review : "";
    const fileValue = typeof review.file_catatan_review === "string" ? review.file_catatan_review : "";
    if (!text.trim()) return [];

    return [{
      id: typeof review.id === "number" ? review.id : index,
      author: reviewerName || "Reviewer",
      text,
      createdAt: formatDate(review.created_at),
      fileUrl: fileValue ? toPublicDocumentUrl(fileValue) : undefined,
      fileName: fileValue.split("/").pop() || undefined,
      fileSize: formatFileSize(review.file_size ?? review.ukuran_file),
      recommendation: typeof review.rekomendasi === "string" ? review.rekomendasi : undefined,
    }];
  });
}

export default function ReviewNaskahRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [naskah, setNaskah] = useState<Naskah | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>(placeholderComments);
  const [comment, setComment] = useState("");
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [recommendation, setRecommendation] = useState("REVISI_MINOR");
  const [assignment, setAssignment] = useState<ReviewerAssignment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isReviewer, setIsReviewer] = useState(false);
  const [acceptingAssignment, setAcceptingAssignment] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const reviewFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const activeRole = getActiveRole()?.trim().toUpperCase();
    if (activeRole !== "REVIEWER") {
      window.location.replace("/dashboard/naskah");
      return;
    }
    setIsReviewer(true);

    const loadNaskah = async () => {
      try {
        const response = await fetch(`${API_URL}/naskah/${id}`);
        const payload: ApiResponse<Naskah> = await response.json();
        if (!response.ok) throw new Error(payload.message || "Gagal memuat detail naskah.");
        setNaskah(payload.data ?? null);
        setComments(normalizeReviewComments(payload.data?.hasil_review));

        const assignmentResponse = await fetch(`${API_URL}/penugasan-reviewer/naskah/${id}`);
        const assignmentPayload: ApiResponse<ReviewerAssignment[]> = await assignmentResponse.json();
        const reviewerId = Number(localStorage.getItem("user_id"));
        const currentAssignment = (assignmentPayload.data ?? []).find((item) => item.reviewer_id === reviewerId) ?? null;
        setAssignment(currentAssignment);
        if (!currentAssignment) throw new Error("Naskah ini belum ditugaskan kepada akun reviewer Anda.");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Tidak bisa memuat detail naskah.");
      } finally {
        setLoading(false);
      }
    };

    void loadNaskah();
  }, [id]);

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitMessage("");
    if (!assignment) {
      setError("Penugasan reviewer tidak ditemukan.");
      return;
    }
    if (comments.length > 0) {
      setError("Hasil review untuk penugasan ini sudah dikirim.");
      return;
    }
    if (!comment.trim()) {
      setError("Catatan review wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("penugasan_id", String(assignment.id));
      formData.append("reviewer_id", String(assignment.reviewer_id));
      formData.append("rekomendasi", recommendation);
      formData.append("catatan_review", comment.trim());
      if (reviewFile) formData.append("file_catatan_review", reviewFile);

      const reviewResponse = await fetch(`${API_URL}/hasil-review`, { method: "POST", body: formData });
      const reviewPayload: ApiResponse<unknown> = await reviewResponse.json().catch(() => ({}));
      if (!reviewResponse.ok) throw new Error(reviewPayload.message || "Gagal menyimpan hasil review.");

      // API hasil review dapat mengubah status otomatis berdasarkan rekomendasi.
      // Kembalikan ke UNDER_REVIEW sampai reviewer menekan Update Status Naskah.
      const reviewStatusData = new FormData();
      reviewStatusData.append("status_saat_ini", "UNDER_REVIEW");
      const reviewStatusResponse = await fetch(`${API_URL}/naskah/${id}`, { method: "PUT", body: reviewStatusData });
      const reviewStatusPayload: ApiResponse<unknown> = await reviewStatusResponse.json().catch(() => ({}));
      if (!reviewStatusResponse.ok) throw new Error(reviewStatusPayload.message || "Komentar tersimpan, tetapi status naskah gagal dikembalikan ke Under Review.");

      const reviewData = reviewPayload.data && typeof reviewPayload.data === "object" ? reviewPayload.data as Record<string, unknown> : {};
      const submittedFile = typeof reviewData.file_catatan_review === "string" ? reviewData.file_catatan_review : "";
      const localFileUrl = reviewFile ? URL.createObjectURL(reviewFile) : undefined;
      setComments((current) => [...current, {
        id: typeof reviewData.id === "number" ? reviewData.id : Date.now(),
        author: "Saya",
        text: comment.trim(),
        createdAt: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
        fileUrl: submittedFile ? toPublicDocumentUrl(submittedFile) : localFileUrl,
        fileName: submittedFile.split("/").pop() || reviewFile?.name,
        fileSize: reviewFile ? formatFileSize(reviewFile.size) : formatFileSize(reviewData.file_size ?? reviewData.ukuran_file),
        recommendation,
      }]);
      setNaskah((current) => current ? { ...current, status_saat_ini: "UNDER_REVIEW" } : current);
      setComment("");
      setReviewFile(null);
      if (reviewFileInputRef.current) reviewFileInputRef.current.value = "";
      setSubmitMessage("Hasil review berhasil disimpan. Status naskah belum diperbarui.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Tidak bisa menyimpan hasil review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => setReviewFile(event.target.files?.[0] ?? null);

  const handleUpdateStatus = async () => {
    const latestRecommendation = comments[comments.length - 1]?.recommendation || recommendation;
    const status = latestRecommendation === "DITERIMA"
      ? "UNDER_REVIEW"
      : latestRecommendation === "DITOLAK"
        ? "REJECTED"
        : "REVISION_REQUIRED";

    setUpdatingStatus(true);
    setError("");
    try {
      const statusData = new FormData();
      statusData.append("status_saat_ini", status);
      const statusResponse = await fetch(`${API_URL}/naskah/${id}`, { method: "PUT", body: statusData });
      const statusPayload: ApiResponse<unknown> = await statusResponse.json().catch(() => ({}));
      if (!statusResponse.ok) throw new Error(statusPayload.message || "Gagal memperbarui status naskah.");

      setNaskah((current) => current ? { ...current, status_saat_ini: status } : current);
      setSubmitMessage("Status naskah berhasil diperbarui.");
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Gagal memperbarui status naskah.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("Hapus komentar review ini? Komentar dan file catatan yang dikirim akan dihapus.")) return;

    setDeletingReview(true);
    setError("");
    setSubmitMessage("");
    try {
      const response = await fetch(`${API_URL}/hasil-review/${reviewId}`, { method: "DELETE" });
      const payload: ApiResponse<unknown> = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Gagal menghapus komentar review.");

      setComments((current) => current.filter((item) => item.id !== reviewId));
      setSubmitMessage("Komentar review berhasil dihapus. Anda dapat mengirim komentar baru.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus komentar review.");
    } finally {
      setDeletingReview(false);
    }
  };

  const handleAcceptAssignment = async () => {
    if (!assignment) return;

    setAcceptingAssignment(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/penugasan-reviewer/${assignment.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer_id: assignment.reviewer_id, status_penugasan: "ACCEPTED" }),
      });
      const payload: ApiResponse<unknown> & { error?: string; errors?: Record<string, string[]> } = await response.json().catch(() => ({}));
      if (!response.ok) {
        const validationError = payload.errors ? Object.values(payload.errors).flat().join(" ") : "";
        throw new Error(payload.message || payload.error || validationError || `Gagal menerima penugasan reviewer (${response.status}).`);
      }
      setAssignment((current) => current ? { ...current, status_penugasan: "ACCEPTED" } : current);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Gagal menerima penugasan reviewer.");
    } finally {
      setAcceptingAssignment(false);
    }
  };

  if (!isReviewer) return null;
  if (loading) return <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Memuat detail review...</div>;
  if (error || !naskah || !assignment) return <div className="p-4 rounded-lg text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>{error || "Penugasan reviewer tidak ditemukan."}</div>;

  return (
    <div className="review-naskah-page w-full min-w-0">
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/dashboard/naskah" style={{ color: "var(--color-primary)" }}>Pengajuan Naskah</Link><span>›</span><span>Review Naskah</span>
      </div>
      <section className="card p-4 sm:p-6 mb-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div className="min-w-0"><h1 className="text-xl font-bold break-words">{displayText(naskah.judul_naskah)}</h1><p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Review naskah oleh reviewer</p></div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="badge" style={getStatusColors(naskah.status_saat_ini)}>{formatStatusLabel(naskah.status_saat_ini)}</span>
            {comments.length > 0 && <button type="button" className="btn-primary" onClick={handleUpdateStatus} disabled={updatingStatus}>{updatingStatus ? "Memperbarui..." : "Update Status Naskah"}</button>}
          </div>
        </div>
        <details open>
          <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-primary)" }}>Detail naskah</summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <DetailRow label="Judul Naskah" value={naskah.judul_naskah} className="font-semibold md:col-span-3" />
            <DetailRow label="Sinopsis" value={naskah.sinopsis} className="md:col-span-3" />
          </div>
          <div className="naskah-meta mt-4" aria-label="Metadata naskah">
            <div className="naskah-meta-item naskah-meta-status" style={getStatusColors(naskah.status_saat_ini)}><span className="naskah-meta-label">Status</span><span className="naskah-meta-value" style={{ color: getStatusColors(naskah.status_saat_ini)?.color }}>{formatStatusLabel(naskah.status_saat_ini)}</span></div>
            <div className="naskah-meta-item"><span className="naskah-meta-label">Jenis buku</span><span className="naskah-meta-value">{displayText(naskah.jenis_buku)}</span></div>
            <div className="naskah-meta-item"><span className="naskah-meta-label">Target</span><span className="naskah-meta-value naskah-meta-target">{(naskah.target_pembaca ?? []).map(displayText).join(", ") || "-"}</span></div>
            <div className="naskah-meta-item"><span className="naskah-meta-label">Warna isi</span><span className="naskah-meta-value">{displayText(naskah.warna_isi_buku)}</span></div>
            <div className="naskah-meta-item"><span className="naskah-meta-label">Status cover</span><span className="naskah-meta-value">{displayText(naskah.status_cover)}</span></div>
            <div className="naskah-meta-item"><span className="naskah-meta-label">Editor pribadi</span><span className="naskah-meta-value">{naskah.pake_editor_pribadi ? "Ya" : "Tidak"}</span></div>
            <div className="naskah-meta-item"><span className="naskah-meta-label">Dikirim</span><span className="naskah-meta-value">{formatDate(naskah.created_at)}</span></div>
          </div>
        </details>
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <DocumentSection title="Dokumen Sebelum Revisi" url={getNaskahDocument(naskah, "file_draft_naskah")} emptyText="Dokumen awal belum tersedia" />
        <DocumentSection title="Dokumen Setelah Revisi" url={getNaskahDocument(naskah, "file_draft_naskah_revisi")} emptyText="Belum ada dokumen revisi" />
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Komentar Review</h2>
        <p className="text-sm mt-1 mb-5" style={{ color: "var(--color-text-muted)" }}>{comments.length} komentar</p>
        {submitMessage && <p className="mb-8 rounded-lg border p-4 text-sm" style={{ background: "var(--color-success-pale)", color: "var(--color-success)", borderColor: "#b8d9c3" }}>{submitMessage}</p>}
        {assignment.status_penugasan !== "ACCEPTED" && comments.length === 0 && (
          <div className="mb-5 p-4 rounded-lg" style={{ background: "var(--color-warning-pale, #fff8e1)" }}>
            <p className="text-sm mb-3">Terima penugasan ini terlebih dahulu untuk mengisi review.</p>
            <button type="button" className="btn-primary" onClick={handleAcceptAssignment} disabled={acceptingAssignment}>
              {acceptingAssignment ? "Memproses..." : "Terima Penugasan"}
            </button>
          </div>
        )}
        <div className="space-y-3 mb-6">{comments.map((item) => <div key={item.id} className="rounded-lg border p-5" style={{ background: "#fbfcfc", borderColor: "var(--color-border)" }}><div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}><span className="text-base font-semibold">{item.author}</span><div className="flex items-center gap-3"><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.createdAt}</span><button type="button" className="btn-danger" onClick={() => handleDeleteReview(item.id)} disabled={deletingReview}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>{deletingReview ? "Menghapus..." : "Hapus"}</button></div></div><p className="text-base leading-6 pt-4">{item.text}</p>{item.fileUrl && <a href={item.fileUrl} download={item.fileName} target="_blank" rel="noreferrer" className="mt-5 flex w-full max-w-sm items-center gap-3 rounded-lg border p-3" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ background: "#eef5ff", color: "#2563eb" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></svg></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.fileName || "File catatan review"}</span><span className="block text-xs" style={{ color: "var(--color-text-muted)" }}>{item.fileSize || "Dokumen review"}</span></span><span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>Unduh</span></a>}</div>)}{comments.length === 0 && <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Belum ada komentar review.</p>}</div>
        {comments.length > 0 && <p className="mb-5 rounded-lg border p-4 text-sm" style={{ background: "#eff6ff", color: "#3656c8", borderColor: "#cfe0ff" }}>Hasil review sudah dikirim. Form komentar hanya dapat digunakan satu kali untuk penugasan ini.</p>}
        {comments.length === 0 && <form onSubmit={handleCommentSubmit} className="space-y-3" aria-disabled={assignment.status_penugasan !== "ACCEPTED"}>
          <label className="block text-sm font-medium" htmlFor="review-comment">Tambah komentar</label>
          <textarea id="review-comment" className="input-base min-h-28" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tuliskan catatan review..." disabled={assignment.status_penugasan !== "ACCEPTED" || comments.length > 0} />
          <label className="block text-sm font-medium" htmlFor="review-file">Upload file catatan review</label>
          <input ref={reviewFileInputRef} id="review-file" type="file" className="input-base" onChange={handleFileChange} disabled={assignment.status_penugasan !== "ACCEPTED" || comments.length > 0} />
          {reviewFile && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>File dipilih: {reviewFile.name}</p>}
          <label className="block text-sm font-medium" htmlFor="review-recommendation">Rekomendasi</label>
          <select id="review-recommendation" className="input-base" value={recommendation} onChange={(event) => setRecommendation(event.target.value)} disabled={assignment.status_penugasan !== "ACCEPTED" || comments.length > 0}>
            <option value="REVISI_MINOR">Revisi minor</option>
            <option value="REVISI_MAYOR">Revisi major</option>
            <option value="DITERIMA">Diterima</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
          {error && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>}
          <div className="flex justify-end"><button type="submit" className="btn-primary" disabled={submitting || assignment.status_penugasan !== "ACCEPTED" || comments.length > 0}>{submitting ? "Menyimpan..." : "Kirim Hasil Review"}</button></div>
        </form>}
      </section>
    </div>
  );
}

function DocumentSection({ title, url, emptyText }: { title: string; url?: string | null; emptyText: string }) {
  const fileName = url?.split("/").pop() || "";
  return <section className="card p-4 sm:p-6 min-w-0 h-full"><h2 className="font-semibold mb-4">{title}</h2>{url ? <><p className="text-sm break-all mb-4" style={{ color: "var(--color-text-muted)" }}>{fileName}</p><a href={url} target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center">Buka / Preview Dokumen</a></> : <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{emptyText}</p>}</section>;
}