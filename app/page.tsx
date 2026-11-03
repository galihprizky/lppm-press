"use client";
// src/app/page.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionValue } from "@/lib/storage";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getSessionValue("access_token") ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[var(--color-text-muted)]">Memuat...</p>
      </div>
    </div>
  );
}