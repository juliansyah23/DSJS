import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  ApiError,
  type AdminApplicationQuery,
  type AdminNotification,
  type AdminUser,
  type AdminUserQuery,
  type ApiApplication,
  type AuditLogEntry,
  type DashboardStats,
  type Pagination,
} from "../app/api";

/** Bentuk state standar untuk semua data admin yang di-fetch. */
export type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.firstValidationMessage();
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan tidak terduga.";
}

/**
 * Generic fetcher: menangani abort saat unmount/param berubah,
 * sehingga tidak ada race condition maupun setState pada komponen mati.
 */
function useAsync<T>(fetcher: (signal: AbortSignal) => Promise<T>, initial: T, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Simpan fetcher di ref agar identitas fungsi tidak memicu efek berulang.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
      })
      .catch((err) => {
        if (controller.signal.aborted || isAbort(err)) return;
        setError(messageOf(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, refresh };
}

/** Menunda perubahan nilai — dipakai agar input pencarian tidak membanjiri API. */
export function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const EMPTY_STATS: DashboardStats = {
  summary: { total: 0, approved: 0, processing: 0, rejected: 0, users: 0 },
  monthly_apps: [],
  status_distribution: [],
  processing_time: [],
  bottlenecks: [],
};

export function useAdminStats(period: number) {
  return useAsync<DashboardStats>((signal) => api.adminStats(period, signal), EMPTY_STATS, [period]);
}

export function useAdminNotifications() {
  return useAsync<AdminNotification[]>((signal) => api.adminNotifications(signal), [], []);
}

const EMPTY_PAGINATION: Pagination = { current_page: 1, last_page: 1, total: 0 };

export function useAdminApplications(query: AdminApplicationQuery) {
  const { search, service_type, status, page, per_page } = query;
  return useAsync<{ applications: ApiApplication[]; pagination: Pagination }>(
    (signal) => api.adminApplications(query, signal),
    { applications: [], pagination: EMPTY_PAGINATION },
    [search, service_type, status, page, per_page],
  );
}

export function useAdminUsers(query: AdminUserQuery) {
  const { search, role, status } = query;
  return useAsync<AdminUser[]>((signal) => api.adminUsers(query, signal), [], [search, role, status]);
}

export function useAdminAuditLogs(perPage = 25, page = 1) {
  return useAsync<{ audit_logs: AuditLogEntry[]; pagination: Pagination }>(
    (signal) => api.adminAuditLogs(perPage, page, signal),
    { audit_logs: [], pagination: EMPTY_PAGINATION },
    [perPage, page],
  );
}
