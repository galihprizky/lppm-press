"use client";
// src/app/dashboard/layout.tsx
import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getAllowedMenuKeys } from "@/lib/menu-access";
import {
  ACTIVE_ROLE_STORAGE_KEY,
  getActiveRole,
  getUserRoleNames,
} from "@/lib/storage";

interface NavItem {
  key: "dashboard" | "naskah" | "roles" | "users" | "profil" | "fakultas-jurusan" | "reviewer";
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    key: "naskah",
    href: "/dashboard/naskah",
    label: "Pengajuan Naskah",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    key: "roles",
    href: "/dashboard/roles",
    label: "Roles",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    key: "users",
    href: "/dashboard/users",
    label: "Users",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0116 0" />
      </svg>
    ),
  },
  {
    key: "fakultas-jurusan",
    href: "/dashboard/fakultas-jurusan",
    label: "Fakultas dan Jurusan",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /><path d="M9 9h.01M12 9h.01M15 9h.01" />
      </svg>
    ),
  },
  {
    key: "profil",
    href: "/dashboard/profil",
    label: "Profil Saya",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: "reviewer",
    href: "/dashboard/reviewer",
    label: "Review Naskah",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
        <path d="M8 8h8M8 12h5M8 16h3" />
      </svg>
    ),
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("User");
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedEmail = localStorage.getItem("user_email");

    if (token) {
      setIsAuthenticated(true);
      setActiveRole(getActiveRole());
      setUserRoles(getUserRoleNames());
      if (storedEmail) setUserEmail(storedEmail);
    } else {
      router.replace("/login");
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("access_token_expires_at");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_roles");
    localStorage.removeItem("user_role_names");
    localStorage.removeItem("user_role_name");
    localStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY);
    router.push("/login");
  };

  const handleRoleChange = (role: string) => {
    localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, role);
    setActiveRole(role);
    setRolePickerOpen(false);
    router.push("/dashboard");
    router.refresh();
  };

  const SidebarContent = ({ onClose }: SidebarProps) => (
    <>
      <div className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm">LPPM PRESS</div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Website Penerbit LPPM</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.filter((item) => getAllowedMenuKeys(activeRole).includes(item.key)).map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? "var(--color-primary-pale)" : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-text-muted)",
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: "var(--color-border)" }}>
        <button
          type="button"
          onClick={() => setRolePickerOpen((isOpen) => !isOpen)}
          className="flex items-center gap-3 mb-3 w-full text-left p-2 rounded-lg border transition-colors hover:bg-[var(--color-bg)]"
          style={{ borderColor: rolePickerOpen ? "#b8d9c3" : "var(--color-border)" }}
          aria-expanded={rolePickerOpen}
          aria-haspopup="dialog"
          title="Ganti role aktif"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: "var(--color-primary)" }}>
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{userEmail}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[0.65rem] uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Role aktif</span>
              <span
                className="inline-flex max-w-[7rem] truncate rounded-md px-1.5 py-0.5 text-[0.65rem] font-bold"
                style={{ background: "var(--color-primary-pale)", color: "var(--color-primary)" }}
              >
                {activeRole || "Pilih role"}
              </span>
            </div>
          </div>
          <svg
            className={`w-4 h-4 flex-shrink-0 transition-transform ${rolePickerOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--color-text-muted)" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {rolePickerOpen && (
          <div
            role="dialog"
            aria-label="Pilih role aktif"
            className="mb-3 p-3 rounded-lg"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
          >
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>
              Pilih role aktif
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {userRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm"
                  style={{
                    background: role === activeRole ? "var(--color-primary-pale)" : "transparent",
                    color: role === activeRole ? "var(--color-primary)" : "var(--color-text)",
                  }}
                >
                  {role}
                </button>
              ))}
              {userRoles.length === 0 && (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Belum ada role tersedia.
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="btn-secondary w-full justify-center text-xs py-2"
          style={{ color: "var(--color-danger)" }}
        >
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg)" }}>
      <aside
        className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0"
        style={{ background: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}
      >
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden"
            style={{ background: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}
          >
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      <div className="flex-1 lg:pl-64">
        <header
          className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
        >
          <button onClick={() => setSidebarOpen(true)} style={{ color: "var(--color-text)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-semibold text-sm" style={{ color: "var(--color-primary)" }}>LPPM PRESS</span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "var(--color-primary)" }}>
            {userEmail.charAt(0).toUpperCase()}
          </div>
        </header>

        <main key={activeRole ?? "no-active-role"} className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}