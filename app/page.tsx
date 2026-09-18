"use client";
// src/app/page.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function Home() {
  const { currentUser, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(currentUser ? "/dashboard" : "/login");
    }
  }, [currentUser, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[var(--color-text-muted)]">Memuat...</p>
      </div>
    </div>
  );
}