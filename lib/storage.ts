export const ACTIVE_ROLE_STORAGE_KEY = "role_aktif";

const SESSION_KEYS = [
  "access_token",
  "refresh_token",
  "token_type",
  "access_token_expires_at",
  "user_id",
  "user_name",
  "user_roles",
  "user_role_names",
  "user_role_name",
  "user_email",
  ACTIVE_ROLE_STORAGE_KEY,
] as const;

export function getSessionValue(key: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${encodeURIComponent(key)}=`));

  return cookie ? decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1)) : null;
}

export function setSessionValue(key: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}

export function removeSessionValue(key: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
}

export function clearSession(): void {
  SESSION_KEYS.forEach(removeSessionValue);
}

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
  return getSessionValue(ACTIVE_ROLE_STORAGE_KEY);
}

export function getUserRoleNames(): string[] {
  const storedRoles =
    getSessionValue("user_role_name") ??
    getSessionValue("user_role_names");

  if (!storedRoles) return [];

  try {
    const roles = JSON.parse(storedRoles);
    return normalizeRoleNames(roles);
  } catch {
    return [];
  }
}
