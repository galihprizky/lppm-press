import { ApiListResponse, Naskah } from "@/app/dashboard/naskah/types";
import { API_URL } from "@/lib/config";

export async function fetchEditorNaskahList(editorId: number): Promise<Naskah[]> {
  const response = await fetch(`${API_URL}/naskah/editor/${editorId}`);
  const payload: ApiListResponse<Naskah> = await response.json();
  if (!response.ok) throw new Error(payload.message || "Gagal memuat daftar naskah editor.");

  return Array.isArray(payload.data) ? payload.data : [];
}