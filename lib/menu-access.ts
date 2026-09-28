export type AppRole = "LPPM" | "EDITOR" | "AUTHOR" | "REVIEWER";

export type MenuKey = "dashboard" | "naskah" | "roles" | "users" | "profil" | "fakultas-jurusan";

const STANDARD_MENU: readonly MenuKey[] = ["dashboard", "naskah", "profil"];

export const MENU_ACCESS_BY_ROLE: Record<AppRole, readonly MenuKey[]> = {
  LPPM: ["dashboard", "naskah", "roles", "users", "profil", "fakultas-jurusan"],
  EDITOR: STANDARD_MENU,
  AUTHOR: STANDARD_MENU,
  REVIEWER: STANDARD_MENU,
};

export function getAllowedMenuKeys(role: string | null): readonly MenuKey[] {
  const normalizedRole = role?.trim().toUpperCase() as AppRole | undefined;

  return MENU_ACCESS_BY_ROLE[normalizedRole ?? "AUTHOR"] ?? STANDARD_MENU;
}
