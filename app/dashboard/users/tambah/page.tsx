"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserForm from "../UserForm";
import { EMPTY_USER_FORM } from "../types";
import type { ApiResponse, UserForm as UserFormData } from "../types";

const API_URL = "http://localhost:3001/users";

export default function TambahUserPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form: UserFormData) => {
    setLoading(true);
    setServerError("");
    try {
      const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, jurusan_id: Number(form.jurusan_id) }) });
      const json: ApiResponse<unknown> = await response.json();
      if (!response.ok) throw new Error(json.message || "Gagal menambahkan user.");
      router.push("/dashboard/users");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Tidak bisa terhubung ke server.");
    } finally { setLoading(false); }
  };

  return <div className="max-w-3xl"><div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}><Link href="/dashboard/users" style={{ color: "var(--color-primary)" }}>Users</Link><span>›</span><span>Tambah User</span></div><h1 className="text-2xl font-bold mb-1">Tambah User Baru</h1><p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>Isi data user dan tentukan role aksesnya.</p><div className="card p-6"><UserForm initialForm={EMPTY_USER_FORM} loading={loading} serverError={serverError} onSubmit={handleSubmit} /></div></div>;
}