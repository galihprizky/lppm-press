import { Naskah } from "@/app/dashboard/naskah/types";

const FILE_ORIGIN = process.env.NEXT_PUBLIC_FILE_ORIGIN || "https://aplikasilaundryonline.com";

export function getNaskahDocument(
  naskah: Naskah,
  field: "file_draft_naskah" | "file_draft_naskah_revisi" | "file_profile_penulis" | "file_surat_keaslian"
): string | null {
  const directValue = naskah[field as keyof Naskah];
  if (typeof directValue === "string" && directValue.trim()) return toPublicDocumentUrl(directValue);

  if (field === "file_draft_naskah_revisi") {
    const revision = [...(naskah.versi_naskah ?? [])]
      .filter((version) => version.tahap?.trim().toUpperCase() === "REVISI_DOSEN")
      .sort((left, right) => (right.versi_ke ?? 0) - (left.versi_ke ?? 0))
      .find((version) => typeof version.file_draft_naskah === "string" && version.file_draft_naskah.trim() && version.file_draft_naskah !== "Belum diisi");
    if (revision?.file_draft_naskah) return toPublicDocumentUrl(revision.file_draft_naskah);
  }

  for (const version of [...(naskah.versi_naskah ?? [])].reverse()) {
    const value = version[field];
    if (typeof value === "string" && value.trim()) return toPublicDocumentUrl(value);
  }

  return null;
}

export function toPublicDocumentUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${FILE_ORIGIN}/${value.replace(/^\/+/, "")}`;
}
