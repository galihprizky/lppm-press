import { Naskah } from "@/app/dashboard/naskah/types";
import { API_URL } from "@/lib/config";

export type DashboardRole = "LPPM" | "AUTHOR" | "USER" | "REVIEWER" | "EDITOR";

export interface DashboardData {
  naskah: Naskah[];
}

export interface DashboardRequest {
  role: DashboardRole;
  userId: string | null;
}

export const DASHBOARD_ENDPOINTS: Record<DashboardRole, string> = {
  LPPM: "",
  AUTHOR: "",
  USER: "",
  REVIEWER: "",
  EDITOR: "",
};

const dummyNaskah: Naskah[] = [
  {
    id: 1,
    pengusul_id: "2",
    judul_naskah: "Sejarah FIK",
    sinopsis: "Data dummy naskah untuk dashboard.",
    jenis_buku: "Buku Referensi",
    target_pembaca: ["Mahasiswa"],
    nama_semua_penulis: "User Biasa",
    warna_isi_buku: "Hitam Putih",
    pake_editor_pribadi: true,
    status_cover: "Sudah",
    status_saat_ini: "SUBMITTED",
    created_at: "2026-10-21",
  },
  {
    id: 2,
    pengusul_id: "3",
    judul_naskah: "Dasar-Dasar Penelitian",
    sinopsis: "Data dummy naskah untuk dashboard.",
    jenis_buku: "Buku Ajar",
    target_pembaca: ["Dosen"],
    nama_semua_penulis: "Penulis Akademik",
    warna_isi_buku: "Berwarna",
    pake_editor_pribadi: false,
    status_cover: "Belum",
    status_saat_ini: "UNDER_REVIEW",
    created_at: "2026-10-20",
  },
  {
    id: 3,
    pengusul_id: "2",
    judul_naskah: "Modul Pembelajaran",
    sinopsis: "Data dummy naskah untuk dashboard.",
    jenis_buku: "Modul",
    target_pembaca: ["Mahasiswa"],
    nama_semua_penulis: "User Biasa",
    warna_isi_buku: "Berwarna",
    pake_editor_pribadi: false,
    status_cover: "Belum",
    status_saat_ini: "REVISION_REQUIRED",
    created_at: "2026-10-19",
  },
];

function getDummyNaskah({ role, userId }: DashboardRequest): Naskah[] {
  switch (role) {
    case "AUTHOR":
    case "USER":
      return dummyNaskah.filter((item) => item.pengusul_id === userId);
    case "REVIEWER":
      return dummyNaskah.filter((item) => item.id === 1 || item.status_saat_ini === "UNDER_REVIEW");
    case "EDITOR":
      return dummyNaskah.filter((item) => item.status_saat_ini === "REVISION_REQUIRED" || item.status_saat_ini === "UNDER_REVIEW");
    case "LPPM":
    default:
      return dummyNaskah;
  }
}

export async function fetchDashboardData(request: DashboardRequest): Promise<DashboardData> {
  const endpoint = DASHBOARD_ENDPOINTS[request.role];

  if (endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error("Gagal memuat data dashboard.");
    const payload = (await response.json()) as DashboardData;
    return { naskah: Array.isArray(payload.naskah) ? payload.naskah : [] };
  }

  return { naskah: getDummyNaskah(request) };
}