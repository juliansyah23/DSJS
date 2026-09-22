import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

/** Skeleton baris tabel selama data dimuat. */
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <tbody aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border/60">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-5 py-4">
              <div className="h-3.5 rounded bg-muted animate-pulse" style={{ width: `${55 + ((r + c) % 4) * 12}%` }} />
            </td>
          ))}
        </tr>
      ))}
      <tr className="sr-only">
        <td colSpan={cols}>Memuat data…</td>
      </tr>
    </tbody>
  );
}

/** Panel error dengan aksi coba lagi. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 grid place-items-center">
        <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Gagal memuat data</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Coba lagi
        </button>
      )}
    </div>
  );
}

/** Placeholder saat hasil kosong. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted border border-border grid place-items-center">
        <Inbox className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{hint}</p>}
      </div>
    </div>
  );
}

/** Blok skeleton untuk kartu statistik dan chart. */
export function BlockSkeleton({ height = 280 }: { height?: number }) {
  return <div className="rounded-2xl bg-muted animate-pulse" style={{ height }} aria-busy="true" aria-label="Memuat" />;
}
