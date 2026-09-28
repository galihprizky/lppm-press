export default function NaskahLoading() {
  return (
    <div className="flex min-h-48 items-center justify-center" aria-label="Memuat halaman naskah">
      <div className="flex items-center gap-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
        <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        Memuat data naskah...
      </div>
    </div>
  );
}