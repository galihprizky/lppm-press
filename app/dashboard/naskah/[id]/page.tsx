"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiListResponse, Naskah } from "@/app/dashboard/naskah/types";
import { ApiResponse, User } from "@/app/dashboard/users/types";
import { API_URL } from "@/lib/config";

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

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setServerError("");
      try {
        const res = await fetch(`${API_URL}/naskah`);
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

  useEffect(() => {
    const storedRoles = localStorage.getItem("user_role_names");
    try {
      const roleNames: string[] = storedRoles ? JSON.parse(storedRoles) : [];
      setIsLppm(roleNames.includes("LPPM"));
    } catch {
      setIsLppm(false);
    }

    if (!storedRoles) return;

    fetch(`${API_URL}/users`)
      .then(async (response) => {
        const json: ApiResponse<User[]> = await response.json();
        if (!response.ok) throw new Error(json.message || "Gagal memuat reviewer.");
        setReviewers(
          (Array.isArray(json.data) ? json.data : []).filter((user) =>
            user.roles?.some((role) => ["REVIEWER"].includes(role.nama_role))
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

    const appointedBy = localStorage.getItem("user_id");
    if (!appointedBy) {
      setAssignmentError("User login tidak ditemukan.");
      return;
    }
    if (!reviewerId || !deadlineReview) {
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
            <Link href={`/dashboard/naskah/${naskah.id}/edit`} className="btn-edit">Edit</Link>
            <button onClick={handleDelete} className="btn-danger" disabled={deleting}>
              {deleting ? "Menghapus..." : "Hapus"}
            </button>
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
          <div className="flex flex-wrap gap-2 mb-6">
          <span className="badge">{naskah.status_saat_ini || "-"}</span>
          <span className="badge">{naskah.jenis_buku || "-"}</span>
          {(naskah.target_pembaca ?? []).map((target) => (
            <span key={target} className="badge">{target}</span>
          ))}
          <span className="badge">{naskah.warna_isi_buku || "-"}</span>
          <span className="badge">{naskah.status_cover || "-"}</span>
          <span className="badge">Editor pribadi: {naskah.pake_editor_pribadi ? "Ya" : "Tidak"}</span>
        </div>
        </details>
        
      </div>

      {reviewerAssignment && (
        <div className="card p-6 mb-5">
          <details>
            <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
              Detail Review
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-x-6">
              <InfoRow label="Reviewer" value={reviewerAssignment.nama_reviewer || `User #${reviewerAssignment.reviewer_id}`} />
              <InfoRow label="Email Reviewer" value={reviewerAssignment.email_reviewer} />
              <InfoRow label="Deadline Review" value={formatReviewDeadline(reviewerAssignment.deadline_review)} />
              <InfoRow label="Status Penugasan" value={reviewerAssignment.status_penugasan} />
              <InfoRow label="Ditunjuk Oleh" value={reviewerAssignment.nama_penunjuk || (reviewerAssignment.ditunjuk_oleh ? `User #${reviewerAssignment.ditunjuk_oleh}` : undefined)} />
            </div>
          </details>
        </div>
      )}

      <Link href="/dashboard/naskah" className="btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Kembali ke Daftar
      </Link>

      {assignmentSuccess && (
        <div className="fixed bottom-5 right-5 z-40 p-3 rounded-lg text-sm" style={{ background: "var(--color-success-pale)", color: "var(--color-success)" }}>
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
                <input
                  type="datetime-local"
                  className="input-base"
                  value={deadlineReview}
                  onChange={(event) => setDeadlineReview(event.target.value)}
                />
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
