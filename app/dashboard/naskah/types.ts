export interface Naskah {
  id: number;
  pengusul_id: string;
  judul_naskah: string;
  sinopsis: string;
  jenis_buku: string;
  target_pembaca: string[];
  nama_semua_penulis: string;
  warna_isi_buku: string;
  pake_editor_pribadi: boolean;
  status_cover: string;
  status_saat_ini: string;
  created_at?: string | Record<string, unknown>;
  file_draft_naskah?: string | null;
  file_draft_naskah_revisi?: string | null;
  file_profile_penulis?: string | null;
  file_surat_keaslian?: string | null;
  versi_naskah?: NaskahVersion[];
  hasil_review?: unknown[];
}

export interface NaskahVersion {
  id?: number;
  tahap?: string;
  versi_ke?: number;
  catatan_perubahan?: string | null;
  created_at?: string | Record<string, unknown>;
  file_draft_naskah?: string | null;
  file_draft_naskah_revisi?: string | null;
  file_profile_penulis?: string | null;
  file_surat_keaslian?: string | null;
}

export interface NaskahForm {
  pengusul_id: string;
  judul_naskah: string;
  sinopsis: string;
  jenis_buku: string;
  target_pembaca: string[];
  nama_semua_penulis: string;
  warna_isi_buku: string;
  pake_editor_pribadi: boolean;
  status_cover: string;
  status_saat_ini: string;
  file_draft_naskah?: File | null;
  file_profile_penulis?: File | null;
  file_surat_keaslian?: File | null;
}

export interface ApiListResponse<T> {
  statusCode?: number;
  message?: string;
  data?: T[];
}

export const TARGET_PEMBACA_OPTIONS = ["Mahasiswa", "Dosen", "Umum"] as const;

export function toApiTargetPembaca(target: string): string {
  return target === "Dosen" ? "Akademisi" : target;
}
export const JENIS_BUKU_OPTIONS = [
  "Buku Referensi",
  "Buku Ajar",
  "Monograf",
  "Modul",
] as const;
export const VISIBLE_JENIS_BUKU_OPTIONS = JENIS_BUKU_OPTIONS.filter((item) => item === "Buku Referensi" || item === "Buku Ajar");
export const MAX_NASKAH_FILE_SIZE = 50 * 1024 * 1024;
export const WARNA_ISI_OPTIONS = ["Hitam Putih", "Berwarna"] as const;
export const STATUS_COVER_OPTIONS = ["Sudah", "Belum"] as const;
export const STATUS_SAAT_INI_OPTIONS = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUIRED",
  "PUBLISHED",
  "REJECTED",
] as const;

export const EDITABLE_NASKAH_STATUSES = ["SUBMITTED", "REVISION_REQUIRED", "REJECTED", "DITOLAK"] as const;

export function formatStatusLabel(status?: string | null): string {
  if (!status) return "-";
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface StatusColors {
  background: string;
  color: string;
  border: string;
  borderColor: string;
}

export function getStatusColors(status?: string | null): StatusColors | undefined {
  const normalizedStatus = status?.trim().toUpperCase();
  if (!normalizedStatus) return undefined;

  if (["REJECTED", "DITOLAK"].includes(normalizedStatus)) {
    return { background: "#fdf0ee", color: "#c0392b", border: "1.5px solid #f1c2bd", borderColor: "#f1c2bd" };
  }
  if (["REVISION_REQUIRED", "REVISI", "REVISI_MINOR", "REVISI_MAYOR", "REVISI_MAJOR"].includes(normalizedStatus)) {
    return { background: "#fff4df", color: "#b36b00", border: "1.5px solid #f2d39a", borderColor: "#f2d39a" };
  }
  if (["APPROVED", "PUBLISHED", "DITERIMA"].includes(normalizedStatus)) {
    return { background: "#eafaf1", color: "#1e8449", border: "1.5px solid #b8d9c3", borderColor: "#b8d9c3" };
  }
  if (normalizedStatus === "READY_TO_PRINT") {
    return { background: "#e8f7f5", color: "#087f73", border: "1.5px solid #9edbd4", borderColor: "#9edbd4" };
  }
  if (["REVIEW", "UNDER_REVIEW"].includes(normalizedStatus)) {
    return { background: "#fff8cc", color: "#9a6700", border: "1.5px solid #e8c84a", borderColor: "#e8c84a" };
  }
  return { background: "#e8f4fd", color: "#1565c0", border: "1.5px solid #b9dcf7", borderColor: "#b9dcf7" };
}

export function canEditNaskah(status: string | null | undefined): boolean {
  return EDITABLE_NASKAH_STATUSES.includes(status as (typeof EDITABLE_NASKAH_STATUSES)[number]);
}

export function canUploadRevision(status: string | null | undefined): boolean {
  const normalizedStatus = status?.trim().toUpperCase();
  return normalizedStatus === "REVISION_REQUIRED" || normalizedStatus === "REVISI";
}

export function canManageNaskah(role: string | null | undefined): boolean {
  const normalizedRole = role?.trim().toUpperCase();
  return normalizedRole === "LPPM" || normalizedRole === "AUTHOR";
}
