"use client";
// src/app/dashboard/profil/page.tsx
import { useState, FormEvent } from "react";
import { useApp } from "@/context/AppContext";

interface ProfileForm {
  name: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;
type PasswordErrors = Partial<Record<keyof PasswordForm, string>>;

const formatDate = (d?: string): string =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default function ProfilPage() {
  const { currentUser, updateProfile } = useApp();

  const [form, setForm] = useState<ProfileForm>({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
  });
  const [passForm, setPassForm] = useState<PasswordForm>({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [passErrors, setPassErrors] = useState<PasswordErrors>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleProfileSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: ProfileErrors = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi.";
    if (!form.email) e.email = "Email wajib diisi.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid.";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    updateProfile({ name: form.name, email: form.email });
    setLoading(false);
    setSuccessMsg("Profil berhasil diperbarui!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handlePassSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: PasswordErrors = {};
    if (!passForm.currentPassword) e.currentPassword = "Password saat ini wajib diisi.";
    else if (passForm.currentPassword !== currentUser?.password) e.currentPassword = "Password saat ini tidak sesuai.";
    if (!passForm.newPassword) e.newPassword = "Password baru wajib diisi.";
    else if (passForm.newPassword.length < 6) e.newPassword = "Password minimal 6 karakter.";
    if (!passForm.confirmPassword) e.confirmPassword = "Konfirmasi password wajib diisi.";
    else if (passForm.newPassword !== passForm.confirmPassword) e.confirmPassword = "Password tidak cocok.";
    if (Object.keys(e).length) { setPassErrors(e); return; }
    setPassErrors({});
    setPassLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    updateProfile({ password: passForm.newPassword });
    setPassLoading(false);
    setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPassSuccess("Password berhasil diubah!");
    setTimeout(() => setPassSuccess(""), 3000);
  };

  const passFields: { key: keyof PasswordForm; label: string }[] = [
    { key: "currentPassword", label: "Password Saat Ini" },
    { key: "newPassword", label: "Password Baru" },
    { key: "confirmPassword", label: "Konfirmasi Password Baru" },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Profil Saya</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        Kelola informasi akun dan keamanan Anda.
      </p>

      {/* Profile card */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ background: "var(--color-primary)" }}>
            {currentUser?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{currentUser?.name}</p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{currentUser?.email}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Bergabung {formatDate(currentUser?.register_date)}
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm"
            style={{ background: "var(--color-success-pale)", color: "var(--color-success)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {successMsg}
          </div>
        )}

        <h2 className="font-semibold text-xs uppercase tracking-wider mb-4" style={{ color: "var(--color-text-muted)" }}>
          Informasi Profil
        </h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
            <input
              className={`input-base ${errors.name ? "error" : ""}`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              className={`input-base ${errors.email ? "error" : ""}`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.email}</p>}
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
            ) : "Simpan Perubahan"}
          </button>
        </form>
      </div>

      {/* Change password card */}
      <div className="card p-6">
        <h2 className="font-semibold text-xs uppercase tracking-wider mb-4" style={{ color: "var(--color-text-muted)" }}>
          Ubah Password
        </h2>

        {passSuccess && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm"
            style={{ background: "var(--color-success-pale)", color: "var(--color-success)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {passSuccess}
          </div>
        )}

        <form onSubmit={handlePassSubmit} className="space-y-4" noValidate>
          {passFields.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input
                type="password"
                className={`input-base ${passErrors[key] ? "error" : ""}`}
                value={passForm[key]}
                onChange={(e) => setPassForm({ ...passForm, [key]: e.target.value })}
              />
              {passErrors[key] && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{passErrors[key]}</p>}
            </div>
          ))}
          <button type="submit" className="btn-primary" disabled={passLoading}>
            {passLoading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
            ) : "Ubah Password"}
          </button>
        </form>
      </div>
    </div>
  );
}