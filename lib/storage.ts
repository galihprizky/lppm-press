export const ACTIVE_ROLE_STORAGE_KEY = "role_aktif";

export function getActiveRole(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
}

export function getUserRoleNames(): string[] {
  if (typeof window === "undefined") return [];

  const storedRoles =
    localStorage.getItem("user_role_name") ??
    localStorage.getItem("user_role_names");

  if (!storedRoles) return [];

  try {
    const roles = JSON.parse(storedRoles);
    return Array.isArray(roles)
      ? roles.filter((role): role is string => typeof role === "string")
      : [];
  } catch {
    return [];
  }
}
