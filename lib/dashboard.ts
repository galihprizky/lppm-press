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

export async function fetchDashboardData(request: DashboardRequest): Promise<DashboardData> {
  const endpoint = request.role === "AUTHOR" || request.role === "USER"
    ? request.userId ? `/naskah/pengusul/${request.userId}` : null
    : request.role === "REVIEWER"
      ? request.userId ? `/naskah/reviewer/${request.userId}` : null
      : "/naskah";

  if (!endpoint) return { naskah: [] };

  const response = await fetch(`${API_URL}${endpoint}`);
  const payload = (await response.json()) as { data?: Naskah[]; message?: string };
  if (!response.ok) throw new Error(payload.message || "Gagal memuat data dashboard.");
  return { naskah: Array.isArray(payload.data) ? payload.data : [] };
}