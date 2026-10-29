"use client";

import { ChangeEvent, FormEvent, use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { canEditNaskah, canManageNaskah, canUploadRevision, formatStatusLabel, getStatusColors, Naskah } from "@/app/dashboard/naskah/types";
import { ApiResponse, User } from "@/app/dashboard/users/types";
import { API_URL } from "@/lib/config";
import { getNaskahDocument, toPublicDocumentUrl } from "@/lib/documents";
import { getActiveRole } from "@/lib/storage";

interface ReviewerAssignment {
  id: number;
  naskah_id: number;
  judul_naskah?: string;
  reviewer_id: number;
  nama_reviewer?: string;
  email_reviewer?: string;
  deadline_review: string;
  status_penugasan: string;
  ditunjuk_oleh?: number;
  nama_penunjuk?: string;
}

interface ReviewResult {
  id?: number;
  catatan_review?: string;
  rekomendasi?: string;
  file_catatan_review?: string | null;
  created_at?: string;
  reviewer?: { nama?: string; name?: string } | string;
  nama_reviewer?: string;
}

const MAX_REVISION_FILE_SIZE = 50 * 1024 * 1024;

const placeholderReview = {
  note: "Catatan review dari reviewer akan tampil di sini setelah proses review selesai.",
  fileName: "catatan-review-placeholder.pdf",
};

function reviewResultText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return String(record.nama ?? record.name ?? record.email ?? "");
}

function InfoRow({ label, value, className = "" }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={`py-3 border-b ${className}`} style={{ borderColor: "var(--color-border)" }}>
      <span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span className="block text-sm">
        {value || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
      </span>
    </div>
  );
}

function formatReviewDeadline(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatReviewDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function reviewRecommendationLabel(value?: string) {
  return value ? value.replaceAll("_", " ") : "Review";
}

function reviewRecommendationColors(value?: string) {
  return getStatusColors(value);
}

function splitDeadline(value: string) {
  const [date = "", time = ""] = value.replace(" ", "T").split("T");
  return { date, time: time.slice(0, 5) };
}

export default function DetailNaskahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [naskah, setNaskah] = useState<Naskah | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isLppm, setIsLppm] = useState(false);
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [reviewerId, setReviewerId] = useState("");
  const [deadlineReview, setDeadlineReview] = useState("");
  const [showReviewerModal, setShowReviewerModal] = useState(false);
  const [assigningReviewer, setAssigningReviewer] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");
  const [reviewerAssignment, setReviewerAssignment] = useState<ReviewerAssignment | null>(null);
  const [activeRole, setActiveRole] = useState("");
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionError, setRevisionError] = useState("");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [uploadingRevision, setUploadingRevision] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isAssignedReviewer, setIsAssignedReviewer] = useState(false);
  const [reviewResults, setReviewResults] = useState<ReviewResult[]>([]);
  const revisionFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setServerError("");
      try {
        const res = await fetch(`${API_URL}/naskah/${id}`);
        const json: ApiResponse<Naskah> = await res.json();
        const found = res.ok ? json.data : null;

        if (!found) {
          setServerError("Data naskah tidak ditemukan.");
        }

        setNaskah(found);
        setReviewResults(Array.isArray(found?.hasil_review) ? found.hasil_review as ReviewResult[] : []);
        const userId = localStorage.getItem("user_id");
        const currentRole = getActiveRole()?.trim().toUpperCase() || "";
        const isLppm = currentRole === "LPPM";
        setActiveRole(currentRole);
        const isOwner = String(found?.pengusul_id) === userId;
        setCanEdit(canManageNaskah(currentRole) && (isLppm || isOwner) && canEditNaskah(found?.status_saat_ini));
        setCanDelete(canManageNaskah(currentRole) && (isLppm || isOwner));
      } catch {
        setServerError("Tidak bisa memuat detail naskah.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  useEffect(() => {
    const storedRoles = localStorage.getItem("user_role_names");
    setIsLppm(getActiveRole()?.trim().toUpperCase() === "LPPM");

    if (!storedRoles) return;

    fetch(`${API_URL}/users`)
      .then(async (response) => {
        const json: ApiResponse<User[]> = await response.json();
        if (!response.ok) throw new Error(json.message || "Gagal memuat reviewer.");
        setReviewers(
          (Array.isArray(json.data) ? json.data : []).filter((user) =>
            user.roles?.some((role) => {
              const roleName = typeof role.nama_role === "string" ? role.nama_role : "";
              return roleName.trim().toUpperCase() === "REVIEWER";
            })
          )
        );
      })
      .catch(() => setAssignmentError("Tidak bisa memuat daftar reviewer."));
  }, []);

  useEffect(() => {
    const fetchReviewerAssignment = async () => {
      try {
        const response = await fetch(`${API_URL}/penugasan-reviewer/naskah/${id}`);
        const json: ApiResponse<ReviewerAssignment[]> = await response.json();
        const assignment = Array.isArray(json.data) ? json.data[0] ?? null : null;

        setReviewerAssignment(assignment);
        setIsAssignedReviewer(assignment?.reviewer_id === Number(localStorage.getItem("user_id")));
        if (assignment) {
          setReviewerId(String(assignment.reviewer_id));
          setDeadlineReview(assignment.deadline_review.slice(0, 16));
        }
      } catch {
        setReviewerAssignment(null);
      }
    };

    fetchReviewerAssignment();
  }, [id]);

  const openReviewerModal = () => {
    setAssignmentError("");
    if (reviewerAssignment) {
      setReviewerId(String(reviewerAssignment.reviewer_id));
      setDeadlineReview(reviewerAssignment.deadline_review.slice(0, 16));
    }
    setShowReviewerModal(true);
  };

  const handleAssignReviewer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAssignmentError("");
    setAssignmentSuccess("");

    if (!naskah) {
      setAssignmentError("Data naskah belum tersedia.");
      return;
    }
    if (!isLppm) {
      setAssignmentError("Hanya role LPPM yang dapat menugaskan reviewer.");
      return;
    }

    const appointedBy = localStorage.getItem("user_id");
    if (!appointedBy) {
      setAssignmentError("User login tidak ditemukan.");
      return;
    }
    const selectedDeadline = splitDeadline(deadlineReview);
    if (!reviewerId || !selectedDeadline.date || !selectedDeadline.time) {
      setAssignmentError("Reviewer dan deadline wajib diisi.");
      return;
    }

    setAssigningReviewer(true);
    try {
      const isEditing = reviewerAssignment !== null;
      const response = await fetch(
        isEditing
          ? `${API_URL}/penugasan-reviewer/${reviewerAssignment.id}`
          : `${API_URL}/penugasan-reviewer`,
        {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? {} : { naskah_id: naskah.id }),
          reviewer_id: Number(reviewerId),
          ditunjuk_oleh: Number(appointedBy),
          deadline_review: deadlineReview.replace("T", " ") + ":00",
          status_penugasan: "PENDING",
        }),
        }
      );
      const json: Partial<ApiResponse<unknown>> = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Gagal menugaskan reviewer.");

      setAssignmentSuccess("Reviewer berhasil ditugaskan.");
      setShowReviewerModal(false);
      setReviewerAssignment((current) => current ? {
        ...current,
        reviewer_id: Number(reviewerId),
        deadline_review: deadlineReview,
      } : current);
      setReviewerId("");
      setDeadlineReview("");
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Tidak bisa menugaskan reviewer.");
    } finally {
      setAssigningReviewer(false);
    }
  };

  const handleDelete = async () => {
    if (!naskah) return;
    const ok = confirm(`Hapus naskah \"${naskah.judul_naskah}\"? Tindakan ini tidak dapat dibatalkan.`);
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/naskah/${naskah.id}`, {
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

  const handleRevisionFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setRevisionError("");
    setRevisionMessage("");

    if (file && file.size > MAX_REVISION_FILE_SIZE) {
      setRevisionFile(null);
      event.target.value = "";
      setRevisionError("Ukuran file melebihi batas maksimal 50 MB.");
      return;
    }

    setRevisionFile(file);
  };

  const handleRevisionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRevisionError("");
    setRevisionMessage("");

    if (!canUploadRevision(naskah?.status_saat_ini)) {
      setRevisionError("Naskah yang ditolak tidak dapat mengirim file revisi.");
      return;
    }

    if (!revisionFile) {
      setRevisionError("Pilih satu file naskah hasil revisi terlebih dahulu.");
      return;
    }

    setUploadingRevision(true);
    try {
      const formData = new FormData();
      formData.append("file_draft_naskah_revisi", revisionFile);
      const response = await fetch(`${API_URL}/naskah/${naskah?.id ?? id}/revisi`, {
        method: "POST",
        body: formData,
      });
      const payload: ApiResponse<Naskah> = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Gagal mengirim file revisi.");

      setNaskah((current) => current ? {
        ...current,
        ...(payload.data ?? {}),
        file_draft_naskah_revisi: payload.data?.file_draft_naskah_revisi ?? current.file_draft_naskah_revisi,
        status_saat_ini: payload.data?.status_saat_ini ?? "REVISION_REQUIRED",
      } : current);
      setRevisionFile(null);
      if (revisionFileInputRef.current) revisionFileInputRef.current.value = "";
      setRevisionMessage("File revisi berhasil dikirim.");
    } catch (uploadError) {
      setRevisionError(uploadError instanceof Error ? uploadError.message : "Tidak bisa mengirim file revisi.");
    } finally {
      setUploadingRevision(false);
    }
  };

  const updateDeadline = (part: "date" | "time", value: string) => {
    const current = splitDeadline(deadlineReview);
    const nextDate = part === "date" ? value : current.date;
    const nextTime = part === "time" ? value : current.time;
    setDeadlineReview(`${nextDate}${nextTime ? `T${nextTime}` : ""}`);
  };

  const deadlineParts = splitDeadline(deadlineReview);

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
    <div className="max-w-5xl">
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
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {isLppm && (
              <button onClick={openReviewerModal} className="btn-primary">
                {reviewerAssignment ? "Edit Reviewer" : "Pilih Reviewer"}
              </button>
            )}
            {canEdit && <Link href={`/dashboard/naskah/${naskah.id}/edit`} className="btn-edit">Edit</Link>}
            {canDelete && <button onClick={handleDelete} className="btn-danger" disabled={deleting}>
              {deleting ? "Menghapus..." : "Hapus"}
            </button>}
          </div>
        </div>

        <details open>
          <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
            Detail lengkap
          </summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <InfoRow className="font-semibold md:col-span-3" label="Judul Naskah" value={naskah.judul_naskah} />
            <InfoRow label="Sinopsis" value={naskah.sinopsis} className="md:col-span-3" />
          </div>
          <div className="naskah-meta mb-6" aria-label="Metadata naskah">
          <div className="naskah-meta-item naskah-meta-status" style={getStatusColors(naskah.status_saat_ini)}>
            <span className="naskah-meta-label">Status</span>
            <span className="naskah-meta-value" style={{ color: getStatusColors(naskah.status_saat_ini)?.color }}>{formatStatusLabel(naskah.status_saat_ini)}</span>
          </div>
          <div className="naskah-meta-item">
            <span className="naskah-meta-label">Jenis buku</span>
            <span className="naskah-meta-value">{naskah.jenis_buku || "-"}</span>
          </div>
          <div className="naskah-meta-item">
            <span className="naskah-meta-label">Target</span>
            <span className="naskah-meta-value naskah-meta-target">{(naskah.target_pembaca ?? []).join(", ") || "-"}</span>
          </div>
          <div className="naskah-meta-item">
            <span className="naskah-meta-label">Warna isi</span>
            <span className="naskah-meta-value">{naskah.warna_isi_buku || "-"}</span>
          </div>
          <div className="naskah-meta-item">
            <span className="naskah-meta-label">Status cover</span>
            <span className="naskah-meta-value">{naskah.status_cover || "-"}</span>
          </div>
          <div className="naskah-meta-item">
            <span className="naskah-meta-label">Editor pribadi</span>
            <span className="naskah-meta-value">{naskah.pake_editor_pribadi ? "Ya" : "Tidak"}</span>
          </div>
        </div>
        </details>
        
      </div>

      <section className="card p-6 mb-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Dokumen Naskah</h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Dokumen yang sudah dikirim dan tersimpan di server.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NaskahDocument
            label="Draft Naskah"
            url={getNaskahDocument(naskah, "file_draft_naskah")}
          />
          <NaskahDocument
            label="Profil Penulis"
            url={getNaskahDocument(naskah, "file_profile_penulis")}
          />
          <NaskahDocument
            label="Surat Keaslian"
            url={getNaskahDocument(naskah, "file_surat_keaslian")}
          />
          <NaskahDocument
            label="Draft Revisi"
            url={getNaskahDocument(naskah, "file_draft_naskah_revisi")}
          />
        </div>
      </section>

      {reviewerAssignment && (
        <div className="card p-6 mb-5">
          <h2 className="text-lg font-semibold">Detail Review</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <InfoRow label="Reviewer" value={reviewerAssignment.nama_reviewer || `User #${reviewerAssignment.reviewer_id}`} />
            <InfoRow label="Email Reviewer" value={reviewerAssignment.email_reviewer} />
            <InfoRow label="Deadline Review" value={formatReviewDeadline(reviewerAssignment.deadline_review)} />
            <InfoRow label="Status Penugasan" value={reviewerAssignment.status_penugasan} />
            <InfoRow label="Ditunjuk Oleh" value={reviewerAssignment.nama_penunjuk || (reviewerAssignment.ditunjuk_oleh ? `User #${reviewerAssignment.ditunjuk_oleh}` : undefined)} />
          </div>
        </div>
      )}

      {(activeRole === "AUTHOR" || activeRole === "USER") && (
        <section className="card p-6 mb-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Detail Review</h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Catatan dan dokumen dari reviewer untuk naskah ini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoRow
              label="Nama Reviewer"
              value={reviewerAssignment?.nama_reviewer || (reviewerAssignment?.reviewer_id ? `User #${reviewerAssignment.reviewer_id}` : "Belum ada reviewer")}
            />
            <div className="py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
              <span className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>File Review</span>
              {reviewResults.some((review) => review.file_catatan_review) ? reviewResults.map((review, index) => review.file_catatan_review ? (
                <a
                  key={review.id ?? index}
                  href={toPublicDocumentUrl(review.file_catatan_review)}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  {review.file_catatan_review.split("/").pop() || "Buka file review"}
                </a>
              ) : null) : <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{placeholderReview.fileName}</span>}
            </div>
          </div>

          <div className="mt-5">
            <span className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>Catatan Review</span>
            {reviewResults.length > 0 ? reviewResults.map((review, index) => (
              <div key={review.id ?? index} className="rounded-lg border p-4 mb-3 last:mb-0" style={{ borderColor: "var(--color-border)", background: "#fbfcfc" }}>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {review.nama_reviewer || reviewResultText(review.reviewer) || "Reviewer"}
                    </span>
                    {review.rekomendasi && (
                      <span className="badge" style={reviewRecommendationColors(review.rekomendasi)}>
                        {reviewRecommendationLabel(review.rekomendasi)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{formatReviewDate(review.created_at)}</span>
                </div>
                <p className="text-sm leading-6 pt-3">{review.catatan_review || "-"}</p>
              </div>
            )) : (
              <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "#fbfcfc" }}>
                <p className="text-sm leading-6">{placeholderReview.note}</p>
              </div>
            )}
            {reviewResults.length > 0 && !reviewResults.some((review) => review.file_catatan_review) && (
              <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>{placeholderReview.fileName}</p>
            )}
          </div>

          {canUploadRevision(naskah.status_saat_ini) && (
            <form onSubmit={handleRevisionSubmit} className="mt-6 pt-6 border-t space-y-4" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <h3 className="font-semibold">Upload Revisi Naskah</h3>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  Pilih satu file naskah hasil revisi untuk dikirimkan kepada reviewer.
                </p>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  htmlFor="revision-file"
                >
                  File naskah revisi
                </label>
                  <input
                    ref={revisionFileInputRef}
                  id="revision-file"
                  type="file"
                  className={`input-base ${revisionError ? "error" : ""}`}
                  onChange={handleRevisionFileChange}
                />
                <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                  Maksimal ukuran file: 50 MB. Hanya satu file.
                </p>
                {revisionFile && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                    File dipilih: {revisionFile.name}
                  </p>
                )}
              </div>
              {revisionError && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{revisionError}</p>}
              {revisionMessage && <p className="text-sm" style={{ color: "var(--color-success)" }}>{revisionMessage}</p>}
              <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={uploadingRevision}>{uploadingRevision ? "Mengirim..." : "Kirim File Revisi"}</button>
              </div>
            </form>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/naskah" className="btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Kembali ke Daftar
        </Link>
        {activeRole === "REVIEWER" && isAssignedReviewer && (
          <Link href={`/dashboard/review-naskah/${naskah.id}`} className="btn-secondary">
            Lihat Review
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        )}
      </div>

      {assignmentSuccess && (
        <div className="fixed top-5 right-5 z-40 p-3 rounded-lg border text-sm shadow-sm" style={{ background: "var(--color-success-pale)", color: "var(--color-success)", borderColor: "#b8d9c3" }}>
          {assignmentSuccess}
        </div>
      )}

      {showReviewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReviewerModal(false)} />
          <div className="relative card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Penugasan Reviewer</h2>
              <button type="button" onClick={() => setShowReviewerModal(false)} className="text-xl" aria-label="Tutup">×</button>
            </div>
            <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>{naskah.judul_naskah}</p>
            {assignmentError && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>
                {assignmentError}
              </div>
            )}
            <form onSubmit={handleAssignReviewer} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Reviewer</label>
                <select className="input-base" value={reviewerId} onChange={(event) => setReviewerId(event.target.value)}>
                  <option value="">Pilih reviewer</option>
                  {reviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>{reviewer.nama} ({reviewer.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deadline Review</label>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_0.7fr] gap-3">
                  <label className="block">
                    <span className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Tanggal</span>
                    <input
                      type="date"
                      className="input-base"
                      value={deadlineParts.date}
                      onChange={(event) => updateDeadline("date", event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Jam</span>
                    <input
                      type="time"
                      className="input-base"
                      value={deadlineParts.time}
                      onChange={(event) => updateDeadline("time", event.target.value)}
                    />
                  </label>
                </div>
                <p className="deadline-summary mt-2" style={{ color: "var(--color-text-muted)" }}>
                  {deadlineReview ? `Deadline: ${formatReviewDeadline(deadlineReview)}` : "Pilih tanggal dan jam deadline review."}
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowReviewerModal(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={assigningReviewer}>
                  {assigningReviewer ? "Menyimpan..." : "Tugaskan Reviewer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NaskahDocument({ label, url }: { label: string; url: string | null }) {
  const fileName = url?.split("/").pop() || "";

  return (
    <div className="p-4 rounded-lg" style={{ background: "var(--color-bg)" }}>
      <p className="text-sm font-semibold">{label}</p>
      {url ? (
        <>
          <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-muted)" }} title={fileName}>
            {fileName}
          </p>
          <a href={url} target="_blank" rel="noreferrer" className="btn-secondary mt-3 w-full justify-center">
            Buka Dokumen
          </a>
        </>
      ) : (
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
          Dokumen belum tersedia.
        </p>
      )}
    </div>
  );
}
