"use client";
// src/app/login/page.tsx
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// import { useApp } from "@/context/AppContext";

interface LoginForm {
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof LoginForm, string>>;

export default function LoginPage() {
  // const { login } = useApp();
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.email) e.email = "Email wajib diisi.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid.";
    if (!form.password) e.password = "Password wajib diisi.";
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();

    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setErrors({});
    setServerError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      if (!res.ok) {
        let message = "Email atau password salah.";
        try {
          const err = await res.json();
          if (typeof err?.message === "string" && err.message) {
            message = err.message;
          }
        } catch {}
        setServerError(message);
        return;
      }

      const data: {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        id?: string | number;
        name?: string;
        nama?: string;
      } = await res.json();

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("token_type", data.token_type);
      localStorage.setItem(
        "access_token_expires_at",
        String(Date.now() + data.expires_in * 1000)
      );
      if (data.id !== undefined && data.id !== null) {
        localStorage.setItem("user_id", String(data.id));
      }
      localStorage.setItem("user_name", data.name ?? data.nama ?? "");
      localStorage.setItem("user_email", form.email);

      router.push("/dashboard");
    } catch {
      setServerError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg)" }}>
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12"
        style={{ background: "var(--color-primary)", color: "#fff" }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight">SiMahasiswa</span>
          </div>
        </div>

        <div className="animate-fade-in">
          <h1 className="text-4xl font-bold leading-tight mb-5">
            Sistem Manajemen<br />Data Mahasiswa
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.7" }}>
            Platform terpadu untuk mengelola informasi akademik mahasiswa secara efisien dan terstruktur.
          </p>
          <div className="mt-12 space-y-4">
            {["Manajemen data CRUD mahasiswa", "Pencarian & paginasi real-time", "Antarmuka responsif & modern"].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <span style={{ color: "var(--color-accent)" }}>✦</span>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>
          © 2026 SiMahasiswa. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
            </div>
            <span className="font-semibold" style={{ color: "var(--color-primary)" }}>SiMahasiswa</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">Selamat datang kembali</h2>
          <p className="mb-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Masuk untuk mengakses sistem manajemen mahasiswa
          </p>

          {serverError && (
            <div className="mb-5 p-3 rounded-lg flex items-center gap-2 text-sm animate-fade-in"
              style={{ background: "var(--color-danger-pale)", color: "var(--color-danger)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                className={`input-base ${errors.email ? "error" : ""}`}
                placeholder="nama@kampus.ac.id"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className={`input-base ${errors.password ? "error" : ""}`}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>{errors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : "Masuk"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold" style={{ color: "var(--color-primary)" }}>
              Daftar sekarang
            </Link>
          </p>

          <div className="mt-8 p-4 rounded-lg" style={{ background: "var(--color-primary-pale)", border: "1px solid var(--color-border)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-primary)" }}>Akun Demo:</p>
            <p className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>Email: admin@kampus.ac.id</p>
            <p className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

