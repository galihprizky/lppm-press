export const ACTIVE_ROLE_STORAGE_KEY = "role_aktif";

function toRoleName(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;

  const role = value as Record<string, unknown>;
  const name = role.nama_role ?? role.name ?? role.role_name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

export function normalizeRoleNames(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => {
    const name = toRoleName(item);
    return name ? [name] : [];
  });
}

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
    return normalizeRoleNames(roles);
  } catch {
    return [];
  }
}
