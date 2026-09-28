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
export const WARNA_ISI_OPTIONS = ["Hitam Putih", "Berwarna"] as const;
export const STATUS_COVER_OPTIONS = ["Sudah", "Belum"] as const;
export const STATUS_SAAT_INI_OPTIONS = ["SUBMITTED", "REVIEW", "REVISI", "APPROVED"] as const;

export const EDITABLE_NASKAH_STATUSES = ["SUBMITTED", "REVISI"] as const;

export function canEditNaskah(status: string | null | undefined): boolean {
  return EDITABLE_NASKAH_STATUSES.includes(status as (typeof EDITABLE_NASKAH_STATUSES)[number]);
}

export function canManageNaskah(role: string | null | undefined): boolean {
  const normalizedRole = role?.trim().toUpperCase();
  return normalizedRole === "LPPM" || normalizedRole === "AUTHOR";
}
