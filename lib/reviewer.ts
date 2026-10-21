import { ApiListResponse, Naskah } from "@/app/dashboard/naskah/types";
import { API_URL } from "@/lib/config";

export interface ReviewerAssignment {
  reviewer_id: number;
  deadline_review?: string;
}

export interface ReviewerNaskahItem {
  naskah: Naskah;
  assignment: ReviewerAssignment;
}

export async function fetchReviewerNaskahList(reviewerId: number): Promise<ReviewerNaskahItem[]> {
  const response = await fetch(`${API_URL}/naskah`);
  const payload: ApiListResponse<Naskah> = await response.json();
  if (!response.ok) throw new Error(payload.message || "Gagal memuat daftar naskah reviewer.");

  const naskahList = Array.isArray(payload.data) ? payload.data : [];
  return (await Promise.all(naskahList.map(async (naskah) => {
    const assignmentResponse = await fetch(`${API_URL}/penugasan-reviewer/naskah/${naskah.id}`);
    if (!assignmentResponse.ok) return null;

    const assignmentPayload: { data?: ReviewerAssignment[] } = await assignmentResponse.json();
    const assignment = assignmentPayload.data?.find((item) => item.reviewer_id === reviewerId);
    return assignment ? { naskah, assignment } : null;
  }))).filter((item): item is ReviewerNaskahItem => item !== null);
}
