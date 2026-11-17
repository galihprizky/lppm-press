"use client";

import { ChangeEvent, FormEvent, use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { canEditNaskah, canManageNaskah, formatStatusLabel, getStatusColors, Naskah, NaskahVersion } from "@/app/dashboard/naskah/types";
import { ApiResponse, User } from "@/app/dashboard/users/types";
import { API_URL } from "@/lib/config";
import { getNaskahDocument, toPublicDocumentUrl } from "@/lib/documents";
import { getActiveRole, getSessionValue } from "@/lib/storage";

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

interface EditorAssignment {
  id: number;
  naskah_id: number;
  editor_id: number;
  nama_editor?: string;
  email_editor?: string;
  catatan_instruksi?: string | null;
  status_editing: "PENDING" | "IN_PROGRESS" | "COMPLETED" | string;
  ditunjuk_oleh?: number;
  nama_penunjuk?: string;
}

interface ReviewResult {
  id?: number;
  catatan_review?: string;
  rekomendasi?: string;
  file_catatan_review?: string | null;
  created_at?: string | number;
  createdAt?: string | number;
  tanggal_review?: string | number;
  tanggalReview?: string | number;
  review_date?: string | number;
  reviewer?: { nama?: string; name?: string; nama_lengkap?: string; full_name?: string } | string;
  nama_reviewer?: string;
  namaReviewer?: string;
  reviewer_name?: string;
  rekomendasi_review?: string;
  recommendation?: string;
  status_review?: string;
  status_rekomendasi?: string;
  status_revisi?: string;
  catatanReview?: string;
  komentar?: string;
}

const MAX_REVISION_FILE_SIZE = 50 * 1024 * 1024;
const LPPM_PRESS_TEMPLATE_URL = process.env.NEXT_PUBLIC_LPPM_PRESS_TEMPLATE_URL || "/template-naskah-lppm-press.docx";

const placeholderReview = {
  note: "Catatan review dari reviewer akan tampil di sini setelah proses review selesai.",
  fileName: "catatan-review-placeholder.pdf",
};

function reviewResultText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return String(record.nama ?? record.name ?? record.nama_lengkap ?? record.full_name ?? record.email ?? "");
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
  if (Number.isNaN(date.getTime())) return `${value}`;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatReviewDate(value?: unknown): string {
  if (!value) return "—";
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nestedDate = record.$date ?? record.date ?? record.datetime ?? record.timestamp ?? record.value;
    return nestedDate !== undefined && nestedDate !== value ? formatReviewDate(nestedDate) : "—";
  }
  if (typeof value !== "string" && typeof value !== "number") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function reviewRecommendationLabel(value?: string) {
  return value ? value.replaceAll("_", " ") : "Review";
}

function reviewRecommendationColors(value?: string) {
  return getStatusColors(value);
}

function reviewerNameFromResults(results: ReviewResult[], assignment?: ReviewerAssignment | null): string {
  const latestReview = results[results.length - 1];
  return latestReview?.nama_reviewer || latestReview?.namaReviewer || latestReview?.reviewer_name || reviewResultText(latestReview?.reviewer) || assignment?.nama_reviewer || (assignment?.reviewer_id ? `User #${assignment.reviewer_id}` : "Belum ada reviewer");
}

function reviewResultDate(review: ReviewResult): string | number | undefined {
  return review.created_at ?? review.createdAt ?? review.tanggal_review ?? review.tanggalReview ?? review.review_date;
}

function reviewResultRecommendation(review: ReviewResult): string | undefined {
  return review.rekomendasi ?? review.rekomendasi_review ?? review.recommendation ?? review.status_review ?? review.status_rekomendasi ?? review.status_revisi;
}

function getRevisionVersions(naskah: Naskah): NaskahVersion[] {
  return [...(naskah.versi_naskah ?? [])]
    .filter((version) => version.tahap?.trim().toUpperCase() === "REVISI_DOSEN")
    .sort((left, right) => (right.versi_ke ?? 0) - (left.versi_ke ?? 0));
}

function getEditorialVersions(naskah: Naskah): NaskahVersion[] {
  return [...(naskah.versi_naskah ?? [])]
    .filter((version) => {
      const stage = version.tahap?.trim().toUpperCase() || "";
      return stage === "DRAFT_LAYOUT_EDITOR" || stage === "HASIL_EDITOR" || stage === "EDITORIAL";
    })
    .sort((left, right) => (right.versi_ke ?? 0) - (left.versi_ke ?? 0));
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
  const [editors, setEditors] = useState<User[]>([]);
  const [reviewerId, setReviewerId] = useState("");
  const [deadlineReview, setDeadlineReview] = useState("");
  const [showReviewerModal, setShowReviewerModal] = useState(false);
  const [assigningReviewer, setAssigningReviewer] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");
  const [reviewerAssignment, setReviewerAssignment] = useState<ReviewerAssignment | null>(null);
  const [editorAssignment, setEditorAssignment] = useState<EditorAssignment | null>(null);
  const [editorId, setEditorId] = useState("");
  const [editorInstruction, setEditorInstruction] = useState("");
  const [editingStatus, setEditingStatus] = useState<EditorAssignment["status_editing"]>("PENDING");
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [assigningEditor, setAssigningEditor] = useState(false);
  const [activeRole, setActiveRole] = useState("");
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionProfileFile, setRevisionProfileFile] = useState<File | null>(null);
  const [revisionAuthenticityFile, setRevisionAuthenticityFile] = useState<File | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionError, setRevisionError] = useState("");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [uploadingRevision, setUploadingRevision] = useState(false);
  const [editorialFile, setEditorialFile] = useState<File | null>(null);
  const [editorialNote, setEditorialNote] = useState("");
  const [editorialError, setEditorialError] = useState("");
  const [editorialMessage, setEditorialMessage] = useState("");
  const [uploadingEditorial, setUploadingEditorial] = useState(false);
  const [approvingEditorial, setApprovingEditorial] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isAssignedReviewer, setIsAssignedReviewer] = useState(false);
  const [reviewResults, setReviewResults] = useState<ReviewResult[]>([]);
  const revisionFileInputRef = useRef<HTMLInputElement>(null);
  const revisionProfileFileInputRef = useRef<HTMLInputElement>(null);
  const revisionAuthenticityFileInputRef = useRef<HTMLInputElement>(null);
  const editorialFileInputRef = useRef<HTMLInputElement>(null);

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
        const userId = getSessionValue("user_id");
        const currentRole = getActiveRole()?.trim().toUpperCase() || "";
        const isLppm = currentRole === "LPPM";
        setActiveRole(currentRole);
        const isOwner = String(found?.pengusul_id) === userId;
        setCanEdit(canManageNaskah(currentRole) && (isLppm || isOwner) && canEditNaskah(found?.status_saat_ini) && !(currentRole === "AUTHOR" && found?.status_saat_ini?.trim().toUpperCase() === "REVISION_REQUIRED"));
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
    const storedRoles = getSessionValue("user_role_names");
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
        setEditors(
          (Array.isArray(json.data) ? json.data : []).filter((user) =>
            user.roles?.some((role) => role.nama_role.trim().toUpperCase() === "EDITOR")
          )
        );
      })
      .catch(() => setAssignmentError("Tidak bisa memuat daftar reviewer dan editor."));
  }, []);

  useEffect(() => {
    const fetchReviewerAssignment = async () => {
      const currentRole = getActiveRole()?.trim().toUpperCase();
      if (currentRole !== "LPPM" && currentRole !== "REVIEWER") return;

      try {
        const response = await fetch(`${API_URL}/penugasan-reviewer/naskah/${id}`);
        const json: ApiResponse<ReviewerAssignment[]> = await response.json();
        const assignment = Array.isArray(json.data) ? json.data[0] ?? null : null;

        setReviewerAssignment(assignment);
        setIsAssignedReviewer(assignment?.reviewer_id === Number(getSessionValue("user_id")));
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

  useEffect(() => {
    const fetchEditorAssignment = async () => {
      try {
        const response = await fetch(`${API_URL}/penugasan-editor/naskah/${id}`);
        const json: ApiResponse<EditorAssignment[] | EditorAssignment> = await response.json();
        const assignment = Array.isArray(json.data) ? json.data[0] ?? null : json.data ?? null;

        setEditorAssignment(assignment);
        if (assignment) {
          setEditorId(String(assignment.editor_id));
          setEditorInstruction(assignment.catatan_instruksi ?? "");
          setEditingStatus(assignment.status_editing);
        }
      } catch {
        setEditorAssignment(null);
      }
    };

    fetchEditorAssignment();
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

    const appointedBy = getSessionValue("user_id");
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

  const openEditorModal = () => {
    setAssignmentError("");
    if (editorAssignment) {
      setEditorId(String(editorAssignment.editor_id));
      setEditorInstruction(editorAssignment.catatan_instruksi ?? "");
      setEditingStatus(editorAssignment.status_editing);
    } else {
      setEditorId("");
      setEditorInstruction("");
      setEditingStatus("PENDING");
    }
    setShowEditorModal(true);
  };

  const handleAssignEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAssignmentError("");
    setAssignmentSuccess("");

    if (!naskah || naskah.status_saat_ini?.trim().toUpperCase() !== "APPROVED_FOR_EDIT" || naskah.pake_editor_pribadi) {
      setAssignmentError("Editor hanya dapat ditunjuk untuk naskah berstatus APPROVED_FOR_EDIT tanpa editor pribadi.");
      return;
    }
    if (!isLppm) {
      setAssignmentError("Hanya role LPPM yang dapat menugaskan editor.");
      return;
    }

    const appointedBy = getSessionValue("user_id");
    if (!appointedBy) {
      setAssignmentError("User login tidak ditemukan. Silakan login kembali.");
      return;
    }
    if (!editorId) {
      setAssignmentError("Editor wajib dipilih.");
      return;
    }

    setAssigningEditor(true);
    try {
      const isEditing = editorAssignment !== null;
      const response = await fetch(
        isEditing ? `${API_URL}/penugasan-editor/${editorAssignment.id}` : `${API_URL}/penugasan-editor`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isEditing ? {
            editor_id: Number(editorId),
            catatan_instruksi: editorInstruction.trim(),
            status_editing: editingStatus,
          } : {
            naskah_id: naskah.id,
            editor_id: Number(editorId),
            ditunjuk_oleh: Number(appointedBy),
            catatan_instruksi: editorInstruction.trim(),
          }),
        }
      );
      const json: Partial<ApiResponse<unknown>> = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Gagal menyimpan penugasan editor.");

      const [detailResponse, assignmentResponse] = await Promise.all([
        fetch(`${API_URL}/naskah/${id}`),
        fetch(`${API_URL}/penugasan-editor/naskah/${id}`),
      ]);
      const detailJson: ApiResponse<Naskah> = await detailResponse.json().catch(() => ({}));
      const assignmentJson: ApiResponse<EditorAssignment[] | EditorAssignment> = await assignmentResponse.json().catch(() => ({}));
      if (!detailResponse.ok || !detailJson.data) throw new Error("Penugasan berhasil, tetapi detail naskah gagal dimuat ulang.");

      const refreshedAssignment = Array.isArray(assignmentJson.data) ? assignmentJson.data[0] ?? null : assignmentJson.data ?? null;
      setNaskah(detailJson.data);
      setReviewResults(Array.isArray(detailJson.data.hasil_review) ? detailJson.data.hasil_review as ReviewResult[] : []);
      setEditorAssignment(refreshedAssignment);
      setEditorId(refreshedAssignment ? String(refreshedAssignment.editor_id) : "");
      setEditorInstruction(refreshedAssignment?.catatan_instruksi ?? "");
      setEditingStatus(refreshedAssignment?.status_editing ?? "PENDING");
      setShowEditorModal(false);
      setAssignmentSuccess(isEditing ? "Penugasan editor berhasil diperbarui." : "Editor berhasil ditunjuk.");
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Tidak bisa menyimpan penugasan editor.");
    } finally {
      setAssigningEditor(false);
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

  const handleOptionalRevisionFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
  ) => {
    const file = event.target.files?.[0] ?? null;
    setRevisionError("");

    if (file && file.size > MAX_REVISION_FILE_SIZE) {
      setFile(null);
      event.target.value = "";
      setRevisionError("Ukuran setiap file tidak boleh melebihi 50 MB.");
      return;
    }

    setFile(file);
  };

  const handleRevisionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRevisionError("");
    setRevisionMessage("");

    if (naskah?.status_saat_ini?.trim().toUpperCase() !== "REVISION_REQUIRED") {
      setRevisionError("Pengiriman revisi hanya tersedia saat status naskah REVISION_REQUIRED.");
      return;
    }

    const uploadedBy = getSessionValue("user_id");
    if (!uploadedBy) {
      setRevisionError("Sesi user tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (!revisionNote.trim()) {
      setRevisionError("Catatan perubahan wajib diisi.");
      return;
    }

    if (!revisionFile) {
      setRevisionError("File draft naskah revisi wajib dipilih.");
      return;
    }

    setUploadingRevision(true);
    try {
      const formData = new FormData();
      formData.append("uploaded_by", uploadedBy);
      formData.append("catatan_perubahan", revisionNote.trim());
      formData.append("file_draft_naskah", revisionFile);
      if (revisionProfileFile) formData.append("file_profile_penulis", revisionProfileFile);
      if (revisionAuthenticityFile) formData.append("file_surat_keaslian", revisionAuthenticityFile);
      const response = await fetch(`${API_URL}/naskah/${naskah?.id ?? id}/revisi`, {
        method: "POST",
        body: formData,
      });
      const payload: ApiResponse<Naskah> & { error?: string; errors?: Record<string, string[]> } = await response.json().catch(() => ({}));
      if (!response.ok) {
        const validationError = payload.errors ? Object.values(payload.errors).flat().join(" ") : "";
        throw new Error(payload.message || payload.error || validationError || "Gagal mengirim revisi naskah.");
      }

      const refreshedResponse = await fetch(`${API_URL}/naskah/${naskah?.id ?? id}`);
      const refreshedPayload: ApiResponse<Naskah> = await refreshedResponse.json().catch(() => ({}));
      if (!refreshedResponse.ok || !refreshedPayload.data) {
        throw new Error("Revisi berhasil dikirim, tetapi detail naskah gagal dimuat ulang.");
      }
      setNaskah(refreshedPayload.data);
      setReviewResults(Array.isArray(refreshedPayload.data.hasil_review) ? refreshedPayload.data.hasil_review as ReviewResult[] : []);
      setRevisionNote("");
      setRevisionFile(null);
      setRevisionProfileFile(null);
      setRevisionAuthenticityFile(null);
      if (revisionFileInputRef.current) revisionFileInputRef.current.value = "";
      if (revisionProfileFileInputRef.current) revisionProfileFileInputRef.current.value = "";
      if (revisionAuthenticityFileInputRef.current) revisionAuthenticityFileInputRef.current.value = "";
      setRevisionMessage("Revisi naskah berhasil dikirim.");
    } catch (uploadError) {
      setRevisionError(uploadError instanceof Error ? uploadError.message : "Tidak bisa mengirim file revisi.");
    } finally {
      setUploadingRevision(false);
    }
  };

  const handleEditorialFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setEditorialError("");
    setEditorialMessage("");

    if (file && file.size > MAX_REVISION_FILE_SIZE) {
      setEditorialFile(null);
      event.target.value = "";
      setEditorialError("Ukuran file melebihi batas maksimal 50 MB.");
      return;
    }

    setEditorialFile(file);
  };

  const handleEditorialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditorialError("");
    setEditorialMessage("");

    const currentRole = getActiveRole()?.trim().toUpperCase() || activeRole;
    const isPersonalAuthorUpload = currentRole === "AUTHOR" && Boolean(naskah?.pake_editor_pribadi);
    const canSubmitAsAssignedEditor = currentRole === "EDITOR" && isAssignedEditor;

    if (currentRole === "EDITOR" && !canSubmitAsAssignedEditor) {
      setEditorialError("Hanya editor yang ditunjuk untuk naskah ini yang dapat mengirim hasil editor.");
      return;
    }
    if (currentRole !== "EDITOR" && currentRole !== "AUTHOR") {
      setEditorialError("Hanya role EDITOR atau AUTHOR yang dapat mengunggah dokumen editorial.");
      return;
    }
    if (currentRole === "AUTHOR" && !isPersonalAuthorUpload && editorialVersions.length === 0) {
      setEditorialError("Author hanya dapat mengunggah hasil editor jika menggunakan editor pribadi atau sudah menerima hasil layout editor.");
      return;
    }

    const uploadedBy = getSessionValue("user_id");
    if (!uploadedBy) {
      setEditorialError("Sesi user tidak ditemukan. Silakan login kembali.");
      return;
    }
    if (!editorialNote.trim()) {
      setEditorialError("Catatan perubahan wajib diisi.");
      return;
    }
    if (!editorialFile) {
      setEditorialError("File draft naskah wajib dipilih.");
      return;
    }

    setUploadingEditorial(true);
    try {
      const formData = new FormData();
      formData.append("uploaded_by", uploadedBy);
      formData.append("catatan_perubahan", editorialNote.trim());
      formData.append("file_draft_naskah", editorialFile);
      if (currentRole === "AUTHOR") {
        formData.append("versi_ke", String(nextEditorialVersion));
      }

      const response = await fetch(`${API_URL}/naskah/${naskah?.id ?? id}/hasil-editor`, {
        method: "POST",
        body: formData,
      });
      const payload: ApiResponse<Naskah> & { error?: string; errors?: Record<string, string[]> } = await response.json().catch(() => ({}));
      if (!response.ok) {
        const validationError = payload.errors ? Object.values(payload.errors).flat().join(" ") : "";
        throw new Error(payload.message || payload.error || validationError || "Gagal mengunggah dokumen editorial.");
      }

      const refreshedResponse = await fetch(`${API_URL}/naskah/${naskah?.id ?? id}`);
      const refreshedPayload: ApiResponse<Naskah> = await refreshedResponse.json().catch(() => ({}));
      if (!refreshedResponse.ok || !refreshedPayload.data) {
        throw new Error("Dokumen editorial berhasil dikirim, tetapi detail naskah gagal dimuat ulang.");
      }

      setNaskah(refreshedPayload.data);
      setReviewResults(Array.isArray(refreshedPayload.data.hasil_review) ? refreshedPayload.data.hasil_review as ReviewResult[] : []);
      setEditorialFile(null);
      setEditorialNote("");
      if (editorialFileInputRef.current) editorialFileInputRef.current.value = "";
      setEditorialMessage(currentRole === "AUTHOR"
        ? isPersonalAuthorUpload
          ? `Naskah editor pribadi versi ${nextEditorialVersion} berhasil diunggah.`
          : `Versi ${nextEditorialVersion} naskah editorial berhasil diunggah.`
        : "Dokumen editorial berhasil diunggah.");
    } catch (uploadError) {
      setEditorialError(uploadError instanceof Error ? uploadError.message : "Tidak bisa mengunggah dokumen editorial.");
    } finally {
      setUploadingEditorial(false);
    }
  };

  const handleApproveEditorial = async () => {
    if (activeRole !== "AUTHOR") {
      setEditorialError("Hanya role AUTHOR yang dapat menyetujui hasil layout editorial.");
      return;
    }

    setEditorialError("");
    setEditorialMessage("");
    setApprovingEditorial(true);
    try {
      const statusData = new FormData();
      statusData.append("status_saat_ini", "READY_TO_PRINT");
      const response = await fetch(`${API_URL}/naskah/${naskah?.id ?? id}`, {
        method: "PUT",
        body: statusData,
      });
      const payload: ApiResponse<unknown> = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Gagal menyetujui naskah editorial.");

      const refreshedResponse = await fetch(`${API_URL}/naskah/${naskah?.id ?? id}`);
      const refreshedPayload: ApiResponse<Naskah> = await refreshedResponse.json().catch(() => ({}));
      if (!refreshedResponse.ok || !refreshedPayload.data) {
        throw new Error("Status berhasil diperbarui, tetapi detail naskah gagal dimuat ulang.");
      }

      setNaskah(refreshedPayload.data);
      setReviewResults(Array.isArray(refreshedPayload.data.hasil_review) ? refreshedPayload.data.hasil_review as ReviewResult[] : []);
      setEditorialMessage("Naskah editorial berhasil disetujui dan siap dicetak.");
    } catch (approveError) {
      setEditorialError(approveError instanceof Error ? approveError.message : "Tidak bisa menyetujui naskah editorial.");
    } finally {
      setApprovingEditorial(false);
    }
  };

  const updateDeadline = (part: "date" | "time", value: string) => {
    const current = splitDeadline(deadlineReview);
    const nextDate = part === "date" ? value : current.date;
    const nextTime = part === "time" ? value : current.time;
    setDeadlineReview(`${nextDate}${nextTime ? `T${nextTime}` : ""}`);
  };

  const deadlineParts = splitDeadline(deadlineReview);
  const editorialVersions = naskah ? getEditorialVersions(naskah) : [];
  const latestEditorialVersion = editorialVersions[0];
  const hasEditorialVersion = editorialVersions.length > 0;
  const nextEditorialVersion = editorialVersions.length > 0
    ? Math.max(...editorialVersions.map((version) => Number(version.versi_ke ?? 0))) + 1
    : 1;
  const sessionUserId = getSessionValue("user_id");
  const isAssignedEditor = activeRole === "EDITOR"
    && Boolean(editorAssignment)
    && editorAssignment?.editor_id === Number(sessionUserId);
  const canAccessEditorial = ["APPROVED_FOR_EDIT", "READY_TO_PRINT"].includes(naskah?.status_saat_ini?.trim().toUpperCase() || "");
  const isPersonalEditorFlow = activeRole === "AUTHOR"
    && canAccessEditorial
    && Boolean(naskah ? naskah.pake_editor_pribadi : false);
  const canShowEditorialCard = isAssignedEditor
    || hasEditorialVersion
    || isPersonalEditorFlow
    || (canAccessEditorial && (activeRole === "EDITOR" || isLppm));

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
            {isLppm && naskah.status_saat_ini?.trim().toUpperCase() === "APPROVED_FOR_EDIT" && !naskah.pake_editor_pribadi && (
              <button
                onClick={openEditorModal}
                className={naskah.pake_editor_pribadi ? "btn-secondary opacity-60 cursor-not-allowed" : "btn-primary"}
                disabled={naskah.pake_editor_pribadi}
                title={naskah.pake_editor_pribadi ? "Author sudah menggunakan editor pribadi." : undefined}
                aria-label={naskah.pake_editor_pribadi ? "Editor tidak dapat ditunjuk karena author menggunakan editor pribadi" : undefined}
              >
                {naskah.pake_editor_pribadi ? "Editor Pribadi Author" : editorAssignment ? "Edit Editor" : "Tunjuk Editor"}
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

      {editorAssignment && (
        <div className="card p-6 mb-5">
          <h2 className="text-lg font-semibold">Detail Editor</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <InfoRow label="Editor" value={editorAssignment.nama_editor || `User #${editorAssignment.editor_id}`} />
            <InfoRow label="Email Editor" value={editorAssignment.email_editor} />
            <InfoRow label="Status Editing" value={editorAssignment.status_editing} />
            <InfoRow label="Catatan Instruksi" value={editorAssignment.catatan_instruksi} />
            <InfoRow label="Ditunjuk Oleh" value={editorAssignment.nama_penunjuk || (editorAssignment.ditunjuk_oleh ? `User #${editorAssignment.ditunjuk_oleh}` : undefined)} />
          </div>
        </div>
      )}

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
        </div>
      </section>

      <div className="space-y-5 mb-5">
          <section className="card p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Detail Review</h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Catatan dan dokumen dari reviewer untuk naskah ini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoRow
              label="Nama Reviewer"
              value={reviewerNameFromResults(reviewResults, reviewerAssignment)}
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
                      {review.nama_reviewer || review.namaReviewer || review.reviewer_name || reviewResultText(review.reviewer) || "Reviewer"}
                    </span>
                    {reviewResultRecommendation(review) && (
                      <span className="badge" style={reviewRecommendationColors(reviewResultRecommendation(review))}>
                        {reviewRecommendationLabel(reviewResultRecommendation(review))}
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{formatReviewDate(reviewResultDate(review))}</span>
                </div>
                <p className="text-sm leading-6 pt-3">{review.catatan_review || review.catatanReview || review.komentar || "-"}</p>
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

          </section>

          <RevisionHistory versions={getRevisionVersions(naskah)} />

          {canShowEditorialCard && (
          <section className="card p-6">
            <div className="mb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{isPersonalEditorFlow ? "Unggah Naskah Editor Pribadi" : "Dokumen Naskah Revisi Editorial"}</h2>
                {naskah.status_saat_ini?.trim().toUpperCase() === "READY_TO_PRINT" && (
                  <span className="badge" style={getStatusColors("READY_TO_PRINT")}>READY_TO_PRINT</span>
                )}
              </div>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                {isPersonalEditorFlow
                  ? "Unduh template LPPM Press, isi naskah secara mandiri, lalu unggah hasilnya di sini."
                  : activeRole === "EDITOR" ? "Unggah hasil penyuntingan editorial untuk naskah ini." : "Hasil layout editorial dan catatan perubahan dari editor."}
              </p>
            </div>

            {isPersonalEditorFlow && (
              <a href={LPPM_PRESS_TEMPLATE_URL} download target="_blank" rel="noreferrer" className="btn-secondary mb-5">
                Unduh Template LPPM Press
              </a>
            )}

            {!isPersonalEditorFlow && latestEditorialVersion && (
              <div className="rounded-lg border p-4 mb-5" style={{ borderColor: "var(--color-border)", background: "#fbfcfc" }}>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <span className="text-sm font-semibold">{isPersonalEditorFlow ? "Naskah Editor Pribadi Terbaru" : "Hasil Layout Editorial Terbaru"}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{formatReviewDate(latestEditorialVersion.created_at)}</span>
                </div>
                <div className="pt-3">
                  <RevisionFile label="File Hasil Layout" value={latestEditorialVersion.file_draft_naskah} />
                </div>
                <div className="pt-3">
                  <span className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Catatan Perubahan Editor</span>
                  <p className="text-sm leading-6">{latestEditorialVersion.catatan_perubahan?.trim() || "Tidak ada catatan perubahan"}</p>
                </div>
                {(activeRole === "EDITOR" || naskah.status_saat_ini?.trim().toUpperCase() === "READY_TO_PRINT") && (
                  <div className="mt-5 pt-4 border-t flex items-center gap-2 text-sm" style={{ borderColor: "var(--color-border)", color: naskah.status_saat_ini?.trim().toUpperCase() === "READY_TO_PRINT" ? "#087f73" : "var(--color-text-muted)" }}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border" style={{ borderColor: "currentColor" }} aria-hidden="true">{naskah.status_saat_ini?.trim().toUpperCase() === "READY_TO_PRINT" ? "✓" : "i"}</span>
                    <span>{naskah.status_saat_ini?.trim().toUpperCase() === "READY_TO_PRINT" ? "Naskah telah disetujui dan siap cetak." : "Naskah editorial telah dikirim dan menunggu persetujuan penulis."}</span>
                  </div>
                )}
              </div>
            )}

            {(!latestEditorialVersion || isPersonalEditorFlow || (activeRole === "AUTHOR" && naskah.status_saat_ini?.trim().toUpperCase() !== "READY_TO_PRINT")) && (isAssignedEditor || (activeRole === "AUTHOR" && naskah.status_saat_ini?.trim().toUpperCase() !== "READY_TO_PRINT")) && (
              <form onSubmit={handleEditorialSubmit} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="editorial-note">
                    Catatan Perubahan
                  </label>
                  <textarea
                    id="editorial-note"
                    className={`input-base min-h-28 ${editorialError && !editorialNote.trim() ? "error" : ""}`}
                    value={editorialNote}
                    onChange={(event) => setEditorialNote(event.target.value)}
                    placeholder={isPersonalEditorFlow ? "Jelaskan perubahan pada naskah editor pribadi..." : "Jelaskan perubahan editorial yang dilakukan..."}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="editorial-file">
                    File Draft Naskah
                  </label>
                  <input
                    ref={editorialFileInputRef}
                    id="editorial-file"
                    type="file"
                    className={`input-base ${editorialError && !editorialFile ? "error" : ""}`}
                    onChange={handleEditorialFileChange}
                    required
                  />
                  <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                    Maksimal ukuran file: 50 MB.
                  </p>
                  {editorialFile && <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>File dipilih: {editorialFile.name}</p>}
                </div>
                {editorialError && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{editorialError}</p>}
                {editorialMessage && <p className="text-sm" style={{ color: "var(--color-success)" }}>{editorialMessage}</p>}
                <div className="flex justify-end">
                  <button type="submit" className="btn-primary" disabled={uploadingEditorial}>
                    {uploadingEditorial ? "Mengunggah..." : isPersonalEditorFlow ? "Upload Naskah Editor Pribadi" : activeRole === "AUTHOR" ? "Upload Versi Kedua" : "Unggah Dokumen Editorial"}
                  </button>
                </div>
              </form>
            )}

            {activeRole === "AUTHOR" && !isPersonalEditorFlow && latestEditorialVersion && naskah.status_saat_ini?.trim().toUpperCase() !== "READY_TO_PRINT" && (
              <>
                <div className="flex items-center gap-3 my-5" style={{ color: "var(--color-text-muted)" }}>
                  <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
                  <span className="text-sm font-medium">atau</span>
                  <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
                </div>
                <div className="flex flex-col items-start gap-2">
                  <button type="button" className="btn-primary" onClick={handleApproveEditorial} disabled={approvingEditorial || naskah.status_saat_ini?.trim().toUpperCase() === "READY_TO_PRINT"}>
                    {approvingEditorial ? "Menyetujui..." : "Approve Naskah Editorial"}
                  </button>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Status naskah akan diubah menjadi READY_TO_PRINT.
                  </p>
                </div>
              </>
            )}

            {activeRole !== "EDITOR" && editorialMessage && (!latestEditorialVersion || isPersonalEditorFlow) && <p className="text-sm mb-5" style={{ color: "var(--color-success)" }}>{editorialMessage}</p>}

          </section>
          )}

          {revisionMessage && <p className="rounded-lg border p-4 text-sm" style={{ background: "var(--color-success-pale)", color: "var(--color-success)", borderColor: "#b8d9c3" }}>{revisionMessage}</p>}

          {(activeRole === "AUTHOR" || activeRole === "USER") && naskah.status_saat_ini?.trim().toUpperCase() === "REVISION_REQUIRED" && (
            <section className="card p-6">
              <form onSubmit={handleRevisionSubmit} className="space-y-4">
              <div>
                <h3 className="font-semibold">Upload Revisi Naskah</h3>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  Isi catatan perubahan dan pilih file revisi untuk dikirimkan kepada reviewer.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="revision-note">
                  Catatan perubahan
                </label>
                <textarea
                  id="revision-note"
                  className={`input-base min-h-28 ${revisionError && !revisionNote.trim() ? "error" : ""}`}
                  value={revisionNote}
                  onChange={(event) => setRevisionNote(event.target.value)}
                  placeholder="Jelaskan perubahan yang dilakukan pada naskah..."
                  required
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  htmlFor="revision-file"
                >
                  File draft naskah <span aria-hidden="true">*</span>
                </label>
                <input
                  ref={revisionFileInputRef}
                  id="revision-file"
                  type="file"
                  className={`input-base ${revisionError ? "error" : ""}`}
                  onChange={handleRevisionFileChange}
                  required
                />
                <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                  Maksimal ukuran file: 50 MB.
                </p>
                {revisionFile && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                    File dipilih: {revisionFile.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="revision-profile-file">
                  File profil penulis (opsional)
                </label>
                <input
                  ref={revisionProfileFileInputRef}
                  id="revision-profile-file"
                  type="file"
                  className={`input-base ${revisionError ? "error" : ""}`}
                  onChange={(event) => handleOptionalRevisionFileChange(event, setRevisionProfileFile)}
                />
                {revisionProfileFile && <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>File dipilih: {revisionProfileFile.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="revision-authenticity-file">
                  File surat keaslian (opsional)
                </label>
                <input
                  ref={revisionAuthenticityFileInputRef}
                  id="revision-authenticity-file"
                  type="file"
                  className={`input-base ${revisionError ? "error" : ""}`}
                  onChange={(event) => handleOptionalRevisionFileChange(event, setRevisionAuthenticityFile)}
                />
                {revisionAuthenticityFile && <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>File dipilih: {revisionAuthenticityFile.name}</p>}
              </div>
              {revisionError && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{revisionError}</p>}
              <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={uploadingRevision}>{uploadingRevision ? "Mengirim..." : "Kirim File Revisi"}</button>
              </div>
              </form>
            </section>
          )}
      </div>

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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-25 sm:pt-40">
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

      {showEditorModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-25 sm:pt-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditorModal(false)} />
          <div className="relative card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editorAssignment ? "Edit Editor" : "Tunjuk Editor"}</h2>
              <button type="button" onClick={() => setShowEditorModal(false)} className="text-xl" aria-label="Tutup">×</button>
            </div>
            <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>{naskah.judul_naskah}</p>
            {assignmentError && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>
                {assignmentError}
              </div>
            )}
            <form onSubmit={handleAssignEditor} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="editor-id">Editor</label>
                <select id="editor-id" className="input-base" value={editorId} onChange={(event) => setEditorId(event.target.value)}>
                  <option value="">Pilih editor</option>
                  {editors.map((editor) => (
                    <option key={editor.id} value={editor.id}>{editor.nama} ({editor.email})</option>
                  ))}
                </select>
              </div>
              {editorAssignment && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="editing-status">Status Editing</label>
                  <select id="editing-status" className="input-base" value={editingStatus} onChange={(event) => setEditingStatus(event.target.value)}>
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="editor-instruction">Catatan Instruksi <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>(opsional)</span></label>
                <textarea
                  id="editor-instruction"
                  className="input-base min-h-28"
                  value={editorInstruction}
                  onChange={(event) => setEditorInstruction(event.target.value)}
                  placeholder="Tulis instruksi untuk editor..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowEditorModal(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={assigningEditor}>
                  {assigningEditor ? "Menyimpan..." : editorAssignment ? "Simpan Perubahan" : "Tunjuk Editor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RevisionHistory({ versions }: { versions: NaskahVersion[] }) {
  return (
    <section className="card p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Riwayat Revisi Author</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Dokumen dan catatan perubahan yang pernah dikirim.
        </p>
      </div>
      {versions.length ? (
        <div className="space-y-4">
          {versions.map((version, index) => {
            return (
              <div key={version.id ?? index} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "#fbfcfc" }}>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <span className="text-sm font-semibold">Revisi {version.versi_ke ?? versions.length - index}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{formatReviewDate(version.created_at)}</span>
                </div>
                <div className="pt-3">
                  <RevisionFile label="File Draft Revisi" value={version.file_draft_naskah} />
                </div>
                <div className="pt-3">
                  <span className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Catatan Perubahan</span>
                  <p className="text-sm leading-6">{version.catatan_perubahan?.trim() || "Tidak ada catatan perubahan"}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Belum ada revisi yang dikirim.</p>
      )}
    </section>
  );
}

function RevisionFile({ label, value }: { label: string; value?: string | null }) {
  const fileValue = typeof value === "string" && value.trim() && value !== "Belum diisi" ? value : "";
  const fileUrl = fileValue ? toPublicDocumentUrl(fileValue) : null;
  const fileName = fileValue.split("/").pop() || "";

  return (
    <div>
      <span className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      {fileUrl ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M8 13h8M8 17h6" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" title={fileName}>{fileName}</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Dokumen naskah · {fileName.split(".").pop()?.toUpperCase() || "FILE"}</p>
            </div>
          </div>
          <a href={fileUrl} download={fileName} target="_blank" rel="noreferrer" className="btn-secondary shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            Unduh File
          </a>
        </div>
      ) : (
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Dokumen belum tersedia.</span>
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
          <a href={url} download={fileName} target="_blank" rel="noreferrer" className="btn-secondary mt-3 w-full justify-center">
            Unduh Dokumen
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
